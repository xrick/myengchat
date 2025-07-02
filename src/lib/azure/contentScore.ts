import type { Message } from '$lib/types';
import debug from 'debug';

const log = debug('chat');

export async function contentScore(messages: Message[]): Promise<{ [key: string]: number }> {
	const response = await fetch('/api/contentScore', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ messages })
	});

	//log('Response:', response);
	if (!response.ok || !response.body) {
		log('response status: ' + response.ok);
		log('response body: ' + response.body);
		throw new Error('Failed to get response from contentScore endpoint');
	}

	const content_score = (await response.json()) as { [key: string]: number };
	return content_score;
}
