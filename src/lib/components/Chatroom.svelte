<script lang="ts">
	import { Button, Card, Tooltip } from 'flowbite-svelte';
	import { Mic, Square, CheckCircle } from 'lucide-svelte';
	import AudioPlayer from './AudioPlayer.svelte';
	import type { Message } from '$lib/types';
	import ResultMessage from './ResultMessage.svelte';
	import SummaryReport from './SummaryReport.svelte';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	const BUTTON_SIZE = 36; // px
	const BUTTON_MARGIN = 24; // px (1.5rem)
	const PANEL_WIDTH = 150;
	const PANEL_HEIGHT = 100; 


	let {
		record,
		conversation,
		autoscroll = true,
		speakingProbability = 0,
		suggestions = [],
		loadingSuggestions = false,
		loadSuggestions,
		proficiencyLevel = 'A1',
		onSuggestionClick = undefined
	}: {
		record?: (
			selectedProficiency: string
		) => Promise<(showReportWhenStopped?: boolean) => Promise<void>>;
		conversation: Message[];
		autoscroll?: boolean;
		speakingProbability?: number;
		suggestions?: string[];
		loadingSuggestions?: boolean;
		loadSuggestions?: () => Promise<void>;
		proficiencyLevel?: string;
		onSuggestionClick?: (suggestion: string) => void;
	} = $props();

	let operating = $state(false);
	let recording = $state(false);
	let stopRecording: ((showReportWhenStopped?: boolean) => Promise<void>) | undefined =
		$state(undefined);
	let messagesContainer: HTMLDivElement;
	let showSuggestionsPanel = $state(false);
	let suggestionSending = $state(false);
	let showSuggestionsLoading = $state(false);
	let showResultPanel = $state(false);
	let loadingFeedback = $state(false);
	let panelPosition = $state({ right: 0, down: 0 });
	let panelOffset = { x: 0, y: 0 };

	// Result panel data
	let resultData = $state({
		pronunciation: {
			accuracyScore: 0,
			fluencyScore: 0,
			prosodyScore: 0,
			feedback:
				'Try to practice more on word stress and intonation. Focus on speaking clearly and at a natural pace.'
		},
		content: {
			grammarScore: 0,
			vocabularyScore: 0,
			feedback:
				'Work on using a wider range of vocabulary and sentence structures. Try to use more complex grammar when appropriate.'
		}
	});

	// 拖曳建議按鈕相關狀態
	let buttonPosition = $state({ left: 0, top: 0 }); // 初始位置
	let isDragging = $state(false);
	let dragOffset = { x: 0, y: 0 };
	let dragMoved = false;

	onMount(() => {
		buttonPosition = {
			left: window.innerWidth - BUTTON_MARGIN - BUTTON_SIZE,
			top: window.innerHeight - BUTTON_MARGIN - BUTTON_SIZE
		};
		panelPosition = {
			right: buttonPosition.left + BUTTON_SIZE,
			down: buttonPosition.top + BUTTON_SIZE    
		};
	});

	function handleSuggestionBtnMouseDown(event: MouseEvent | TouchEvent) {
		const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
		const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

		// 計算 panel 與 button 的初始偏移
		panelOffset = {
			x: clientX - buttonPosition.left,
			y: clientY - buttonPosition.top
		};

		// 開始拖曳
		startDragging(
			clientX,
			clientY,
			buttonPosition.left,
			buttonPosition.top,
			(x, y) => {
				buttonPosition.left = x;
				buttonPosition.top = y;
				panelPosition.right = window.innerWidth - (x + BUTTON_SIZE);
				panelPosition.down = window.innerHeight - (y + BUTTON_SIZE);
			}
		);
		event.preventDefault();
	}

	function startDragging(
		clientX: number,
		clientY: number,
		currentLeft: number,
		currentTop: number,
		onDrag: (x: number, y: number) => void
	) {
		isDragging = true;
		dragMoved = false;
		dragOffset = {
			x: clientX - currentLeft,
			y: clientY - currentTop
		};

		function move(e: MouseEvent | TouchEvent) {
			const moveX = 'touches' in e ? e.touches[0].clientX : e.clientX;
			const moveY = 'touches' in e ? e.touches[0].clientY : e.clientY;

			if (!isDragging) return;
			const newLeft = Math.max(BUTTON_MARGIN, Math.min(window.innerWidth - BUTTON_SIZE - BUTTON_MARGIN, moveX - dragOffset.x));
			const newTop = Math.max(BUTTON_MARGIN, Math.min(window.innerHeight - BUTTON_SIZE - BUTTON_MARGIN, moveY - dragOffset.y));
			onDrag(newLeft, newTop);
			dragMoved = true;
		}

		function up() {
			isDragging = false;
			window.removeEventListener('mousemove', move as any);
			window.removeEventListener('mouseup', up);
			window.removeEventListener('touchmove', move as any);
			window.removeEventListener('touchend', up);
		}

		window.addEventListener('mousemove', move as any);
		window.addEventListener('mouseup', up);
		window.addEventListener('touchmove', move as any);
		window.addEventListener('touchend', up);
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging) return;
		let newLeft = event.clientX - dragOffset.x;
		let newTop = event.clientY - dragOffset.y;
		// 限制按鈕不會超出視窗範圍
		newLeft = Math.max(
			BUTTON_MARGIN,
			Math.min(window.innerWidth - BUTTON_SIZE - BUTTON_MARGIN, newLeft)
		);
		newTop = Math.max(
			BUTTON_MARGIN,
			Math.min(window.innerHeight - BUTTON_SIZE - BUTTON_MARGIN, newTop)
		);
		buttonPosition = {
			left: newLeft,
			top: newTop
		};
		dragMoved = true;
	}

	function handleMouseUp() {
		isDragging = false;
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}

	// 綁定全域 mousemove/mouseup
	$effect(() => {
		if (isDragging) {
			window.addEventListener('mousemove', handleMouseMove);
			window.addEventListener('mouseup', handleMouseUp);
			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				window.removeEventListener('mouseup', handleMouseUp);
			};
		}
	});

	function scrollToBottom(times = 5) {
		if (!messagesContainer || !autoscroll) return;
		messagesContainer.scrollTop = messagesContainer.scrollHeight;
		if (times > 1) {
			requestAnimationFrame(() => scrollToBottom(times - 1));
		}
	}

	$effect(() => {
		const last = conversation[conversation.length - 1];
		if (last && last.content) {
			scrollToBottom(5);
		}
	});

	async function handleRecord() {
		if (operating) return;
		if (recording && stopRecording) {
			operating = true;
			await stopRecording(true);
			stopRecording = undefined;
			recording = false;
			operating = false;
			return;
		}
		operating = true;
		recording = true;
		stopRecording = await record?.(proficiencyLevel);
		operating = false;
	}

	async function endConversation() {
		// If currently recording, stop it first
		if (recording && stopRecording) {
			operating = true;
			// Pass false to stopRecording to prevent showing the individual speech report
			await stopRecording(false);
			stopRecording = undefined;
			recording = false;
			operating = false;
		}

		// Set loading state
		loadingFeedback = true;

		// Calculate scores based on conversation data
		let totalAccuracy = 0;
		let totalFluency = 0;
		let totalProsody = 0;
		let messagesWithResults = 0;

		for (const message of conversation) {
			if (message.self && message.result) {
				totalAccuracy += message.result.accuracyScore || 0;
				totalFluency += message.result.fluencyScore || 0;
				totalProsody += message.result.prosodyScore || 0;
				messagesWithResults++;
			}
		}

		// Calculate averages (if there are results)
		if (messagesWithResults > 0) {
			resultData.pronunciation.accuracyScore = Math.round(totalAccuracy / messagesWithResults);
			resultData.pronunciation.fluencyScore = Math.round(totalFluency / messagesWithResults);
			resultData.pronunciation.prosodyScore = Math.round(totalProsody / messagesWithResults);
		}

		// Set content scores (would be calculated in real implementation)
		resultData.content.grammarScore = Math.round(Math.random() * 40) + 60;
		resultData.content.vocabularyScore = Math.round(Math.random() * 40) + 60;

		// Collect words detail from user messages (this would be replaced with actual word details)
		const wordsDetail: string[] = [];

		try {
			// Prepare API request data
			const requestData = {
				accuracyScore: resultData.pronunciation.accuracyScore,
				fluencyScore: resultData.pronunciation.fluencyScore,
				prosodyScore: resultData.pronunciation.prosodyScore,
				grammarScore: resultData.content.grammarScore,
				vocabularyScore: resultData.content.vocabularyScore,
				wordsDetail: wordsDetail,
				messages: conversation
			};

			// Call the feedback API to get personalized feedback
			const response = await fetch('/api/feadback', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestData)
			});

			if (response.ok) {
				const feedbackData = await response.json();

				// Update the result data with feedback from API
				resultData.pronunciation.feedback = feedbackData.speech_feedback;
				resultData.content.feedback = feedbackData.content_feedback;
			} else {
				console.error('Failed to fetch feedback:', await response.text());
			}
		} catch (error) {
			console.error('Error fetching feedback:', error);
		} finally {
			loadingFeedback = false;
			// Show summary report panel
			showResultPanel = true;
		}
	}

	function leaveConversation() {
		// Reload the page
		window.location.reload();
	}

	function handleCloseReport() {
		showResultPanel = false;
	}
</script>

<div class="flex h-full flex-col">
	<div bind:this={messagesContainer} class="flex-1 space-y-4 overflow-y-auto scroll-smooth p-4">
		{#each conversation as dialog}
			{#if !dialog.hidden}
				<div class="flex flex-col {dialog.self ? 'items-end' : 'items-start'} gap-1">
					{#if !dialog.self}
						<div class="flex items-center gap-2 {dialog.self ? 'flex-row-reverse' : ''}">
							{#if dialog.avatar}
								<img src={dialog.avatar} alt={dialog.name} class="h-8 w-8 rounded-full" />
							{:else}
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
									{dialog.name[0]}
								</div>
							{/if}
							<div class="text-sm font-semibold text-gray-700">{dialog.name}</div>
						</div>
					{/if}
					<Card class="w-fit max-w-[80%] {dialog.self ? 'bg-primary-50' : ''}">
						<div class="-my-2">
							<p class="prose text-gray-600">
								{#if !dialog.result}
									{dialog.content}
								{:else if dialog.result && dialog.self}
									<ResultMessage result={dialog.result} />
								{/if}
							</p>
							{#if dialog.audio}
								<AudioPlayer src={dialog.audio} />
							{/if}
						</div>
					</Card>
					{#if dialog.result && dialog.self}
						<Tooltip placement="bottom" class="z-10">
							<div class="flex gap-1">
								<div>準確度: {dialog.result.accuracyScore}</div>
								<div>流暢度: {dialog.result.fluencyScore}</div>
								<div>韻律感: {dialog.result.prosodyScore}</div>
							</div>
						</Tooltip>
					{/if}
				</div>
			{/if}
		{/each}
	</div>

	<div class="relative flex-shrink-0 border-t bg-white p-4">
		<div class="mb-4 flex justify-center">
			<!-- Record Button (Centered) -->
			<Button
				color={recording && !operating ? 'red' : 'primary'}
				class="group relative flex h-20 w-20 flex-col items-center justify-center gap-2 rounded-full shadow-2xl transition-colors"
				disabled={operating}
				on:click={handleRecord}
			>
				{#if recording && !operating}
					<div
						class="absolute inset-0 rounded-full bg-red-600 opacity-30 transition-transform duration-75"
						style:transform="scale({1 + speakingProbability * 0.2})"
					></div>
					<Square class="animate-pulse transition-transform group-hover:scale-110" size={48} />
				{:else}
					<Mic class="transition-transform group-hover:scale-110" size={48} />
				{/if}
				<div>{recording ? (operating ? '等待中' : '停止') : '錄音'}</div>
			</Button>
		</div>

		<!-- Proficiency level and End Conversation Button in a row -->
		<div class="flex items-center justify-center gap-3">
			<span class="rounded bg-blue-100 px-3 py-1 text-sm text-blue-800"
				>目前程度：{proficiencyLevel}</span
			>
			<!-- End Conversation Button -->
			<Button
				color="light"
				class="flex items-center gap-1 rounded-full py-1 text-sm"
				on:click={endConversation}
				disabled={conversation.length < 2 || operating || loadingFeedback}
			>
				{#if loadingFeedback}
					<span
						class="mr-1 inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
					></span>
					<span>Loading...</span>
				{:else}
					<CheckCircle size={16} />
					<span>End Conversation</span>
				{/if}
			</Button>
		</div>

		<!-- Floating Suggestion Button (always visible, absolute in this section) -->
		<button
			class="z-50 flex h-14 w-14 items-center justify-center rounded-full border-4 border-blue-400 bg-blue-500 text-white shadow-lg transition-transform duration-200 hover:scale-110 focus:outline-none"
			style="position: fixed; left: {buttonPosition.left}px; top: {buttonPosition.top}px; width: {BUTTON_SIZE}px; height: {BUTTON_SIZE}px;"

			onmousedown={handleSuggestionBtnMouseDown}
			ontouchstart={handleSuggestionBtnMouseDown}
			onclick={async (e) => {
				if (dragMoved) {
					dragMoved = false;
					return;
				}
				if (!showSuggestionsPanel && !loadingSuggestions && suggestions.length === 0) {
					showSuggestionsLoading = true;
					await loadSuggestions?.();
					showSuggestionsLoading = false;
				}
				showSuggestionsPanel = !showSuggestionsPanel;
			}}
			disabled={loadingSuggestions || conversation.length < 2 || showSuggestionsLoading}
			title="顯示建議"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="28"
				height="28"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 3a7 7 0 0 0-4.95 11.95c.34.34.55.8.55 1.28V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.77c0-.48.21-.94.55-1.28A7 7 0 0 0 12 3zm0 0v0m-2 16h4"
				/>
			</svg>
			{#if showSuggestionsLoading}
				<span
					class="absolute right-1 top-1 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-blue-600"
				></span>
			{/if}
		</button>

		<!-- Floating Suggestion Panel (fixed to window,不變) -->
		{#if showSuggestionsPanel}
			<div
				class="animate-fade-in fixed bottom-24 right-8 z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-2xl"
				style="right: {panelPosition.right}px; bottom: {panelPosition.down}px;"
			>
				<div class="mb-2 flex items-center justify-between">
					<span class="text-base font-semibold text-gray-700">建議句子</span>
					<button
						class="text-gray-400 hover:text-gray-600"
						onclick={() => (showSuggestionsPanel = false)}
						title="關閉">✕</button
					>
				</div>
				{#if loadingSuggestions}
					<div class="flex justify-center py-8">
						<div
							class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
						></div>
					</div>
				{:else if suggestions.length > 0}
					<div class="space-y-2">
						<div class="mb-2 text-xs text-gray-500">
							Read these suggestions aloud or create your own response
						</div>
						{#each suggestions as suggestion, i}
							<button
								type="button"
								class="flex w-full items-center gap-2 rounded border border-blue-300 bg-blue-50 px-3 py-2 text-left text-sm transition-colors hover:bg-blue-100"
								in:fly={{ y: 10, delay: 150 + i * 70, duration: 200 }}
								onclick={() => {
									if (suggestionSending) return;
									suggestionSending = true;
									onSuggestionClick?.(suggestion);
									scrollToBottom(5);
									suggestionSending = false;
									showSuggestionsPanel = false;
								}}
								aria-label="Suggestion: {suggestion}"
							>
								{suggestion}
								{#if suggestionSending}
									<span
										class="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
									></span>
								{/if}
							</button>
						{/each}
					</div>
				{:else}
					<div class="py-4 text-center text-gray-400">暫無建議</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Speaking Report Component -->
<SummaryReport
	bind:open={showResultPanel}
	{resultData}
	onClose={handleCloseReport}
	onLeave={leaveConversation}
	loading={loadingFeedback}
/>
