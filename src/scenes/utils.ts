//참고 링크 : https://github.com/redotvideo/examples/tree/main/youtube-shorts/src

import OpenAI from 'openai/index.mjs';
import axios from "axios";
import * as fs from "fs";
import { createClient } from "@deepgram/sdk";
import { Img, makeScene2D, Video } from '@revideo/2d';
import { waitFor } from '@revideo/core';


const deepgram = createClient(process.env["DEEPGRAM_API_KEY"] || "");
const openai = new OpenAI({
	apiKey: process.env['OPENAI_API_KEY'],
  });  

export async function getWordTimestamps(audioFilePath: string){
    const {result} = await deepgram.listen.prerecorded.transcribeFile(fs.readFileSync(audioFilePath), {
		model: "nova-2",
		smart_format: true,
	});

    if (result) {
        return result.results.channels[0].alternatives[0].words;
    } else {
		throw Error("transcription result is null");
    }

}

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
  const prompt = `Create a script for a youtube short. The script should be around 60 to 80 words long and be an interesting text about the provided topic, and it should start with a catchy headline, something like "Did you know that?" or "This will blow your mind". Remember that this is for a voiceover that should be read, so things like hashtags should not be included. Now write the script for the following topic: "${videoTopic}". Now return the script and nothing else, also no meta-information - ONLY THE VOICEOVER.`;

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
  //const prompt = `My goal is to create a Youtube Short based on the following script. To create a background image for the video, I am using a text-to-video AI model. Please write a short (not longer than a single sentence), suitable prompt for such a model based on this script: ${script}.\n\nNow return the prompt and nothing else.`;
  const prompt = `식약처 인증받은 탈모 기능성 화장품 '아나셀' 홍보용 유튜브 쇼츠를 만들고자 합니다. 다음 스크립트를 기반으로 영상에 사용할 배경 이미지를 생성하기 위한 짧은 프롬프트(한 문장)를 작성해주세요: ${script}.\n\n프롬프트만 반환해주세요. 그 외의 설명은 필요 없습니다.`;
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

// export default makeScene2D('cartoon', function* (view) {
// //   const images: string[] = [
// //     'src/images/cartoon_1.png',
// //     'src/images/cartoon_2.png',
// //     'src/images/cartoon_3.png',
// //   ];

// //   for (const path of images) {
// //     const img = yield view.add(<Img src={path}/>);
// //     yield* waitFor(2);
// //     img.remove();
// //   }
// yield* view.add(<Img src={'src/images/cartoon_1.png'} />);
// yield* waitFor(1);
// yield* view.add(<Img src={'src/images/cartoon_2.png'} />);
// yield* waitFor(1);
// yield* view.add(<Img src={'src/images/cartoon_3.png'} />);
// yield* waitFor(1);
// //   yield view.add(<Img src={'/images/cartoon_전체.jpg'} size="100%" />);
// //   yield* waitFor(3); // 전체컷 3초 노출
// });
