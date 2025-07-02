<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import type SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

	let { result }: { result: SpeechSDK.PronunciationAssessmentResult } = $props();

	let words = result.detailResult.Words;

	// Extract segments (words and non-words) from content
	// @ts-expect-error we need this private field to get the lexical result
	let segments = result.privPronJson.Lexical.match(/[a-zA-Z0-9']+|[^a-zA-Z0-9']+/g) || [];

	function levenshtein(a: string, b: string): number {
		const matrix: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
			Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
		);

		for (let i = 1; i <= a.length; i++) {
			for (let j = 1; j <= b.length; j++) {
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
				);
			}
		}
		return matrix[a.length][b.length];
	}

	function findClosestMatch(
		segment: string,
		words: typeof result.detailResult.Words,
		threshold = 1
	) {
		let closestMatch = null;
		let smallestDistance = Infinity;

		for (let word of words) {
			let distance = levenshtein(segment.toLowerCase(), word.Word.toLowerCase());
			if (distance < smallestDistance && distance <= threshold) {
				smallestDistance = distance;
				closestMatch = word;
			}
		}
		return closestMatch;
	}

	function safeScore(val: any): number {
		return typeof val === 'number' && !isNaN(val) && val > 0 ? val : 0;
	}

	// CTC Alignment
	let data: {
		display: string;
		result?: {
			score: number;
			phonemes: { phoneme: string; score: number }[];
		};
	}[] = [];

	let segmentIndex = 0;
	let wordIndex = 0;

	while (segmentIndex < segments.length) {
		const segment = segments[segmentIndex];

		if (/[a-zA-Z0-9']+/.test(segment)) {
			if (wordIndex < words.length) {
				let wordResult = words[wordIndex];
				if (wordResult.Word.toLowerCase() === segment.toLowerCase()) {
					// Exact match
					data.push({
						display: segment,
						result: {
							score: safeScore(wordResult.PronunciationAssessment?.AccuracyScore),
							phonemes:
								wordResult.Phonemes?.map((phoneme) => ({
									phoneme: phoneme.Phoneme || '',
									// @ts-expect-error the phoneme score is here
									score: safeScore(phoneme.PronunciationAssessment?.AccuracyScore)
								})) || []
						}
					});
					wordIndex++;
				} else {
					// Attempt partial match
					let closestMatch = findClosestMatch(segment, words.slice(wordIndex));
					if (closestMatch) {
						data.push({
							display: segment,
							result: {
								score: safeScore(closestMatch.PronunciationAssessment?.AccuracyScore),
								phonemes:
									closestMatch.Phonemes?.map((phoneme) => ({
										phoneme: phoneme.Phoneme || '',
										// @ts-expect-error the phoneme score is here
										score: safeScore(phoneme.PronunciationAssessment?.AccuracyScore)
									})) || []
							}
						});
						wordIndex += words.slice(wordIndex).findIndex((w) => w.Word === closestMatch.Word) + 1;
					} else {
						// No match, add segment as is
						data.push({
							display: segment
						});
					}
				}
			} else {
				// No more words to match
				data.push({
					display: segment
				});
			}
		} else {
			// Non-word segment (punctuation or spaces)
			data.push({
				display: segment
			});
		}

		segmentIndex++;
	}

	// Add remaining unmatched words
	for (; wordIndex < words.length; wordIndex++) {
		let wordResult = words[wordIndex];
		data.push({
			display: wordResult.Word,
			result: {
				score: safeScore(wordResult.PronunciationAssessment?.AccuracyScore),
				phonemes:
					wordResult.Phonemes?.map((phoneme) => ({
						phoneme: phoneme.Phoneme || '',
						// @ts-expect-error the phoneme score is here
						score: safeScore(phoneme.PronunciationAssessment?.AccuracyScore)
					})) || []
			}
		});
	}
</script>

{#snippet colored(content: string, score: number)}<span
		class="inline-block"
		class:text-yellow-400={score < 60}
		class:text-lime-400={score < 80 && score >= 60}
		class:text-green-500={score < 90 && score >= 80}
		class:text-emerald-600={score >= 90}>{content}</span
	>{/snippet}

{#each data as { display, result }}{#if result}{@render colored(display, result.score)}<Tooltip
			class="z-20"
			><div class="flex gap-1">
				{#each result.phonemes as phoneme}{@render colored(phoneme.phoneme, phoneme.score)}{/each}
			</div></Tooltip
		>{:else}{display}{/if}{/each}
