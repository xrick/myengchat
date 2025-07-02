<script lang="ts">
	let {
		accuracyScore,
		fluencyScore,
		prosodyScore,
		grammarScore,
		vocabularyScore
	}: {
		accuracyScore: number;
		fluencyScore: number;
		prosodyScore: number;
		grammarScore: number;
		vocabularyScore: number;
	} = $props();

	// 檢查分數有效性，無效時設為 0
	function safeScore(val: any): number {
		return typeof val === 'number' && !isNaN(val) ? val : 0;
	}

	let safeAccuracy = safeScore(accuracyScore);
	let safeFluency = safeScore(fluencyScore);
	let safeProsody = safeScore(prosodyScore); // 讀不到時直接為 0
	let safeGrammar = safeScore(grammarScore);
	let safeVocabulary = safeScore(vocabularyScore);

	const score = $derived([
		{
			label: '發音評分',
			avg: isNaN(Math.round((safeAccuracy + safeFluency + safeProsody) / 3))
				? '無法評分'
				: Math.round((safeAccuracy + safeFluency + safeProsody) / 3),
			scores: [
				{ label: '準確度', score: safeAccuracy },
				{ label: '流暢度', score: safeFluency },
				{ label: '韻律感', score: safeProsody }
			]
		},
		{
			label: '內容評分',
			avg: isNaN(Math.round((safeGrammar + safeVocabulary) / 2))
				? '無法評分'
				: Math.round((safeGrammar + safeVocabulary) / 2),
			scores: [
				{ label: '文法正確率', score: safeGrammar },
				{ label: '單字正確率', score: safeVocabulary }
			]
		}
	]);

	function getPronunciationScoreColor(score: number) {
		if (score >= 90) return 'text-emerald-500 border-emerald-500';
		if (score >= 80) return 'text-green-500 border-green-500';
		if (score >= 60) return 'text-orange-500 border-yellow-500';
		else return 'text-red-500 border-red-500';
	}
	function getContentScoreColor(score: number) {
		if (score >= 90) return 'text-emerald-500 border-emerald-500';
		if (score >= 80) return 'text-green-500 border-green-500';
		if (score >= 60) return 'text-orange-500 border-yellow-500';
		else return 'text-red-500 border-red-500';
	}
</script>

<div class="mx-auto max-w-md flex-col rounded-lg bg-white p-6 shadow-md">
	{#each score as { label, avg, scores }}
		<div class="m-2 flex flex-col">
			<div class="flex flex-col justify-center p-3">
				<h3 class="text-xl font-bold">{label}</h3>
			</div>
			<div class="flex flex-row items-center">
				<div class="m-3 flex-col justify-center">
					<div class="relative h-20 w-20">
						<div
							class={`absolute inset-0 rounded-full border-4 ${typeof avg === 'number' ? getPronunciationScoreColor(avg) : 'border-gray-500 text-gray-500'}`}
						></div>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="text-3xl font-bold text-gray-700">{avg}</span>
						</div>
					</div>
				</div>

				<div class="w-full space-y-2 p-2">
					{#each scores as { label, score }}
						<div>
							<div class="mb-1 flex items-center justify-between">
								<span class="text-sm font-medium text-gray-600">{label}</span>
								<span class="text-right text-sm text-gray-500">{Math.round(score ?? 0)} / 100</span>
							</div>
							<div class="relative h-4 w-full rounded-full bg-gray-200">
								<div
									class="h-4 rounded-full"
									class:bg-red-500={(score ?? 0) < 60}
									class:bg-orange-500={(score ?? 0) < 80 && (score ?? 0) >= 60}
									class:bg-green-500={(score ?? 0) < 90 && (score ?? 0) >= 80}
									class:bg-emerald-500={(score ?? 0) >= 90}
									style="width: {score ?? 0}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/each}

	<!--no need to add buttons currently-->
	<!-- Buttons -->
	<!-- <div class="mt-4 flex items-center justify-between">
		<button
			class="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none"
			onclick={() => alert('Getting suggestions for improvement...')}
		>
			 獲得如何改進的意見反應
		</button>
		<button
			class="rounded-lg bg-gray-100 px-4 py-2 text-gray-600 hover:bg-gray-200 focus:outline-none"
			onclick={() => alert('Regenerating report...')}
		>
			重複報告
		</button>
	</div> -->
</div>
