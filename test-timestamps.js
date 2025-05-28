// test-timestamps.js
import 'dotenv/config';
import { createClient } from "@deepgram/sdk";
import * as fs from "fs";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "");

async function getWordTimestamps(audioFilePath) {
  console.log(`Reading audio file: ${audioFilePath}`);
  const audioData = fs.readFileSync(audioFilePath);
  
  console.log("Transcribing audio with Deepgram...");
  const { result } = await deepgram.listen.prerecorded.transcribeFile(audioData, {
    model: "nova-2",
    smart_format: true,
  });

  if (result) {
    return result.results.channels[0].alternatives[0].words;
  } else {
    throw Error("Transcription result is null");
  }
}

async function main() {
  try {
    // 분석할 오디오 파일 경로 지정
    const audioFilePath = 'public/anacell-audio.wav';
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
    console.error('Error:', error);
  }
}

main();