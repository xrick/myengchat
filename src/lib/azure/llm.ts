import { AzureOpenAI } from 'openai';
import { env } from '$env/dynamic/private';

export const openai = new AzureOpenAI({
	endpoint: env.AZURE_OPENAI_ENDPOINT,
	apiKey: env.AZURE_OPENAI_API_KEY,
	apiVersion: env.AZURE_OPENAI_API_VERSION,
	deployment: env.DEPLOYMENT
});
