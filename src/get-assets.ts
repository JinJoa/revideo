require('dotenv').config();

// import { getVideoScript, generateAudio, getWordTimestamps } from './render';
import { getVideoScript, generateAudio, getWordTimestamps } from './utils';
//import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';


async function createAssets(topic: string, voiceName: string){
    //const jobId = uuidv4();
    const jobId = 'anacell';

    console.log("Generating assets...")
    //const script = await getVideoScript(topic);
    const script = `왜 샴푸할수록 머리카락이 통장잔고처럼 줄어들까?
    나도 모르게 머리숱이 지갑처럼 얇아지던 날, 아나세를 만나고 털망했던 머리가 부활템 착용함.
    탈모약?? 화장품도 아닌 뭔가 쓸때마다 머리뿌리가 외계인 침공당하는 느낌 
    아나셀은 JAK억제와 Wnt조절로 잠자는 모발을 깨워준다!
    식약청 인증받은 최초의 탈모 기능성 화장품
    발모주기인 세 달을 써보니, 빗자루 머리가 고슴도치 머리로 진화중
    판교 헤어샵 사장님이 "이거 뭐냐"고 물어볼 정도로 풍성해짐
    여성이나 아이들 탈모에도 안전하게 사용할 수 있어.
    지금 아나셀 홈페이지를 검색해봐!`;
    console.log("script", script);

    await generateAudio(script, voiceName, `./public/${jobId}-audio.wav`);
    //const words = await getWordTimestamps(`./public/${jobId}-audio.wav`);
    const audioPath = `./public/${jobId}-audio.wav`;
    const words = await getWordTimestamps(audioPath);

    console.log("Loading all images from public/images...")
    console.log("script", script);
    console.log("words", words);

    // public/images 폴더의 모든 이미지 파일을 동적으로 가져오기
    const imagesDir = './public/images';
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
    
    let imageFiles: string[] = [];
    try {
        const files = await fs.promises.readdir(imagesDir);
        imageFiles = files
            .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
            .filter(file => {
                // 특허 관련 파일들 제외
                const lowerFile = file.toLowerCase();
                return !lowerFile.includes('특허') &&
                       !lowerFile.includes('patent') &&
                       !lowerFile.includes('상표등록');
            })
            .map(file => `/images/${encodeURIComponent(file)}`)
            .sort(); // 파일명 순으로 정렬
        
        console.log(`Found ${imageFiles.length} images (excluding patents):`, imageFiles);
    } catch (error) {
        console.error('Error reading images directory:', error);
        // 폴백으로 기존 이미지 사용
        imageFiles = [
            '/images/cartoon_1.png',
            '/images/cartoon_2.png',
            '/images/cartoon_3.png'
        ];
    }
    const metadata = {
      audioUrl: `${jobId}-audio.wav`,
      images: imageFiles,
      words: words
    };
  
    await fs.promises.writeFile(`./public/${jobId}-metadata.json`, JSON.stringify(metadata, null, 2));
}

createAssets("hair loss treatment", "Sarah")
