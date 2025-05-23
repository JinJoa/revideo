// test-timestamps-debug.js
import 'dotenv/config';
import { createClient } from "@deepgram/sdk";
import * as fs from "fs";

// API 키 확인
console.log("DEEPGRAM_API_KEY exists:", !!process.env.DEEPGRAM_API_KEY);
console.log("DEEPGRAM_API_KEY length:", process.env.DEEPGRAM_API_KEY ? process.env.DEEPGRAM_API_KEY.length : 0);

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "");

async function getWordTimestamps(audioFilePath) {
  try {
    console.log(`Reading audio file: ${audioFilePath}`);
    const audioData = fs.readFileSync(audioFilePath);
    console.log(`Audio file size: ${audioData.length} bytes`);
    
    console.log("Transcribing audio with Deepgram...");
    const response = await deepgram.listen.prerecorded.transcribeFile(audioData, {
      model: "nova-2",
      smart_format: true,
      language: "ko", // 한국어 지정
      detect_language: true
    });
    
    console.log("Deepgram response:", JSON.stringify(response, null, 2));
    
    if (response && response.result) {
      const words = response.result.results.channels[0].alternatives[0].words;
      console.log(`Found ${words.length} words`);
      return words;
    } else {
      throw Error("Transcription result is null or invalid");
    }
  } catch (error) {
    console.error("Error in getWordTimestamps:", error);
    throw error;
  }
}

async function main() {
  try {
    // 분석할 오디오 파일 경로 지정
    const audioFilePath = './audio/ElevenLabs_Text_to_Speech_audio.mp3';
    console.log(`Starting analysis of audio file: ${audioFilePath}`);
    
    // 단어 타임스탬프 추출
    const words = await getWordTimestamps(audioFilePath);
    
    // 결과 출력
    console.log("\nWord Timestamps:");
    console.log(JSON.stringify(words, null, 2));
    
    // 결과를 파일로 저장
    fs.writeFileSync('word-timestamps.json', JSON.stringify(words, null, 2));
    console.log("\nResults saved to word-timestamps.json");
  } catch (error) {
    console.error('Main function error:', error);
  }
}

main();