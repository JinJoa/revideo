import { Rect, View2D, Txt, Audio, Layout } from '@revideo/2d'
import { createRef, waitFor, all, Reference, ThreadGenerator } from '@revideo/core'

import { 
  executeImageAnimations
} from '../animations/imageAnimations'
import { StructuredSlide } from '../types/slide'
import { JinImage, JinImageProps } from './JinImage'

interface SlideBodyProps {
  slides: StructuredSlide[]
  view: View2D
  imageContainer?: Reference<Layout>
}

interface SlideBodyResult {
  imageRef: Reference<JinImage>;
  playSlides: () => ThreadGenerator;
}

export function createSlideBody({ slides, view, imageContainer }: SlideBodyProps): SlideBodyResult {
  const imageRef = createRef<JinImage>()

  // 첫 번째 이미지 추가 - imageContainer가 있으면 그곳에, 없으면 view에 추가
  if (imageContainer) {
    imageContainer().add(
    <JinImage
      ref={imageRef}
      src={slides[0].content.image}
      height={"100%"}  // 컨테이너에 맞게 조정
      x={0}
      y={0}
      opacity={1}
      scale={1.0}
      autoPlay={true}
      animationDuration={3}
    />
    );
  } else {
    view.add(
      <JinImage
        ref={imageRef}
        src={slides[0].content.image}
        height={"100%"}
        x={0}
        y={0}
        opacity={1}
        scale={1.0}
        autoPlay={true}
        animationDuration={3}
      />
    );
  }

  function* playSlides() {
    // Loop through each slide
    for (let i = 0; i < slides.length; i++) {
      console.log(`Processing slide ${i + 1} with audio: ${slides[i].content.audio}`)

      // Skip the first slide since it's already set up
      if (i > 0) {
        // Change to the next image
        imageRef().src(slides[i].content.image)
        yield* imageRef().startAnimation()
      }

      // Execute image animations based on slide configuration
      if (slides[i].animations?.image) {
        yield* imageRef().playAnimation(slides[i].animations.image);
      } else {
        // Default animation if none specified
        yield* imageRef().startAnimation();
      }

      // Wait for the slide duration
      const slideDuration = slides[i].timing?.duration || 3;
      yield* waitFor(slideDuration);
    }
  }

  return { imageRef, playSlides };
}

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
    const imageRef = createRef<JinImage>();
    
    console.log(`이미지 추가 시도: ${images[i]}`);
    
    // 이미지를 이미지 컨테이너에 추가
    imageContainer().add(
      <JinImage
        ref={imageRef}
        src={images[i]}
        width={"100%"} // 컨테이너 가로폭의 100%로 설정
        x={0}
        y={0}
        opacity={0}
        autoPlay={false}
        animationDuration={0.5}
      />
    );
    
    // 간단한 페이드인 애니메이션
    yield* imageRef().fadeIn(0.5);
    
    // 이미지 표시 시간
    const slideDuration = duration / images.length;
    yield* waitFor(slideDuration - 1.0); // 페이드 시간 고려
    
    // 페이드아웃 애니메이션
    yield* imageRef().fadeOut(0.5);
    
    // 이미지 제거
    imageRef().remove();
  }
}