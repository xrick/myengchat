import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type OpenAI from 'openai';
import debug from 'debug';
import type { Message } from '$lib/types';
import { openai } from '$lib/azure/llm';

const log = debug('chat');

const MAX_RESPONSE_LENGTH = 250;
export const POST: RequestHandler = async ({ request }: { request: Request }) => {
	if (!env.AZURE_OPENAI_ENDPOINT || !env.AZURE_OPENAI_API_KEY || !env.AZURE_OPENAI_API_VERSION) {
		return json(
			{ error: 'You forgot to add your OpenAI endpoint, API key, or API version to the .env file' },
			{ status: 400 }
		);
	}

	try {
		const {
			messages,
			proficiency,
			assistantName
		}: {
			messages: Message[];
			proficiency: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
			assistantName: string;
		} = await request.json();

		log('Request Proficiency:', proficiency || 'N/A');

		const context: OpenAI.ChatCompletionMessageParam[] = messages
			.filter(({ name }) => name !== 'Background')
			.map(({ content, self }) => ({
				role: self ? 'user' : 'assistant',
				content
			}));

		const background = messages.find(({ name }) => name === 'Background');

		// Only keep one system prompt and one proficiency prompt
		context.unshift({
			role: 'system',
			content:
				`You are an English-speaking assistant from CoolEnglish named ${assistantName}, designed to help users practice spoken English in a fun and interactive way. Your primary goal is to create natural, engaging conversations based on real-life scenarios, encouraging users to actively participate and improve their oral communication skills.` +
				(background ? `\n\n**Scenario:** ${background.content}` : '') +
				`\n\n**Guidelines:**\n- Stay scenario-focused.\n- Be encouraging and friendly.\n- Use proficiency-appropriate vocabulary and sentence structures.\n- Keep it concise and clear.\n- Encourage elaboration and provide suggestions.\n- Avoid unrelated topics.\n- Only generate the next reply for the assistant, do not simulate the user's lines or generate multiple turns.\n- Only output the assistant's next message, in natural, level-appropriate English.\n- Example: "That sounds exciting! What would you do next in this situation?"\n- Example: "Good job! Can you explain why you made that choice?"\n- Example: "Interesting! Let’s try this: how would you ask for help politely in a store?"\n- Example: "Great effort! Can you describe the taste of the food you mentioned?"\n- Keep the conversation engaging, realistic, and fun.`
		});

		// Proficiency-specific prompt
		const proficiencyPrompts: Record<string, string> = {
			A1: 'Generate responses at A1 (Beginner) level: very simple sentences, familiar names/words, top 1,000 words.',
			A2: 'Generate responses at A2 (Elementary) level: short, simple texts, predictable information, top 2,000 words.',
			B1: 'Generate responses at B1 (Intermediate) level: high-frequency everyday/job language, some idioms, top 5,000 words.',
			B2: 'Generate responses at B2 (Upper Intermediate) level: contemporary issues, more complex structures, top 10,000 words.',
			C1: 'Generate responses at C1 (Proficient) level: complex vocabulary and sentences, challenge the user, top 20,000 words.',
			C2: 'Generate responses at C2 (Advanced Proficient) level: highly complex, abstract, technical, or literary language.'
		};
		context.unshift({
			role: 'user',
			content: proficiencyPrompts[proficiency]
		});

		const stream = await openai.chat.completions.create({
			stream: true,
			model: '',
			messages: context,
			max_tokens: MAX_RESPONSE_LENGTH
		});

		const encoder = new TextEncoder();
		const readableStream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of stream) {
						const content = chunk.choices[0]?.delta?.content;
						if (content) {
							const bytes = encoder.encode(content);
							controller.enqueue(bytes);
						}
					}
					controller.close();
				} catch (error) {
					log('Streaming error:', error);
					controller.error(error);
				}
			}
		});

		return new Response(readableStream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (error) {
		console.log('Request error:', error);
		log('Request error:', error);
		return json({ error: 'An error occurred while processing your request' }, { status: 500 });
	}
};
