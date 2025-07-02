import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { openai } from '$lib/azure/llm';
import type { Message } from '$lib/types';
import debug from 'debug';
import { zodResponseFormat } from 'openai/helpers/zod';
import z from 'zod';
import type OpenAI from 'openai';

const log = debug('api:suggestions');

const MAX_RESPONSE_LENGTH = 200;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messages, proficiency = 'A1' } = (await request.json()) as {
			messages: Message[];
			proficiency: string;
		};
		log('Received request for suggestions with messages:', messages, 'proficiency:', proficiency);

		const suggestionsSchema = z.object({
			suggestions: z.array(z.string())
		});

		const formattedMessages: OpenAI.ChatCompletionMessageParam[] = messages
			.filter((msg) => msg.name !== 'Background')
			.map((msg) => ({
				role: msg.self ? 'assistant' : 'user',
				content: msg.content
			}));

		// Add a system message to guide the model based on proficiency level
		formattedMessages.unshift({
			role: 'system',
			content: `You are an English conversation practice assistant. Generate 2 possible replies that a language learner might use to respond to the conversation.
      
      The replies should be:
      1. Appropriate for the context of the conversation
      2. At the CEFR ${proficiency} level of English proficiency
      3. Short and natural (max 15 words each)
      4. Helpful for someone learning English
      
      CEFR ${proficiency} level guidance:
      ${getProficiencyGuidance(proficiency)}
      
      Example output format:
      {
        "suggestions": [
          "Yes, I've been there once. It was amazing!",
          "I'd love to visit that place someday.",
        ]
      }`
		});

		log('Formatted messages for OpenAI:', formattedMessages);

		const completion = await openai.beta.chat.completions.parse({
			model: 'gpt-4o',
			messages: formattedMessages,
			max_tokens: MAX_RESPONSE_LENGTH,
			temperature: 0.7,
			response_format: zodResponseFormat(suggestionsSchema, 'suggestions_response')
		});

		// Extract the suggestions array from the parsed response
		const suggestions = completion.choices[0].message.parsed?.suggestions;
		if (!suggestions) {
			throw new Error('No suggestions found in the response');
		}

		log('Generated suggestions:', suggestions);
		return json(suggestions);
	} catch (error) {
		log('Error generating suggestions:', error);
		// Provide fallback suggestions in case of error
		return json(["I'm not sure about that.", 'That sounds interesting!']);
	}
};

function getProficiencyGuidance(proficiency: string): string {
	switch (proficiency) {
		case 'A1':
			return 'Use very basic phrases and simple vocabulary. Short sentences with common everyday expressions. Avoid complex grammar or vocabulary.';
		case 'A2':
			return 'Use simple phrases related to familiar topics. Basic grammar structures and vocabulary for immediate needs. Short, direct sentences.';
		case 'B1':
			return 'Use straightforward language on familiar matters. Express opinions simply. Use some connecting phrases and more varied vocabulary.';
		case 'B2':
			return 'Use clear, detailed language on a range of subjects. Express viewpoints and explain advantages and disadvantages. Use more complex sentence structures.';
		case 'C1':
			return 'Use fluent, spontaneous language. Express ideas fluently with appropriate vocabulary. Use complex sentences and idiomatic expressions.';
		case 'C2':
			return 'Use sophisticated language with precision. Express complex ideas with rich vocabulary. Use advanced grammar structures and subtle differences in meaning.';
		default:
			return 'Use simple, clear language appropriate for an English language learner.';
	}
}
