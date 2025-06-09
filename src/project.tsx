import { Audio, makeScene2D, Layout, Rect, Txt } from '@revideo/2d';
import { all, createRef, useScene, makeProject, Reference } from '@revideo/core';
import metadata from './metadata.json';
import './global.css';
import { createSlideFooter, defaultTextSettings } from './components/SlideFooter';
import { createSlideHeader } from './components/SlideHeader';
import { createSlideBody } from './components/SlideBody';
import { ImageAnimationConfig, executeImageAnimations } from './components/JinImage';
import { JinImage } from './components/JinImage';


// 랜덤 애니메이션 설정 생성 함수 (주석처리)
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

// zoomIn과 zoomOut을 번갈아가며 사용하는 함수
function getAlternatingZoomAnimation(index: number): ImageAnimationConfig {
  const isEven = index % 2 === 0;
  
  return {
    zoom: {
      type: isEven ? 'zoomIn' : 'zoomOut',
      intensity: 0.15
    },
    pan: {
      type: 'none',
      distance: 0
    },
    transition: {
      type: 'none',
      duration: 0
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
  //const audioUrl = 'public/audio/anacell-audio.wav';

  // 오디오 길이를 metadata.json의 마지막 단어 시간으로 설정
  const audioDuration = words[words.length-1].end;
  
  // 이미지 개수에 따른 슬라이드 지속 시간 계산
  const slideCount = metadata.images.length;
  const slideDuration = audioDuration / slideCount;

  // metadata.json에서 모든 이미지 가져오기
  const images = metadata.images;

  const slides = images.map((image, index) => ({
    content: {
      image,
      audio: audioUrl
    },
    timing: {
      duration: slideDuration // 모든 슬라이드 동일한 지속 시간
    },
    animations: {
      image: getAlternatingZoomAnimation(index)
    }
  }));

  // 컨테이너 참조 생성
  const textContainer = createRef<Layout>();
  const imageContainer = createRef<Layout>();
  const headerContainer = createRef<Layout>();

  // 배경 및 레이아웃 추가
  yield view.add(
    <>
      {/* 배경 색상 */}
      <Rect 
        width={"100%"}
        height={"100%"}
        fill="#000000"
      />

      {/* 메인 레이아웃 */}
      <Layout
        layout
        size={["100%", "100%"]}
        direction={"column"}
        gap={0}
        padding={0}
        justifyContent={"start"}
        alignItems={"stretch"}
      >
        {/* 헤더 영역 - 25% */}
        <Layout
          layout
          ref={headerContainer}
          size={["100%", "25%"]}
          padding={0}
          justifyContent={"start"}
          alignItems={"center"}
        >
        </Layout>

        {/* 본문 영역 - 55% */}
        <Layout
          layout
          ref={imageContainer}
          size={["100%", "55%"]}
          padding={0}
          justifyContent={"center"}
          alignItems={"center"}
        >
        </Layout>

        {/* 푸터 영역 - 20% */}
        <Layout
          layout
          ref={textContainer}
          size={["100%", "20%"]}
          padding={0}
          direction={"column"}
          justifyContent={"center"}
          alignItems={"center"}
        >
        </Layout>

        {/* 하단 여백 - 10% */}
        <Layout
          layout
          size={["100%", "10%"]}
          padding={0}
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

  // 헤더 생성 (무한 반복 타이핑 효과 적용)
  const header = createSlideHeader({
    header: "아나셀 탈모 솔루션",
    view,
    effect: "typewriter",  //효과 타입 직접 사용
    effectConfig: {
      duration: audioDuration,
      textColor: "#FF0000",
      strokeColor: "#000000"
    }
  });

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

  // 헤더, 이미지, 텍스트 모두 동시에 표시하고 정확히 오디오 길이만큼 실행
  yield* all(
    header.showHeader(), // 무한 반복 타이핑 효과
    slideBody.playSlides(),
    slideFooter.playFooter()
  );

  // 오디오가 끝나면 씬도 정확히 종료되도록 보장
  console.log(`Scene ending at audio duration: ${audioDuration} seconds`);
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
