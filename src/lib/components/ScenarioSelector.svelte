<script lang="ts">
	import { Textarea, Button } from 'flowbite-svelte';

	let { onSelect } = $props<{
		onSelect: (scenario: string, proficiency: string, silenceTimeoutMs: number) => void;
	}>();

	const scenarios = [
		{
			name: '自訂情境',
			content: '',
			custom: true
		},
		{
			name: '電腦零件銷售',
			content:
				'In a computer store, the assistant is the seller and the user is the customer. The assistant should try to sell the user the latest RTX 5090 GPU (NT$71,990, DLSS 4, 3352 AI TOPS, 32 GB GDDR7).'
		},
		{
			name: '軟體工程師面試',
			content:
				'At a job interview for a software engineer position. The assistant is the interviewer, and the user is the interviewee. The assistant asks technical questions about web development and system design.'
		},
		{
			name: '咖啡廳點餐',
			content:
				"At a coffee shop, the assistant is the server (waiter/waitress) and the user is the customer. The assistant should take the user's order and answer questions about the menu or ingredients."
		},
		{
			name: '機場櫃檯服務',
			content:
				'At an airport check-in counter, the assistant is the airline staff and the user is a passenger. The assistant helps the user with a complicated flight reservation issue.'
		},
		{
			name: '技術支援服務',
			content:
				'At a tech support helpdesk, the assistant is the support staff and the user is a customer. The assistant helps the user troubleshoot a malfunctioning smartphone.'
		}
	];

	let selectedIndex = $state(scenarios.length > 1 ? 1 : 0);
	let customContent = $state('');

	let selected = $derived(scenarios[selectedIndex]);
	let selectedContent = $derived(selected.custom ? customContent : selected.content);

	// Updated proficiency levels with descriptions
	let proficiencyLevels = [
		{ code: 'A1', description: '初學者 (Beginner)' },
		{ code: 'A2', description: '基礎 (Elementary)' },
		{ code: 'B1', description: '中級 (Intermediate)' },
		{ code: 'B2', description: '中高級 (Upper Intermediate)' },
		{ code: 'C1', description: '高級 (Advanced)' },
		{ code: 'C2', description: '精通 (Proficient)' }
	];
	let selectedProficiency = $state('A1');
	let silenceTimeoutMs = $state<number>(1000);

	function handleSubmit() {
		onSelect(selectedContent, selectedProficiency, silenceTimeoutMs);
	}
</script>

<div class="flex w-full max-w-2xl flex-col gap-3">
	<div class="flex items-center gap-2 overflow-x-auto p-1">
		{#each scenarios as scenario, i}
			<button
				class="shrink-0 rounded-full px-4 py-2 transition-colors
                    {selectedIndex === i
					? 'bg-primary-500 text-white'
					: 'bg-gray-100 hover:bg-gray-200'}"
				onclick={() => (selectedIndex = i)}
			>
				{scenario.name}
			</button>
		{/each}
	</div>

	<!-- Proficiency selector with descriptions -->
	<div class="my-2 flex items-center justify-center gap-2">
		<label for="proficiency" class="text-base">選擇程度：</label>
		<select id="proficiency" bind:value={selectedProficiency} class="rounded border px-2 py-1">
			{#each proficiencyLevels as level}
				<option value={level.code}>{level.code} - {level.description}</option>
			{/each}
		</select>
	</div>

	<!-- Silence timeout selector -->
	<div class="my-2 flex items-center justify-center gap-2">
		<label class="mr-2 text-base" for="silenceTimeout">自動語音分割：</label>
		<select id="silenceTimeout" bind:value={silenceTimeoutMs} class="rounded border px-2 py-1">
			<option value={1000}>較短停頓長度</option>
			<option value={2500}>一般停頓長度</option>
			<option value={5000}>較長停頓長度</option>
		</select>
	</div>

	{#if selected.custom}
		<Textarea
			class="w-full"
			placeholder="描述你想要的對話情境..."
			rows={4}
			bind:value={customContent}
		/>
	{:else}
		<Textarea class="w-full" rows={4} readonly={true} bind:value={selected.content} />
	{/if}

	<Button class="w-full" on:click={handleSubmit} disabled={!selectedContent}>使用此情境</Button>
</div>
