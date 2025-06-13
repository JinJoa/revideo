import { Audio, makeScene2D, Layout, Rect, Txt } from '@revideo/2d';
import { all, createRef, useScene, makeProject, Reference } from '@revideo/core';
import metadata from '../../public/metadata/d79a8387-d3f9-4ad2-83ca-3f817c014c39-metadata.json';
import '../global.css';
import { createSlideFooter, defaultTextSettings } from '../layout/SlideFooter';
import { createSlideHeader } from '../layout/SlideHeader';
import { SlideBody } from '../layout/SlideBody';
import { ImageAnimationConfig } from '../components/JinImage';
import { LineEffect } from '../background/LineEffect';
import { ParticleEffect } from '../background/ParticleEffect';


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
export default makeScene2D('IntermittentFasting', function* (view) {
  // 메타데이터에서 변수 가져오기
  const words = metadata.words;
  const audioUrl = `/audio/d79a8387-d3f9-4ad2-83ca-3f817c014c39-audio.wav`;

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
  
  // 이펙트 참조 생성
  const lineEffectRef = createRef<LineEffect>();
  const particleEffectRef = createRef<ParticleEffect>();


  // 라인 이펙트 추가
  view.add(
    <LineEffect
      ref={lineEffectRef}
      centerX={0}
      centerY={0}
      lineCount={60}
      maxLength={1000}
      color="#40E0D0"
      secondaryColor="#87CEFA"
      opacity={0.5}
    />
  );

  // 파티클 이펙트 추가
  view.add(
    <ParticleEffect
      ref={particleEffectRef}
      centerX={0}
      centerY={0}
      particleCount={60}
      maxDistance={800}
      color="#FFD700"
      secondaryColor="#FFF8DC"
      intensity={0.7}
    />
  );

  // 배경 및 레이아웃 추가
  yield view.add(
    <>
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
            {/* 배경음악 */}
      {/* <Audio
        src="/audio/background_music.mp3"
        play={true}
        volume={0.3}
        loop={true}
      /> */}
      <Audio
        src={"https://revideo-example-assets.s3.amazonaws.com/chill-beat-2.mp3"}
        play={true}
        volume={0.1}
      />
    </>
  );


  // 헤더 생성 (무한 반복 타이핑 효과 적용)
  const header = createSlideHeader({
    header: "간헐적 단식의 장점",
    view,
    effect: "typewriter",  //효과 타입 직접 사용
    effectConfig: {
      duration: audioDuration,
      textColor: "#08EE0E",
      strokeColor: "#FFFFFF"
    }
  });

  // 슬라이드 바디 생성 (클래스 기반 컴포넌트 사용)
  const slideBodyRef = createRef<SlideBody>();
  view.add(
    <SlideBody
      ref={slideBodyRef}
      slides={slides}
      view={view}
      imageContainer={imageContainer}
    />
  );

  // 슬라이드 푸터 생성
  const slideFooter = createSlideFooter({
    textContainer,
    words,
    settings: defaultTextSettings
  });

  // 헤더, 이미지, 텍스트 모두 동시에 표시하고 정확히 오디오 길이만큼 실행
  yield* all(
    header.showHeader(), // 무한 반복 타이핑 효과
    slideBodyRef().playSlides(),
    slideFooter.playFooter(),
    lineEffectRef().radialBurst(audioDuration), // 라인 효과 활성화
    particleEffectRef().explosion(audioDuration * 0.3) // 파티클 효과 활성화
  );

  // 오디오가 끝나면 씬도 정확히 종료되도록 보장
  console.log(`Scene ending at audio duration: ${audioDuration} seconds`);
});
