import type { Message } from '$lib/types';
import debug from 'debug';

const log = debug('suggestions');

export async function getSuggestions(
	messages: Message[],
	proficiency: string = 'A1'
): Promise<string[]> {
	log('getSuggestions() called with messages:', messages, 'proficiency:', proficiency);
	const response = await fetch('/api/suggestions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ messages, proficiency })
	});

	if (!response.ok) {
		throw new Error('Failed to get suggestions');
	}

	const suggestions = (await response.json()) as string[];
	log('Received suggestions:', suggestions);
	return suggestions;
}
