import type SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

export interface Message {
	name: string;
	content: string;
	result?: SpeechSDK.PronunciationAssessmentResult;
	self?: boolean;
	audio?: string;
	avatar?: string;
	/** ignore in the chat context */
	ignore?: boolean;
	/** hidden from the user interface */
	hidden?: boolean;
}
