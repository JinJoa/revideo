import { Audio, makeScene2D, Layout, Rect, Img, Txt } from '@revideo/2d';
import { all, createRef, useScene, makeProject, Reference } from '@revideo/core';
import metadata from './metadata.json';
import './global.css';
import { displayWords } from './components/SlideFooter';
import { createSlideHeader } from './components/SlideHeader';
import { createSlideBody } from './components/SlideBody';
import { ImageAnimationConfig, executeImageAnimations } from './animations/imageAnimations';
import { StructuredSlide } from './types/slide';

// 랜덤 애니메이션 설정 생성 함수
function getRandomImageAnimation(): ImageAnimationConfig {
  const zoomTypes = ['zoomIn', 'zoomOut', 'zoomInOut', 'static'];
  const panTypes = ['panLeft', 'panRight', 'panUp', 'panDown', 'none'];
  const transitionTypes = ['flash', 'blink', 'shutterTransition', 'fade', 'none'];
  
  return {
    zoom: {
      type: zoomTypes[Math.floor(Math.random() * zoomTypes.length)] as any,
      intensity: 0.15
    },
    pan: {
      type: panTypes[Math.floor(Math.random() * panTypes.length)] as any,
      distance: 100
    },
    transition: {
      type: transitionTypes[Math.floor(Math.random() * transitionTypes.length)] as any,
      duration: 0.5
    }
  };
}

// 텍스트 설정 - 글씨 색상을 검정색으로 변경
const textSettings = {
  fontSize: 60,
  numSimultaneousWords: 4,
  textColor: "black", // 글씨 색상을 검정색으로 변경
  fontWeight: 800,
  fontFamily: "Mulish",
  stream: false,
  textAlign: "center" as "center",
  textBoxWidthInPercent: 90,
  fadeInAnimation: true,
  currentWordColor: "black", // 하이라이트 글씨는 검정색 유지
  currentWordBackgroundColor: "white", // 하이라이트 배경은 흰색 유지
  //shadowColor: "black",
  //shadowBlur: 30
};

// 이미지 슬라이드쇼 표시 함수 인터페이스
interface DisplayImagesProps {
  imageContainer: Reference<Layout>;
  images: string[];
  duration: number;
}

/**
 * 이미지 슬라이드쇼 표시 함수 - 레이아웃 컨테이너에 추가하도록 수정
 */
function* displayImages({ imageContainer, images, duration }: DisplayImagesProps) {
  // 각 이미지에 대해 순차적으로 표시
  for (let i = 0; i < images.length; i++) {
    const imageRef = createRef<Img>();
    
    console.log(`이미지 추가 시도: ${images[i]}`);
    
    // 이미지를 이미지 컨테이너에 추가
    imageContainer().add(
      <Img
        ref={imageRef}
        src={images[i]}
        width={"100%"} // 컨테이너 가로폭의 100%로 설정
        x={0}
        y={0}
        opacity={0}
      />
    );
    
    // 간단한 페이드인 애니메이션
    yield* imageRef().opacity(1, 0.5);
    
    // 이미지 표시 시간
    const slideDuration = duration / images.length;
    yield* imageRef().opacity(1, slideDuration - 1);
    
    // 페이드아웃 애니메이션
    yield* imageRef().opacity(0, 0.5);
    
    // 이미지 제거
    imageRef().remove();
  }
}

/**
 * 메인 씬
 */
const scene = makeScene2D('scene', function* (view) {
  // 이미지 파일 경로 배열 - 절대 경로로 수정
  const images = [
    '/images/cartoon_1.png',
    '/images/cartoon_2.png',
    '/images/cartoon_3.png',
    '/images/cartoon_전체.png'
  ];
  
  // 메타데이터에서 변수 가져오기
  const words = metadata.words;
  const audioUrl = '/audio/ElevenLabs_Text_to_Speech_audio.mp3';

  // 마지막 단어의 종료 시간 + 0.5초를 전체 지속 시간으로 설정
  const duration = words[words.length-1].end + 0.5;

  // 컨테이너 참조 생성
  const textContainer = createRef<Layout>();
  const imageContainer = createRef<Layout>();
  const headerContainer = createRef<Layout>();

  // 배경 및 레이아웃 추가
  yield view.add(
    <>
      {/* 배경 - 회색 배경 */}
      <Rect 
        width={"100%"}
        height={"100%"}
        fill="#FFFFFF"
      />

      {/* 메인 레이아웃 */}
      <Layout
        size={["100%", "100%"]}
        direction={"column"}
        gap={0}
        padding={0}
        justifyContent={"start"}
        alignItems={"stretch"}
      >
        {/* 헤더 영역 - 20% */}
        <Layout
          ref={headerContainer}
          size={["100%", "20%"]}
          padding={0}
          direction={"column"}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <Txt
            text="아나셀 탈모 솔루션"
            fill="#32D74B"
            fontFamily="Arial"
            fontSize={110}
            fontWeight={900}
            textAlign="center"
            stroke="#1E293B"
            strokeFirst={true}
            lineWidth={3}
          />
        </Layout>

        {/* 본문 영역 - 50% */}
        <Layout
          ref={imageContainer}
          size={["100%", "50%"]}
          padding={0}
          direction={"column"}
          justifyContent={"center"}
          alignItems={"center"}
        >
        </Layout>

        {/* 푸터 영역 - 30% */}
        <Layout
          ref={textContainer}
          size={["100%", "30%"]}
          padding={0}
          direction={"column"}
          justifyContent={"center"}
          alignItems={"center"}
        >
        </Layout>
      </Layout>
      
      {/* 오디오 */}
      <Audio
        src={audioUrl}
        play={true}
      />
    </>
  );

  // 이미지와 텍스트 동시에 표시
  yield* all(
    displayImages({
      imageContainer,
      images,
      duration
    }),
    displayWords({
      textContainer,
      words,
      settings: textSettings
    })
  );

  
});

/**
 * 최종 프로젝트 설정
 */
export default makeProject({
  scenes: [scene],
  variables: metadata,
  settings: {
    shared: {
      size: {x: 1080, y: 1920}, // 9:16 비율
    },
  },
});