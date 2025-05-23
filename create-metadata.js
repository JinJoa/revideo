// create-metadata.js
import * as fs from 'fs';
import path from 'path';

// 명령줄 인수 처리
const timestampsFilePath = process.argv[2];
const audioUrl = process.argv[3];
const imagePathsArg = process.argv[4];

if (!timestampsFilePath || !audioUrl || !imagePathsArg) {
  console.error('사용법: node create-metadata.js <타임스탬프파일경로> <오디오URL> <이미지경로1,이미지경로2,...>');
  console.error('예시: node create-metadata.js word-timestamps.json my-audio.wav src/images/img1.png,src/images/img2.png');
  process.exit(1);
}

// 이미지 경로 목록 파싱
const imagePaths = imagePathsArg.split(',');

try {
  // 타임스탬프 파일 읽기
  console.log(`Reading timestamps from: ${timestampsFilePath}`);
  const timestampsData = fs.readFileSync(timestampsFilePath, 'utf8');
  const words = JSON.parse(timestampsData);
  
  // 메타데이터 객체 생성
  const metadata = {
    audioUrl: audioUrl,
    images: imagePaths,
    words: words
  };
  
  // 메타데이터 파일 저장
  const outputPath = 'src/metadata.json';
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
  console.log(`Metadata file created successfully: ${outputPath}`);
  
  // 메타데이터 내용 요약 출력
  console.log('\n메타데이터 요약:');
  console.log(`- 오디오 URL: ${audioUrl}`);
  console.log(`- 이미지 수: ${imagePaths.length}`);
  console.log(`- 단어 수: ${words.length}`);
  console.log('\n첫 번째 이미지:', imagePaths[0]);
  console.log('첫 번째 단어:', words[0].punctuated_word, `(${words[0].start}s - ${words[0].end}s)`);
  
} catch (error) {
  console.error('Error creating metadata file:', error);
}