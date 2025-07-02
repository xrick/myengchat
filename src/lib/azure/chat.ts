import type { Message } from '$lib/types';
import debug from 'debug';

const log = debug('chat');

export async function chat(
	messages: Message[],
	proficiency: string,
	assistantName: string,
	callback: (text: string) => void
): Promise<void> {
	log('chat() called with messages:', 'proficiency:', proficiency);
	const response = await fetch('/api/chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ messages, proficiency, assistantName }) // Include proficiency in the request body
	});

	if (!response.ok || !response.body) {
		throw new Error('Failed to get response from chat endpoint');
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				log('Stream done');
				break;
			}

			const chunk = decoder.decode(value);
			//log('Stream chunk:', chunk);
			callback(chunk);
		}
	} finally {
		reader.releaseLock();
	}
}
