//참고 링크 : https://github.com/redotvideo/examples/tree/main/youtube-shorts/src

import OpenAI from 'openai/index.mjs';
import axios from "axios";
import * as fs from "fs";
import { createClient } from "@deepgram/sdk";
import { TextToSpeechClient } from '@google-cloud/text-to-speech';


const deepgram = createClient(process.env["DEEPGRAM_API_KEY"] || "");
const openai = new OpenAI({
	apiKey: process.env['OPENAI_API_KEY'],
  });

// Google Cloud TTS client
const googleTtsClient = new TextToSpeechClient({
    // Use API key for simpler setup
    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
    // Or use service account: keyFilename: 'path/to/service-account-key.json'
});  

export async function getWordTimestamps(audioFilePath: string){
    const {result} = await deepgram.listen.prerecorded.transcribeFile(fs.readFileSync(audioFilePath), {
		model: "nova-2",
		language: "ko", // Korean language support for proper Korean TTS
		smart_format: true,
	});

    if (result) {
        return result.results.channels[0].alternatives[0].words;
    } else {
		throw Error("transcription result is null");
    }

}

// Korean TTS using Google Cloud
export async function generateKoreanAudio(text: string, voiceName: string, savePath: string) {
    try {
        console.log("Attempting Google Cloud TTS...");
        const request = {
            input: { text: text },
            voice: {
                languageCode: 'ko-KR',
                name: voiceName, // e.g., 'ko-KR-Standard-A' (female) or 'ko-KR-Standard-C' (male)
                ssmlGender: 'FEMALE' as const,
            },
            audioConfig: {
                audioEncoding: 'LINEAR16' as const,
                sampleRateHertz: 22050,
            },
        };

        const [response] = await googleTtsClient.synthesizeSpeech(request);
        
        if (response.audioContent) {
            fs.writeFileSync(savePath, response.audioContent, 'binary');
            console.log(`Korean audio saved to: ${savePath}`);
        } else {
            throw new Error('No audio content received from Google TTS');
        }
    } catch (error) {
        console.error('Google TTS error:', error);
        console.log('Google Cloud credentials not set up. Please set GOOGLE_APPLICATION_CREDENTIALS environment variable.');
        console.log('Falling back to ElevenLabs with Jessica voice...');
        
        // Fallback to ElevenLabs
        await generateAudio(text, 'Jessica', savePath);
    }
}

// Fallback to ElevenLabs for English voices
export async function generateAudio(text: string, voiceName: string, savePath: string) {
	const data = {
		model_id: "eleven_multilingual_v2",
		text: text,
	};

	const voiceId = await getVoiceByName(voiceName);

	const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, data, {
		headers: {
			"Content-Type": "application/json",
			"xi-api-key": process.env.ELEVEN_API_KEY || "",
		},
		responseType: "arraybuffer",
	});

	fs.writeFileSync(savePath, response.data);
}

async function getVoiceByName(name: string) {
	const response = await fetch("https://api.elevenlabs.io/v1/voices", {
		method: "GET",
		headers: {
			"xi-api-key": process.env.ELEVEN_API_KEY || "",
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const data: any = await response.json();
	const voice = data.voices.find((voice: {name: string; voice_id: string}) => voice.name === name);
	return voice ? voice.voice_id : null;
}

export async function getVideoScript(videoTopic: string) {
  const prompt = `유튜브 쇼츠용 스크립트를 한국어로 작성해주세요. 스크립트는 90-120단어 정도의 길이로, 제공된 주제에 대한 흥미로운 내용이어야 합니다. "이걸 알고 있었나요?" 또는 "이건 정말 놀라운 사실이에요" 같은 매력적인 헤드라인으로 시작해주세요. 더 자세한 설명과 구체적인 예시를 포함해서 50초 정도 읽을 수 있는 분량으로 작성해주세요. 이것은 음성으로 읽힐 것이므로 해시태그 같은 것은 포함하지 마세요. 다음 주제로 스크립트를 작성해주세요: "${videoTopic}". 스크립트만 반환하고 다른 설명은 하지 마세요 - 오직 음성용 대본만 작성해주세요.`;

  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4-turbo-preview',
  });

  const result = chatCompletion.choices[0].message.content;

  if (result) {
    return result;
  } else {
    throw Error("returned text is null");
  }

}

export async function getImagePromptFromScript(script: string) {
  const prompt = `My goal is to create a Youtube Short based on the following script. To create a background image for the video, I am using a text-to-video AI model. Please write a short (not longer than a single sentence), suitable prompt for such a model based on this script: ${script}.\n\nNow return the prompt and nothing else.`;
  //const prompt = `식약처 인증받은 탈모 기능성 화장품 '아나셀' 홍보용 유튜브 쇼츠를 만들고자 합니다. 다음 스크립트를 기반으로 영상에 사용할 배경 이미지를 생성하기 위한 짧은 프롬프트(한 문장)를 작성해주세요: ${script}.\n\n프롬프트만 반환해주세요. 그 외의 설명은 필요 없습니다.`;
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4-turbo-preview',
    temperature: 1.0 // high temperature for "creativeness"
  });

  const result = chatCompletion.choices[0].message.content;

  if (result) {
    return result;
  } else {
    throw Error("returned text is null");
  }

}

export async function dalleGenerate(prompt: string, savePath: string) {
	const response = await openai.images.generate({
		model: "dall-e-3",
		prompt: prompt,
		size: "1024x1792",
		quality: "standard",
		n: 1,
	});

	if (!response.data || !response.data[0]) {
		throw new Error("No image generated");
	}

	const url = response.data[0].url;
	const responseImage = await axios.get(url || "", {
		responseType: "arraybuffer",
	});
	const buffer = Buffer.from(responseImage.data, "binary");
	
	try {
		await fs.promises.writeFile(savePath, buffer);
	  } catch (error) {
		console.error("Error saving the file:", error);
		throw error; // Rethrow the error so it can be handled by the caller
	  }
	}
