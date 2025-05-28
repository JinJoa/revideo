import { Audio, makeScene2D, Layout, Rect, Img, Txt } from '@revideo/2d';
import { all, createRef, useScene, makeProject, Reference } from '@revideo/core';
import metadata from './metadata.json';
import './global.css';
import { createSlideFooter, defaultTextSettings } from './components/SlideFooter';
import { createSlideHeader } from './components/SlideHeader';
import { createSlideBody } from './components/SlideBody';
import { ImageAnimationConfig, executeImageAnimations } from './animations/imageAnimations';


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



/**
 * 메인 씬
 */
const scene = makeScene2D('scene', function* (view) {
  // 메타데이터에서 변수 가져오기
  const words = metadata.words;
  const audioUrl = '/audio/ElevenLabs_Text_to_Speech_audio.mp3';

  // 마지막 단어의 종료 시간 + 0.5초를 전체 지속 시간으로 설정
  const duration = words[words.length-1].end + 0.5;

  // metadata.json에서 모든 이미지 가져오기
  const images = metadata.images;

  const slides = images.map((image, index) => ({
    content: {
      image,
      audio: audioUrl // 모든 슬라이드에서 같은 오디오 사용
    },
    timing: {
      duration: duration / images.length // 각 이미지의 표시 시간
    },
    animations: {
      image: getRandomImageAnimation()
    }
  }));

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
          justifyContent={"start"}
          alignItems={"center"}
        >
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
          justifyContent={"end"}
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

  // 헤더 생성 및 표시
  const header = createSlideHeader({
    header: "아나셀 탈모 솔루션",
    view
  });
  yield* header.showHeader();

  // 슬라이드 바디 생성
  const slideBody = createSlideBody({
    slides,
    view,
    imageContainer
  });

  // 슬라이드 푸터 생성
  const slideFooter = createSlideFooter({
    textContainer,
    words,
    settings: defaultTextSettings
  });

  // 이미지와 텍스트 동시에 표시
  yield* all(
    slideBody.playSlides(),
    slideFooter.playFooter()
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