<script lang="ts">
	import { blur } from 'svelte/transition';
	import { onMount } from 'svelte';
	import ScenarioSelector from '$lib/components/ScenarioSelector.svelte';
	import Chat from './Chat.svelte';

	let topic = $state('');
	let stage = $state<'blank' | 'welcome' | 'setting' | 'chat'>('blank');
	let selectedProficiency = $state('');
	let silenceTimeoutMs = $state<number>(1000);

	onMount(() => {
		setTimeout(() => {
			stage = 'welcome';
		}, 500);
		setTimeout(() => {
			stage = 'blank';
		}, 3000);
		setTimeout(() => {
			stage = 'setting';
		}, 4000);
	});

	function startConversation(scenario: string, proficiency: string, silenceTimeout: number) {
		topic = scenario;
		selectedProficiency = proficiency;
		silenceTimeoutMs = silenceTimeout;
		stage = 'blank';
		setTimeout(() => {
			stage = 'chat';
		}, 1000);
	}
</script>

<svelte:head>
	<title>CoolEnglish Conversational Assessment</title>
</svelte:head>

<main class="flex h-full w-full flex-col items-center justify-center bg-white p-4">
	{#if stage === 'welcome'}
		<div class="text-center">
			<h1 class="text-xl" in:blur={{ duration: 1000 }} out:blur={{ duration: 800 }}>歡迎來到</h1>
			<h1
				class="text-2xl font-bold"
				in:blur={{ duration: 1000, delay: 500 }}
				out:blur={{ duration: 800 }}
			>
				CoolEnglish Conversational Assessment
			</h1>
		</div>
	{/if}

	{#if stage === 'setting'}
		<div in:blur={{ duration: 1000 }} out:blur={{ duration: 800 }} class="w-full">
			<div class="mx-auto flex max-w-2xl flex-col items-center justify-center gap-2">
				<p>請選擇或描述一個你想談論的話題，我們將會進行一次即時對話。</p>
				<ScenarioSelector onSelect={startConversation} />
			</div>
		</div>
	{/if}

	{#if stage === 'chat'}
		<div class="mx-auto flex h-full w-full max-w-prose flex-col space-y-4">
			<div class="h-full w-full" in:blur={{ duration: 1000 }} out:blur={{ duration: 800 }}>
				<Chat {topic} proficiency={selectedProficiency} {silenceTimeoutMs} />
			</div>
		</div>
	{/if}
</main>
