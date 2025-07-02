<script lang="ts">
	import { Button, Modal } from 'flowbite-svelte';
	import { X, RefreshCw } from 'lucide-svelte';

	export let open = false;
	export let onClose = () => {};
	export let onLeave = () => {};
	export let loading = false;

	export let resultData = {
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
	};

	// Color utility functions for score visualization (only for bar and border)
	function getPronunciationScoreColor(score: number): string {
		if (score >= 90) return 'border-emerald-500 bg-emerald-500';
		if (score >= 80) return 'border-green-500 bg-green-500';
		if (score >= 60) return 'border-yellow-500 bg-yellow-500';
		else return 'border-red-500 bg-red-500';
	}

	function getContentScoreColor(score: number): string {
		if (score >= 90) return 'border-emerald-500 bg-emerald-500';
		if (score >= 80) return 'border-green-500 bg-green-500';
		if (score >= 60) return 'border-yellow-500 bg-yellow-500';
		else return 'border-red-500 bg-red-500';
	}

	// Calculate average scores
	$: pronunciationAvg = Math.round(
		(resultData.pronunciation.accuracyScore +
			resultData.pronunciation.fluencyScore +
			resultData.pronunciation.prosodyScore) /
			3
	);
	$: contentAvg = Math.round(
		(resultData.content.grammarScore + resultData.content.vocabularyScore) / 2
	);

	// Get color classes for average scores
	$: pronunciationScoreColor = getPronunciationScoreColor(pronunciationAvg);
	$: contentScoreColor = getContentScoreColor(contentAvg);
</script>

<Modal bind:open size="lg" title="Your Speaking Report" autoclose={false} on:close={onClose}>
	<div class="p-4">
		<!-- Pronunciation Section -->
		<div class="mb-8">
			<h2 class="mb-4 text-xl font-bold">發音評分</h2>
			<div class="mb-6 flex">
				<!-- Score Circle -->
				<div class="relative mr-6">
					<div
						class="flex h-24 w-24 items-center justify-center rounded-full border-4 {pronunciationScoreColor
							.split(' ')
							.filter((c) => c.includes('border'))
							.join(' ')}"
					>
						<span class="text-4xl font-bold text-gray-700">{pronunciationAvg}</span>
					</div>
				</div>

				<!-- Score Details -->
				<div class="flex-1 space-y-3">
					<div class="flex items-center justify-between">
						<span>準確度</span>
						<div class="flex items-center gap-2">
							<div class="h-2 w-40 rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full {getPronunciationScoreColor(
										resultData.pronunciation.accuracyScore
									)
										.split(' ')
										.filter((c) => c.includes('bg'))
										.join(' ')}"
									style="width: {resultData.pronunciation.accuracyScore}%"
								></div>
							</div>
							<span class="min-w-[4rem] text-right text-gray-700"
								>{resultData.pronunciation.accuracyScore} / 100</span
							>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<span>流暢度</span>
						<div class="flex items-center gap-2">
							<div class="h-2 w-40 rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full {getPronunciationScoreColor(
										resultData.pronunciation.fluencyScore
									)
										.split(' ')
										.filter((c) => c.includes('bg'))
										.join(' ')}"
									style="width: {resultData.pronunciation.fluencyScore}%"
								></div>
							</div>
							<span class="min-w-[4rem] text-right text-gray-700"
								>{resultData.pronunciation.fluencyScore} / 100</span
							>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<span>語律感</span>
						<div class="flex items-center gap-2">
							<div class="h-2 w-40 rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full {getPronunciationScoreColor(
										resultData.pronunciation.prosodyScore
									)
										.split(' ')
										.filter((c) => c.includes('bg'))
										.join(' ')}"
									style="width: {resultData.pronunciation.prosodyScore}%"
								></div>
							</div>
							<span class="min-w-[4rem] text-right text-gray-700"
								>{resultData.pronunciation.prosodyScore} / 100</span
							>
						</div>
					</div>
				</div>
			</div>

			<!-- Pronunciation Feedback -->
			<div class="rounded-lg bg-blue-50 p-4">
				<h3 class="mb-2 font-semibold text-gray-800">發音回饋:</h3>
				{#if loading}
					<div class="flex justify-center py-4">
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
						></div>
					</div>
				{:else}
					<p class="whitespace-pre-line text-sm text-gray-700">
						{resultData.pronunciation.feedback}
					</p>
				{/if}
			</div>
		</div>

		<!-- Content Section -->
		<div>
			<h2 class="mb-4 text-xl font-bold">內容評分</h2>
			<div class="mb-6 flex">
				<!-- Score Circle -->
				<div class="relative mr-6">
					<div
						class="flex h-24 w-24 items-center justify-center rounded-full border-4 {contentScoreColor
							.split(' ')
							.filter((c) => c.includes('border'))
							.join(' ')}"
					>
						<span class="text-4xl font-bold text-gray-700">{contentAvg}</span>
					</div>
				</div>

				<!-- Score Details -->
				<div class="flex-1 space-y-3">
					<div class="flex items-center justify-between">
						<span>文法正確率</span>
						<div class="flex items-center gap-2">
							<div class="h-2 w-40 rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full {getContentScoreColor(resultData.content.grammarScore)
										.split(' ')
										.filter((c) => c.includes('bg'))
										.join(' ')}"
									style="width: {resultData.content.grammarScore}%"
								></div>
							</div>
							<span class="min-w-[4rem] text-right text-gray-700"
								>{resultData.content.grammarScore} / 100</span
							>
						</div>
					</div>

					<div class="flex items-center justify-between">
						<span>單字正確率</span>
						<div class="flex items-center gap-2">
							<div class="h-2 w-40 rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full {getContentScoreColor(resultData.content.vocabularyScore)
										.split(' ')
										.filter((c) => c.includes('bg'))
										.join(' ')}"
									style="width: {resultData.content.vocabularyScore}%"
								></div>
							</div>
							<span class="min-w-[4rem] text-right text-gray-700"
								>{resultData.content.vocabularyScore} / 100</span
							>
						</div>
					</div>
				</div>
			</div>

			<!-- Content Feedback -->
			<div class="rounded-lg bg-green-50 p-4">
				<h3 class="mb-2 font-semibold text-gray-800">內容回饋:</h3>
				{#if loading}
					<div class="flex justify-center py-4">
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
						></div>
					</div>
				{:else}
					<p class="whitespace-pre-line text-sm text-gray-700">{resultData.content.feedback}</p>
				{/if}
			</div>
		</div>
	</div>

	<!-- Modal Footer -->
	<svelte:fragment slot="footer">
		<div class="flex justify-end gap-2">
			<Button color="red" on:click={onLeave}>
				<RefreshCw class="mr-2 h-5 w-5" />
				Restart conversation
			</Button>
		</div>
	</svelte:fragment>
</Modal>
