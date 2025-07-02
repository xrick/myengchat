import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import debug from 'debug';

const log = debug('azure');

export const GET: RequestHandler = async ({ fetch }) => {
	const speechKey = env.AZURE_SPEECH_KEY;
	const speechRegion = env.AZURE_SPEECH_REGION;

	if (!speechKey || !speechRegion) {
		return json(
			{ error: 'You forgot to add your speech key or region to the .env file.' },
			{ status: 400 }
		);
	}

	const headers = {
		'Ocp-Apim-Subscription-Key': speechKey,
		'Content-Type': 'application/x-www-form-urlencoded'
	};

	try {
		const res = await fetch(
			`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
			{
				method: 'POST',
				headers
			}
		);

		if (!res.ok) {
			log('Failed to fetch Azure token', res);
			throw new Error('Network response was not ok');
		}

		const token = await res.text();
		return json({ token, region: speechRegion });
	} catch (err) {
		log(err);
		return json({ error: 'There was an error authorizing your speech key.' }, { status: 401 });
	}
};
