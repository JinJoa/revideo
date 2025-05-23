// process-audio.js
import 'dotenv/config';
import { createClient } from "@deepgram/sdk";
import * as fs from "fs";
import path from 'path';

// 명령줄 인수 처리
const audioFilePath = process.argv[2];
const audioOutputName = process.argv[3] || 'audio.wav';
const imagePathsArg = process.argv[4] || 'src/images/cartoon_1.png,src/images/cartoon_2.png,src/images/cartoon_3.png';

if (!audioFilePath) {
  console.error('사용법: node process-audio.js <오디오파일경로> [오디오출력이름] [이미지경로1,이미지경로2,...]');
  console.error('예시: node process-audio.js ./src/audio/my-audio.mp3 my-audio.wav src/images/img1.png,src/images/img2.png');
  process.exit(1);
}

// 이미지 경로 목록 파싱
const imagePaths = imagePathsArg.split(',');

// API 키 확인
console.log("DEEPGRAM_API_KEY exists:", !!process.env.DEEPGRAM_API_KEY);
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
    console.log(`Starting analysis of audio file: ${audioFilePath}`);
    
    // 단어 타임스탬프 추출
    const words = await getWordTimestamps(audioFilePath);
    
    // 결과 요약 출력
    console.log("\nWord Timestamps:");
    console.log(`First word: "${words[0].punctuated_word}" (${words[0].start}s - ${words[0].end}s)`);
    console.log(`Last word: "${words[words.length-1].punctuated_word}" (${words[words.length-1].start}s - ${words[words.length-1].end}s)`);
    
    // 메타데이터 객체 생성
    const metadata = {
      audioUrl: audioOutputName,
      images: imagePaths,
      words: words
    };
    
    // metadata.json 파일 저장
    const outputPath = 'src/metadata.json';
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`\nMetadata file created successfully: ${outputPath}`);
    
    // 메타데이터 내용 요약 출력
    console.log('\n메타데이터 요약:');
    console.log(`- 오디오 URL: ${audioOutputName}`);
    console.log(`- 이미지 수: ${imagePaths.length}`);
    console.log(`- 단어 수: ${words.length}`);
    console.log('\n첫 번째 이미지:', imagePaths[0]);
    
  } catch (error) {
    console.error('Main function error:', error);
  }
}

main();