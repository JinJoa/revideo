import { Img, Rect, View2D, Txt, Audio, Layout } from '@revideo/2d'
import { createRef, waitFor, all, Reference, ThreadGenerator } from '@revideo/core'

import { 
  executeImageAnimations,
  applyShutterTransition
} from '../animations/imageAnimations'
import { StructuredSlide } from '../types/slide'

interface SlideBodyProps {
  slides: StructuredSlide[]
  view: View2D
  imageContainer?: Reference<Layout>
}

interface SlideBodyResult {
  imageRef: Reference<Img>;
  playSlides: () => ThreadGenerator;
}

export function createSlideBody({ slides, view, imageContainer }: SlideBodyProps): SlideBodyResult {
  const imageRef = createRef<Img>()

  // 첫 번째 이미지 추가 - imageContainer가 있으면 그곳에, 없으면 view에 추가
  if (imageContainer) {
    imageContainer().add(
    <Img
      ref={imageRef}
      src={slides[0].content.image}
      height={"100%"}  // 컨테이너에 맞게 조정
      x={0}
      y={0}
      opacity={1}
      scale={1.0}
    />
    );
  } else {
    view.add(
      <Img
        ref={imageRef}
        src={slides[0].content.image}
        height={"100%"}
        x={0}
        y={0}
        opacity={1}
        scale={1.0}
      />
    );
  }

  function* playSlides() {
    // Loop through each slide
    for (let i = 0; i < slides.length; i++) {
      console.log(`Processing slide ${i + 1} with audio: ${slides[i].content.audio}`)

      // 이전에 추가된 오디오 요소가 있으면 제거
      if (i > 0) {
        // 셔터 전환 효과가 있는 경우
        if (slides[i].animations.image.transition?.type === 'shutterTransition') {
          const transitionDuration = slides[i].animations.image.transition?.duration || 1.0
          yield* applyShutterTransition(view, () => {
            // 셔터가 닫힌 상태에서 이미지 변경
            imageRef().src(slides[i].content.image)
            // 기본 상태로 리셋 (애니메이션 함수에서 필요한 초기 상태를 설정할 것임)
            imageRef().scale(1.0)
            imageRef().x(0)
            imageRef().y(0)
            imageRef().opacity(1)
            imageRef().filters.brightness(1)
          }, transitionDuration)
        } else {
          // 기존 전환 방식
          // Fade out previous image
          yield* imageRef().opacity(0, 0.3)
          // Change image and reset to default state
          imageRef().src(slides[i].content.image)
          imageRef().scale(1.0)
          imageRef().x(0)
          imageRef().y(0)
          imageRef().opacity(1)
          imageRef().filters.brightness(1)
          
          // 새로운 이미지를 페이드 인 (페이드 셔터 효과를 사용하지 않는 경우에만)
          if (slides[i].animations.image.transition?.type !== 'blink' && 
              slides[i].animations.image.transition?.type !== 'fade') {
            yield* imageRef().opacity(1, 0.3)
          }
        }
      }

      // Get slide duration
      const slideDuration = slides[i].timing.duration || 5.0

      // 이미지 애니메이션 실행
      yield* executeImageAnimations(imageRef, slides[i].animations.image, slideDuration)
    }
  }

  return {
    imageRef,
    playSlides
  }
}

// 간단한 이미지 슬라이드쇼를 위한 인터페이스
interface DisplayImagesProps {
  imageContainer: Reference<Layout>;
  images: string[];
  duration: number;
}

/**
 * 간단한 이미지 슬라이드쇼 표시 함수
 */
export function* displayImages({ imageContainer, images, duration }: DisplayImagesProps) {
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
    yield* imageRef().opacity(1, slideDuration - 0.5);
    
    // 페이드아웃 애니메이션
    yield* imageRef().opacity(0, 0.5);
    
    // 이미지 제거
    imageRef().remove();
  }
}