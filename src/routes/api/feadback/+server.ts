import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { openai } from '$lib/azure/llm';
import z from 'zod';
import type OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import type { Message } from '$lib/types';
import debug from 'debug';

const MAX_RESPONSE_LENGTH = 500;
const log = debug('api:suggestions');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const {
			accuracyScore,
			fluencyScore,
			prosodyScore,
			grammarScore,
			vocabularyScore,
			wordsDetail,
			messages
		} = (await request.json()) as {
			accuracyScore: number;
			fluencyScore: number;
			prosodyScore: number;
			grammarScore: number;
			vocabularyScore: number;
			wordsDetail: string[];
			messages: Message[];
		};

		const feedbackSchema = z.object({
			speech_feedback: z.string(),
			content_feedback: z.string()
		});

		const formattedMessages: OpenAI.ChatCompletionMessageParam[] = messages
			.filter((msg) => msg.name !== 'Background')
			.map((msg) => ({
				role: msg.self ? 'assistant' : 'user',
				content: msg.content
			}));

		formattedMessages.unshift({
			role: 'system',
			content: `你是一位專業的英語口說老師，請根據以下評分結果，分別給予「語音回饋」與「內容回饋」。請用繁體中文，並以結構化 JSON 格式回傳：

- 語音評分：準確度 ${accuracyScore}，流暢度 ${fluencyScore}，韻律感 ${prosodyScore}
- 內容評分：文法評分 ${grammarScore}，單字評分 ${vocabularyScore}
- 逐字發音細節：${JSON.stringify(wordsDetail)}

請回傳：
{
  "speech_feedback": "...",
  "content_feedback": "..."
}

語音回饋請針對發音、流暢度、韻律等給具體建議。內容回饋請針對文法、用字、句型等給具體建議。請避免重複、空泛的建議，並根據分數高低給予正向或改進建議。
`
		});
		// 3. 呼叫 LLM
		const completion = await openai.beta.chat.completions.parse({
			model: 'gpt-4o',
			messages: formattedMessages,
			max_tokens: MAX_RESPONSE_LENGTH,
			temperature: 0.7,
			response_format: zodResponseFormat(feedbackSchema, 'feedback_response')
		});

		const feedback = completion.choices[0].message.parsed;
		if (!feedback) {
			throw new Error('No feedback found in the response');
		}

		log('Generated feedback:', feedback);
		return json(feedback);
	} catch (error) {
		log('Error generating feedback:', error);
		return json({
			speech_feedback: "Sorry, I couldn't generate feedback at the moment. Please try again later.",
			content_feedback: "Sorry, I couldn't generate feedback at the moment. Please try again later."
		});
	}
};
