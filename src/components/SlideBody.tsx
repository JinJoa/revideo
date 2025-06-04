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

  // 첫 번째 슬라이드의 지속시간을 애니메이션 지속시간으로 사용
  const animationDuration = slides[0]?.timing?.duration || 3;

  // 첫 번째 이미지 추가 - imageContainer가 있으면 그곳에, 없으면 view에 추가
  if (imageContainer) {
    imageContainer().add(
    <JinImage
      ref={imageRef}
      src={slides[0].content.image}
      // 이미지 크기를 컨테이너에 맞게 조정하되 비율 유지
      size={["70%", null]} // width만 설정하고 height는 비율에 맞춰 자동 조정
      x={0}
      y={0}
      opacity={1}
      scale={1.0}
      autoPlay={true}
      animationDuration={animationDuration}
    />
    );
  } else {
    view.add(
      <JinImage
        ref={imageRef}
        src={slides[0].content.image}
        // 이미지 크기를 컨테이너에 맞게 조정하되 비율 유지
        size={["70%", null]} // width만 설정하고 height는 비율에 맞춰 자동 조정
        x={0}
        y={0}
        opacity={1}
        scale={1.0}
        autoPlay={true}
        animationDuration={animationDuration}
      />
    );
  }

  function* playSlides() {
    // Loop through each slide
    for (let i = 0; i < slides.length; i++) {
      console.log(`Processing slide ${i + 1}/${slides.length}, duration: ${slides[i].timing?.duration || 3}s`)

      // Skip the first slide since it's already set up
      if (i > 0) {
        // Change to the next image
        imageRef().src(slides[i].content.image)
        // 애니메이션 지속시간을 현재 슬라이드 지속시간에 맞춤
        imageRef().animationDuration(slides[i].timing?.duration || 3)
      }

      // Execute image animations for the exact slide duration - no additional waiting
      const slideDuration = slides[i].timing?.duration || 3;
      
      if (slides[i].animations?.image) {
        // 애니메이션을 슬라이드 지속시간 동안 실행
        yield* imageRef().playAnimation(slides[i].animations.image);
      } else {
        // Default animation if none specified - run for exact slide duration
        yield* imageRef().startAnimation();
      }
      
      // No additional waitFor here - the animation should take exactly slideDuration
    }
    
    console.log('All slides completed');
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