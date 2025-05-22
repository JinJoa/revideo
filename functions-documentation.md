# Revideo 프로젝트 함수 문서

이 문서는 Revideo 프로젝트에서 사용되는 주요 함수들에 대한 설명을 제공합니다.

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [API 관련 함수](#api-관련-함수)
3. [비디오 장면 관련 함수](#비디오-장면-관련-함수)
4. [자산 생성 함수](#자산-생성-함수)
5. [장면 생성 함수](#장면-생성-함수)

## 프로젝트 개요

이 프로젝트는 Revideo 라이브러리를 사용하여 비디오를 생성하는 프로젝트입니다. 주요 기능은 다음과 같습니다:

- 텍스트를 오디오로 변환 (ElevenLabs API 사용)
- 오디오에서 단어 타임스탬프 추출 (Deepgram API 사용)
- 비디오 스크립트 생성 (OpenAI API 사용)
- 이미지 프롬프트 생성 및 이미지 생성 (DALL-E API 사용)
- 비디오 장면 생성 및 렌더링 (Revideo 라이브러리 사용)

## API 관련 함수

### getWordTimestamps

**위치**: `src/render.ts`, `src/scenes/utils.ts`

**목적**: 오디오 파일에서 단어 타임스탬프를 추출합니다.

**매개변수**:
- `audioFilePath`: 오디오 파일 경로 (string)

**반환 값**: 단어 타임스탬프 배열 (각 단어의 시작 및 종료 시간 포함)

**설명**:
Deepgram API를 사용하여 오디오 파일을 전사하고 각 단어의 시작 및 종료 시간을 추출합니다. 이 정보는 비디오에서 단어를 시각적으로 동기화하는 데 사용됩니다.

```typescript
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
```

### generateAudio

**위치**: `src/render.ts`, `src/scenes/utils.ts`

**목적**: 텍스트를 오디오로 변환합니다.

**매개변수**:
- `text`: 변환할 텍스트 (string)
- `voiceName`: 사용할 음성 이름 (string)
- `savePath`: 오디오 파일을 저장할 경로 (string)

**반환 값**: 없음 (void)

**설명**:
ElevenLabs API를 사용하여 텍스트를 오디오로 변환하고 지정된 경로에 저장합니다. 이 함수는 `getVoiceByName` 함수를 사용하여 음성 이름을 음성 ID로 변환합니다.

```typescript
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
```

### getVoiceByName

**위치**: `src/render.ts`, `src/scenes/utils.ts`

**목적**: 음성 이름으로 음성 ID를 조회합니다.

**매개변수**:
- `name`: 음성 이름 (string)

**반환 값**: 음성 ID (string) 또는 null

**설명**:
ElevenLabs API를 사용하여 음성 이름에 해당하는 음성 ID를 조회합니다. 이 함수는 `generateAudio` 함수에서 사용됩니다.

```typescript
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
```

### getVideoScript

**위치**: `src/render.ts`, `src/scenes/utils.ts`

**목적**: 비디오 주제를 기반으로 스크립트를 생성합니다.

**매개변수**:
- `videoTopic`: 비디오 주제 (string)

**반환 값**: 생성된 스크립트 (string)

**설명**:
OpenAI API를 사용하여 비디오 주제를 기반으로 스크립트를 생성합니다. 이 스크립트는 YouTube 쇼츠와 같은 짧은 비디오에 적합하도록 설계되었습니다.

```typescript
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
```

### getImagePromptFromScript

**위치**: `src/render.ts`, `src/scenes/utils.ts`

**목적**: 스크립트를 기반으로 이미지 프롬프트를 생성합니다.

**매개변수**:
- `script`: 비디오 스크립트 (string)

**반환 값**: 생성된 이미지 프롬프트 (string)

**설명**:
OpenAI API를 사용하여 비디오 스크립트를 기반으로 이미지 생성에 사용할 프롬프트를 생성합니다. 이 프롬프트는 DALL-E와 같은 이미지 생성 모델에 사용됩니다.

```typescript
export async function getImagePromptFromScript(script: string) {
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
```

### dalleGenerate

**위치**: `src/render.ts`, `src/scenes/utils.ts`

**목적**: 프롬프트를 기반으로 이미지를 생성합니다.

**매개변수**:
- `prompt`: 이미지 생성 프롬프트 (string)
- `savePath`: 이미지 파일을 저장할 경로 (string)

**반환 값**: 없음 (void)

**설명**:
OpenAI의 DALL-E API를 사용하여 프롬프트를 기반으로 이미지를 생성하고 지정된 경로에 저장합니다.

```typescript
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
```

## 비디오 장면 관련 함수

### displayImages

**위치**: `src/project.tsx`

**목적**: 이미지를 순차적으로 표시합니다.

**매개변수**:
- `container`: 이미지를 표시할 컨테이너 (Reference<Layout>)
- `images`: 표시할 이미지 경로 배열 (string[])
- `totalDuration`: 총 표시 시간 (number)

**반환 값**: Generator 함수

**설명**:
이미지 배열을 순차적으로 표시하는 제너레이터 함수입니다. 각 이미지는 총 시간을 이미지 수로 나눈 시간 동안 표시됩니다.

```typescript
function* displayImages(container: Reference<Layout>, images: string[], totalDuration: number){
  for(const img of images){
    const ref = createRef<Img>();
    container().add(<Img 
      src={img}
      size={["100%", "100%"]}
      ref={ref}
      zIndex={0}
    /> 
    )
    yield* waitFor(totalDuration/images.length);
  }
}
```

### displayWords

**위치**: `src/project.tsx`

**목적**: 단어를 타임스탬프에 맞춰 표시합니다.

**매개변수**:
- `container`: 텍스트를 표시할 컨테이너 (Reference<Layout>)
- `words`: 표시할 단어 배열 (Word[])
- `settings`: 텍스트 표시 설정 (captionSettings)

**반환 값**: Generator 함수

**설명**:
단어 배열을 타임스탬프에 맞춰 표시하는 제너레이터 함수입니다. 설정에 따라 단어를 스트리밍 방식으로 표시하거나 일괄 표시할 수 있습니다.

```typescript
function* displayWords(container: Reference<Layout>, words: Word[], settings: captionSettings){
  let waitBefore = words[0].start;

  for (let i = 0; i < words.length; i += settings.numSimultaneousWords) {
    const currentBatch = words.slice(i, i + settings.numSimultaneousWords);
    const nextClipStart =
      i < words.length - 1 ? words[i + settings.numSimultaneousWords]?.start || null : null;
    const isLastClip = i + settings.numSimultaneousWords >= words.length;
    const waitAfter = isLastClip ? 1 : 0;
    const textRef = createRef<Txt>();
    yield* waitFor(waitBefore);

    if(settings.stream){
      // 스트리밍 모드 코드...
    } else {
      // 일괄 표시 모드 코드...
    }
    waitBefore = nextClipStart !== null ? nextClipStart - currentBatch[currentBatch.length-1].end : 0;
  }
}
```

### highlightCurrentWord

**위치**: `src/project.tsx`

**목적**: 현재 발음되는 단어를 강조 표시합니다.

**매개변수**:
- `container`: 텍스트를 표시할 컨테이너 (Reference<Layout>)
- `currentBatch`: 현재 표시 중인 단어 배열 (Word[])
- `wordRefs`: 단어 요소 참조 배열 (Reference<Txt>[])
- `wordColor`: 강조 표시할 단어 색상 (string)
- `backgroundColor`: 강조 표시할 단어 배경 색상 (string)

**반환 값**: Generator 함수

**설명**:
현재 발음되는 단어를 강조 표시하는 제너레이터 함수입니다. 단어의 색상과 배경색을 변경하여 강조 효과를 줍니다.

```typescript
function* highlightCurrentWord(container: Reference<Layout>, currentBatch: Word[], wordRefs: Reference<Txt>[], wordColor: string, backgroundColor: string){
  let nextWordStart = 0;

  for(let i = 0; i < currentBatch.length; i++){
    yield* waitFor(nextWordStart);
    const word = currentBatch[i];
    const originalColor = wordRefs[i]().fill();
    nextWordStart = currentBatch[i+1]?.start - word.end || 0;
    wordRefs[i]().text(wordRefs[i]().text());
    wordRefs[i]().fill(wordColor);

    const backgroundRef = createRef<Rect>();
    if(backgroundColor){
      container().add(<Rect fill={backgroundColor} zIndex={1} size={wordRefs[i]().size} position={wordRefs[i]().position} radius={10} padding={10} ref={backgroundRef} />);
    }

    yield* waitFor(word.end-word.start);
    wordRefs[i]().text(wordRefs[i]().text());
    wordRefs[i]().fill(originalColor);

    if(backgroundColor){
      backgroundRef().remove();
    }
  }
}
```

## 자산 생성 함수

### createAssets

**위치**: `src/get-assets.ts`

**목적**: 비디오 주제를 기반으로 필요한 자산(오디오, 이미지, 메타데이터)을 생성합니다.

**매개변수**:
- `topic`: 비디오 주제 (string)
- `voiceName`: 사용할 음성 이름 (string)

**반환 값**: Promise<void>

**설명**:
비디오 주제를 기반으로 스크립트를 생성하고, 스크립트를 오디오로 변환하고, 오디오에서 단어 타임스탬프를 추출하고, 이미지를 생성하고, 메타데이터를 생성하는 함수입니다.

```typescript
async function createAssets(topic: string, voiceName: string){
    const jobId = uuidv4();

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
    const words = await getWordTimestamps(`./public/${jobId}-audio.wav`);

    console.log("Generating images...")
    const imagePromises = Array.from({ length: 5 }).map(async (_, index) => {
        const imagePrompt = await getImagePromptFromScript(script);
        await dalleGenerate(imagePrompt, `./public/${jobId}-image-${index}.png`);
        return `/${jobId}-image-${index}.png`;
    });

    const imageFileNames = await Promise.all(imagePromises);
    const metadata = {
      audioUrl: `${jobId}-audio.wav`,
      images: imageFileNames,
      words: words
    };
  
    await fs.promises.writeFile(`./public/${jobId}-metadata.json`, JSON.stringify(metadata, null, 2));
}
```

## 장면 생성 함수

### makeScene2D (example.tsx)

**위치**: `src/scenes/example.tsx`

**목적**: 비디오 파일을 표시하는 2D 장면을 생성합니다.

**매개변수**: 없음

**반환 값**: Scene2D 객체

**설명**:
Revideo 라이브러리의 `makeScene2D` 함수를 사용하여 비디오 파일을 표시하는 2D 장면을 생성합니다.

```typescript
export default makeScene2D(function* (view) {
  const videoFile = useScene().variables.get(
    'video',
    'https://revideo-example-assets.s3.amazonaws.com/stars.mp4',
  )();

  yield view.add(<Video src={videoFile} size={['100%', '100%']} play={true} />);

  yield* waitFor(10);
});
```

### makeScene2D (project.tsx)

**위치**: `src/project.tsx`

**목적**: 오디오와 이미지를 동기화하여 표시하는 2D 장면을 생성합니다.

**매개변수**: 없음

**반환 값**: Scene2D 객체

**설명**:
Revideo 라이브러리의 `makeScene2D` 함수를 사용하여 오디오와 이미지를 동기화하여 표시하는 2D 장면을 생성합니다. 이 장면은 `displayImages`와 `displayWords` 함수를 사용하여 이미지와 단어를 표시합니다.

```typescript
const scene = makeScene2D('scene', function* (view) {
  const images = useScene().variables.get('images', [])();
  const audioUrl = useScene().variables.get('audioUrl', 'none')();
  const words = useScene().variables.get('words', [])();

  const duration = words[words.length-1].end + 0.5;

  const imageContainer = createRef<Layout>();
  const textContainer = createRef<Layout>();

  yield view.add(
    <>
      <Layout
        size={"100%"}
        ref={imageContainer}
      />
      <Layout
        size={"100%"}
        ref={textContainer}
      />
      <Audio
        src={audioUrl}
        play={true}
      />
      <Audio
        src={"https://revideo-example-assets.s3.amazonaws.com/chill-beat-2.mp3"}
        play={true}
        volume={0.1}
      />
    </>
  );

  yield* all(
    displayImages(imageContainer, images, duration),
    displayWords(
      textContainer,
      words,
      textSettings
    )
  )
});
```

### makeScene2D (utils.tsx)

**위치**: `src/scenes/utils.tsx`

**목적**: 이미지를 순차적으로 표시하는 2D 장면을 생성합니다.

**매개변수**: 없음

**반환 값**: Scene2D 객체

**설명**:
Revideo 라이브러리의 `makeScene2D` 함수를 사용하여 이미지를 순차적으로 표시하는 2D 장면을 생성합니다.

```typescript
export default makeScene2D('cartoon', function* (view) {
  const images: string[] = [
    '/public/images/cartoon_1.jpg',
    '/public/images/cartoon_2.jpg',
    '/public/images/cartoon_3.jpg',
  ];

  for (const path of images) {
    yield view.add(<Img src={path} size={['100%', '100%']} />);
    yield* waitFor(2); // 각 컷 2초 노출
    view.clear();
  }

  yield view.add(<Img src={'/images/cartoon_전체.jpg'} size={['100%', '100%']} />);
  yield* waitFor(3); // 전체컷 3초 노출
});