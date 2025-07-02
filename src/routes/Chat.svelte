<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Chatroom from '$lib/components/Chatroom.svelte';
	import type { Message } from '$lib/types';
	import { recognizer, Synthesizer } from '$lib/azure/speech';
	import { chat } from '$lib/azure/chat';
	import { contentScore } from '$lib/azure/contentScore';
	import { getSuggestions } from '$lib/azure/suggestions';
	import SpeechReport from '$lib/components/SpeechReport.svelte';

	let { topic, proficiency = 'A1', silenceTimeoutMs = 1000 } = $props();

	let conversation = $state<Message[]>([]);
	let speakingProbability = $state<number>(0);
	let synthesizer = $state<Synthesizer | undefined>(undefined);

	// Move suggestions state to Chat component
	let suggestions = $state<string[]>([]);
	let loadingSuggestions = $state(false);
	let lastAssistantMessageIndex = $state(-1);
	let processingAssistantResponse = $state(false);
	let proficiencyLevel = $state<string>(proficiency);

	let report = $state({
		accuracyScore: 0,
		fluencyScore: 0,
		prosodyScore: 0,
		grammarScore: 0,
		vocabularyScore: 0,
		accuracyItemNumber: 0,
		fluencyItemNumber: 0,
		prosodyItemNumber: 0,
		grammarItemNumber: 0,
		vocabularyItemNumber: 0
	});
	let showReport = $state(false);
	let loading = $state(true);

	async function loadSuggestions() {
		if (conversation.length < 2) return;

		try {
			const lastMessage = conversation[conversation.length - 1];

			// Only load suggestions if the last message is from the the assistant
			if (lastMessage.self) return;
			else {
				loadingSuggestions = true;
				suggestions = []; // Clear existing suggestions while loading
				const newSuggestions = await getSuggestions(conversation, proficiencyLevel);

				// Only update suggestions if the last message is still from the assistant
				if (!lastMessage.self) {
					suggestions = newSuggestions;
				}
			}
		} catch (error) {
			console.error('Failed to get suggestions:', error);
			suggestions = [];
		} finally {
			loadingSuggestions = false;
		}
	}

	async function handleResponse(proficiency: string) {
		proficiencyLevel = proficiency; // Update current proficiency level

		conversation.push({
			name: synthesizer?.name || 'Assistant',
			content: '',
			self: false
		});
		loading = false;

		lastAssistantMessageIndex = conversation.length - 1;
		processingAssistantResponse = true;
		suggestions = [];

		await chat(
			conversation.filter((m) => !m.ignore),
			proficiency,
			synthesizer?.name || 'Cool English Assistant',
			(content) => {
				conversation[lastAssistantMessageIndex].content += content;
				synthesizer?.synthesize(content);
			}
		);

		// Mark assistant response as complete
		processingAssistantResponse = false;
	}

	onMount(async () => {
		synthesizer = await Synthesizer.create();
		if (topic) {
			conversation.push({
				name: 'Background',
				content: topic,
				self: false,
				hidden: true
			});

			conversation.push({
				name: synthesizer.name,
				content: '',
				self: false
			});

			await chat(
				conversation.filter((m) => !m.ignore),
				proficiency,
				synthesizer?.name || 'Cool English Assistant',
				(content) => {
					conversation[conversation.length - 1].content += content;
					synthesizer?.synthesize(content);
				}
			);
		}
	});

	onDestroy(async () => {
		await recognizer.stop();
		await synthesizer?.stop();
	});

	async function record(proficiency: string) {
		proficiencyLevel = proficiency; // Update current proficiency level
		let latestUserMessageIndex = 0;
		let speechStarted = false;

		await recognizer.start({
			onVolumeChange(volume) {
				speakingProbability = Math.min(1, volume * 4);
			},
			onSpeechStart() {
				loading = true;
				conversation.push({
					name: 'You',
					content: '',
					self: true
				});
				latestUserMessageIndex = conversation.length - 1;
				synthesizer?.interrupt();

				loadingSuggestions = false;
				speechStarted = true;
			},
			onSpeechUpdate(text) {
				conversation[latestUserMessageIndex].content = text;
			},
			async onSpeechEnd(text) {
				conversation[latestUserMessageIndex].content = text;

				const content_score_result = await contentScore(conversation);
				report.grammarScore =
					(report.grammarScore * report.grammarItemNumber +
						content_score_result.grammar * conversation[latestUserMessageIndex].content.length) /
					(report.grammarItemNumber + conversation[latestUserMessageIndex].content.length);
				report.grammarItemNumber += conversation[latestUserMessageIndex].content.length;

				report.vocabularyScore =
					(report.vocabularyScore * report.vocabularyItemNumber +
						content_score_result.vocabulary * conversation[latestUserMessageIndex].content.length) /
					(report.vocabularyItemNumber + conversation[latestUserMessageIndex].content.length);
				report.vocabularyItemNumber += conversation[latestUserMessageIndex].content.length;

				// Handle assistant response
				handleResponse(proficiency);
			},
			onPronunciationAssessed(result) {
				conversation[latestUserMessageIndex].result = result;

				report.accuracyScore =
					(report.accuracyScore * report.accuracyItemNumber +
						result.accuracyScore * conversation[latestUserMessageIndex].content.length) /
					(report.accuracyItemNumber + conversation[latestUserMessageIndex].content.length);
				report.accuracyItemNumber += conversation[latestUserMessageIndex].content.length;
				report.fluencyScore =
					(report.fluencyScore * report.fluencyItemNumber +
						result.fluencyScore * conversation[latestUserMessageIndex].content.length) /
					(report.fluencyItemNumber + conversation[latestUserMessageIndex].content.length);
				report.fluencyItemNumber += conversation[latestUserMessageIndex].content.length;
				// prosodyScore 過濾：如果本次韻律感為 0，且準確度或流暢度大於 0，則不納入累積
				if (!(result.prosodyScore === 0 && (result.accuracyScore > 0 || result.fluencyScore > 0))) {
					report.prosodyScore =
						(report.prosodyScore * report.prosodyItemNumber +
							result.prosodyScore * conversation[latestUserMessageIndex].content.length) /
						(report.prosodyItemNumber + conversation[latestUserMessageIndex].content.length);
					report.prosodyItemNumber += conversation[latestUserMessageIndex].content.length;
				}
			},
			topic,
			silenceTimeoutMs
		});

		return async (showReportWhenStopped = true) => {
			await recognizer.stop();

			// 如果完全沒講話（沒觸發 onSpeechStart），也要顯示 0 分報告，但只在需要顯示報告時
			if (!speechStarted && showReportWhenStopped) {
				loading = false;
				showReport = true;
				return;
			}

			// Only show the report if requested
			if (showReportWhenStopped) {
				showReport = true;
			}
		};
	}

	function handleSuggestionClick(suggestion: string) {
		// 關閉建議面板（如果有 showSuggestionsPanel 變數）
		// showSuggestionsPanel = false; // 若需要
		// 直接送出建議句子
		conversation.push({
			name: 'You',
			content: suggestion,
			self: true
		});
		loading = true;
		// 觸發評分與回應
		handleResponse(proficiencyLevel);
	}
</script>

<Chatroom
	{conversation}
	{record}
	{speakingProbability}
	{suggestions}
	{loadingSuggestions}
	{loadSuggestions}
	{proficiencyLevel}
	onSuggestionClick={handleSuggestionClick}
/>

{#if showReport && !loading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="mx-4 w-full max-w-2xl rounded-lg bg-white p-8">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Your Speaking Report</h2>
				<button class="text-gray-500 hover:text-gray-700" onclick={() => (showReport = false)}>
					✕
				</button>
			</div>
			<SpeechReport
				prosodyScore={report.prosodyScore}
				fluencyScore={report.fluencyScore}
				accuracyScore={report.accuracyScore}
				grammarScore={report.grammarScore}
				vocabularyScore={report.vocabularyScore}
			/>
		</div>
	</div>
{:else if showReport && loading}
	<!-- spin animation -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="mx-4 w-full max-w-2xl rounded-lg bg-white p-8">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-2xl font-bold">Your Speaking Report</h2>
				<button class="text-gray-500 hover:text-gray-700" onclick={() => (showReport = false)}>
					✕
				</button>
			</div>
			<div class="flex justify-center">
				<div
					class="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"
				></div>
			</div>
		</div>
	</div>
{/if}
