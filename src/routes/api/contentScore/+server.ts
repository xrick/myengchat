import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { zodResponseFormat } from 'openai/helpers/zod';
import debug from 'debug';
import type { Message } from '$lib/types';
import z from 'zod';
import { openai } from '$lib/azure/llm';

const log = debug('azure:openai');

const MAX_RESPONSE_LENGTH = 200;
export const POST: RequestHandler = async ({ request }) => {
	//function to get content score feedback from Azure
	if (!env.AZURE_OPENAI_ENDPOINT || !env.AZURE_OPENAI_API_KEY || !env.AZURE_OPENAI_API_VERSION) {
		return json(
			{ error: 'You forgot to add your OpenAI endpoint, API key, or API version to the .env file' },
			{ status: 400 }
		);
	}

	try {
		const { messages }: { messages: Message[] } = await request.json();
		const background = messages.find(({ name }) => name === 'Background');
		const student_content = messages[messages.length - 1].content;

		const sample_sentence1 =
			"OK the movie i like to talk about is the cove it is very say phenomenal sensational documentary about adopting hunting practices in japan i think the director is called well i think the name escapes me anyway but well let's talk about the movie basically it's about dolphin hunting practices in japan there's a small village where where villagers fisherman Q almost twenty thousand dolphins on a yearly basis which is brutal and just explain massacre this book has influenced me a lot i still remember the first time i saw this movie i think it was in middle school one of my teachers showed it to all the class or the class and i remember we were going through some really boring topics like animal protection at that time it was really boring to me but right before everyone was going to just sleep in the class the teacher decided to put the textbook down and show us a clear from this document documentary we were shocked speechless to see the has of the dolphins chopped off and left on the beach and the C turning bloody red with their blood which is i felt sick i couldn't need fish for a whole week and it was lasting impression if not scarring impression and i think this movie is still very meaningful and it despite me a lot especially on wildlife protection dolphins or search beautiful intelligent animals of the sea and why do villagers and fishermen in japan killed it i assume there was a great benefit to its skin or some scientific research but the ironic thing is that they only kill them for the meat because the meat taste great that sickens me for awhile and i think the book inspired me to do a lot of different to do a lot of things about well i protection i follow news like";
		const sample_sentence2 =
			"yes i can speak how to this movie is it is worth young wolf young man this is this movie from korea it's a crime movies the movies on the movies speaker speaker or words of young man love hello a cow are you saying they end so i have to go to the go to the america or ha ha ha lots of years a go on the woman the woman is very old he talk to korea he carpool i want to go to the this way this whole home house this house is a is hey so what's your man and at the end the girl cause so there's a woman open open hum finally finds other wolf so what's your young man so the young man don't so yeah man the young man remember he said here's a woman also so am i it's very it's very very sad she is she is a crack credit thank you ";
		const sample_sentence3 =
			"yes i want i want to talk about the TV series are enjoying watching a discount name is a friends and it's uh accommodate in the third decades decades an it come out the third decades and its main characters about a six friends live in the NYC but i watched it a long time ago i can't remember the name of them and the story is about what they are happening in their in their life and there are many things treating them and how the friendship are hard friendship and how the french how the strong strongly friendship they obtain them and they always have some funny things happen they only have happened something funny things and is a comedy so that was uh so many and i like this be cause of first adult cause it has a funding it has a farming serious and it can improve my english english words and on the other hand it can i can know about a lot of cultures about the united states and i i first hear about death TV series it's come out of a website and i took into and i watch it after my after my finish my studies and when i was a bad mood when i when i'm in a bad mood or i ";

		const content_score_schema = z.object({
			vocabulary: z.number(),
			grammar: z.number()
		});

		const completion = await openai.beta.chat.completions.parse({
			model: 'gpt-4o-mini-2024-07-18',
			messages: [
				{
					role: 'system',
					content:
						`You are an English-speaking assistant from CoolEnglish, designed to help users practice spoken English in a fun and interactive way. Your primary goal is to create natural, engaging conversations based on real-life scenarios, encouraging users to actively participate and improve their oral communication skills.\n\n` +
						// Scenario Context
						(background ? `**Scenario:** ${background.content}\n\n` : '') +
						// Guidelines
						`Example1: this essay: "${sample_sentence1}" has vocabulary and grammar scores of 80 and 80, respectively.` +
						`Example2: this essay: "${sample_sentence2}" has vocabulary and grammar scores of 40 and 43, respectively.` +
						`Example3: this essay: "${sample_sentence3}" has vocabulary and grammar scores of 50 and 50, respectively.` +
						`The essay for you to score is the chat history below.` +
						`The script is from speech recognition so that please first add punctuations when needed, remove duplicates and unnecessary un uh from oral speech, then find all the misuse of words and grammar errors in this essay, find advanced words and grammar usages, and finally give scores based on this information. Please only response as this format {"vocabulary": *.**(0-100), "grammar": *.**(0-100)}.` +
						'REMEMBER: only response as this format {"vocabulary": *.**(0-100), "grammar": *.**(0-100)}.'
				},
				{
					role: 'user',
					content: student_content
				}
			],
			max_tokens: MAX_RESPONSE_LENGTH,
			response_format: zodResponseFormat(content_score_schema, 'content_score')
		});

		return json(completion.choices[0].message.parsed);
	} catch (error) {
		console.log('Request error:', error);
		log('Request error:', error);
		return json({ error: 'An error occurred while processing your request' }, { status: 500 });
	}
};
