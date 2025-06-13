require('dotenv').config();

// import { getVideoScript, generateAudio, getWordTimestamps } from './render';
import { getVideoScript, generateAudio, getWordTimestamps, getImagePromptFromScript, dalleGenerate } from './utils';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';


async function createAssets(topic: string, voiceName: string){
    const jobId = uuidv4();
    //const jobId = 'anacell';

    console.log("Generating assets...")
    const script = await getVideoScript(topic);
    // const script = `왜 샴푸할수록 머리카락이 통장잔고처럼 줄어들까?
    // 나도 모르게 머리숱이 지갑처럼 얇아지던 날, 아나세를 만나고 털망했던 머리가 부활템 착용함.
    // 탈모약?? 화장품도 아닌 뭔가 쓸때마다 머리뿌리가 외계인 침공당하는 느낌 
    // 아나셀은 JAK억제와 Wnt조절로 잠자는 모발을 깨워준다!
    // 식약청 인증받은 최초의 탈모 기능성 화장품
    // 발모주기인 세 달을 써보니, 빗자루 머리가 고슴도치 머리로 진화중
    // 판교 헤어샵 사장님이 "이거 뭐냐"고 물어볼 정도로 풍성해짐
    // 여성이나 아이들 탈모에도 안전하게 사용할 수 있어.
    // 지금 아나셀 홈페이지를 검색해봐!`;
    console.log("script", script);

    // Create audio and metadata directories
    await fs.promises.mkdir('./public/audio', { recursive: true });
    await fs.promises.mkdir('./public/metadata', { recursive: true });

    const audioPath = `./public/audio/${jobId}-audio.wav`;
    await generateAudio(script, voiceName, audioPath);
    const words = await getWordTimestamps(audioPath);

    console.log("Generating images based on script...")
    console.log("script", script);
    console.log("words", words);

    // Create job-specific image directory
    const jobImageDir = `./public/images/${jobId}`;
    await fs.promises.mkdir(jobImageDir, { recursive: true });

    // Generate image prompt from script
    const imagePrompt = await getImagePromptFromScript(script);
    console.log("Generated image prompt:", imagePrompt);

    // Generate multiple images for the video (3-5 images)
    const numberOfImages = 4; // Change this number to generate more images
    let imageFiles: string[] = [];
    
    try {
        for (let i = 0; i < numberOfImages; i++) {
            const imagePath = `${jobImageDir}/image_${i + 1}.png`;
            const imageUrl = `/images/${jobId}/image_${i + 1}.png`;
            
            console.log(`Generating image ${i + 1}/${numberOfImages}...`);
            await dalleGenerate(imagePrompt, imagePath);
            imageFiles.push(imageUrl);
        }
        
        console.log(`Generated ${imageFiles.length} images:`, imageFiles);
    } catch (error) {
        console.error('Error generating images:', error);
        // Fallback to existing images if generation fails
        console.log("Falling back to existing images...");
        const imagesDir = './public/images';
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
        
        // try {
        //     const files = await fs.promises.readdir(imagesDir);
        //     imageFiles = files
        //         .filter(file => imageExtensions.includes(path.extname(file).toLowerCase()))
        //         .filter(file => {
        //             const lowerFile = file.toLowerCase();
        //             return !lowerFile.includes('특허') &&
        //                    !lowerFile.includes('patent') &&
        //                    !lowerFile.includes('상표등록');
        //         })
        //         .map(file => `/images/${encodeURIComponent(file)}`)
        //         .sort()
        //         .slice(0, numberOfImages); // Limit to same number of images
        // } catch (fallbackError) {
        //     console.error('Error reading fallback images:', fallbackError);
        //     imageFiles = [
        //         '/images/cartoon_1.png',
        //         '/images/cartoon_2.png',
        //         '/images/cartoon_3.png',
        //         '/images/cartoon_4.png'
        //     ];
        // }
    }
    const metadata = {
      audioUrl: `audio/${jobId}-audio.wav`,
      images: imageFiles,
      words: words
    };
  
    await fs.promises.writeFile(`./public/metadata/${jobId}-metadata.json`, JSON.stringify(metadata, null, 2));
}

createAssets("간헐적 단식의 장점", "Jessica") //(비디오 주제 topic, 음성이름)
