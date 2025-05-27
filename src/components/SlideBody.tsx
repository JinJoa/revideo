import { Img, Rect, View2D, Txt, Audio } from '@revideo/2d'
import { createRef, waitFor, all } from '@revideo/core'
import { 
  executeImageAnimations,
  applyShutterTransition
} from '../animations/imageAnimations'
//import { StructuredSlide } from '../types/slide'

interface SlideBodyProps {
  slides: StructuredSlide[]
  view: View2D
}

export function createSlideBody({ slides, view }: SlideBodyProps) {
  const imageRef = createRef<Img>()

  // Function to display text all at once
  function* displayText(text: string, yPosition = 380) {
    const textRef = createRef<Txt>()
    const backgroundRef = createRef<Rect>()

    // Add background rectangle first
    view.add(
      <Rect
        ref={backgroundRef}
        fill="#000000"
        opacity={0.8}
        radius={10}
        x={0}
        y={yPosition}
      />
    )

    view.add(
      <Txt
        ref={textRef}
        text={text}
        fill="fffb00"
        fontFamily="Arial"
        fontSize={56}
        fontWeight={700}
        opacity={0}
        textWrap={true}
        x={0}
        y={yPosition}
        textAlign="center"
        padding={20}
      />
    )

    // 텍스트 크기에 맞춰 배경 크기 조정
    const textWidth = textRef().cacheBBox().width + 40 // 패딩 추가
    const textHeight = textRef().cacheBBox().height + 20 // 패딩 추가
    backgroundRef().width(textWidth)
    backgroundRef().height(textHeight)

    // Show background and text together
    yield* all(
      backgroundRef().opacity(0.8, 0.3),
      textRef().opacity(1, 0.3)
    )

    return { textRef, backgroundRef }
  }

  // Add the first image with a reasonable size and initial scale
  view.add(
    <Img
      ref={imageRef}
      src={slides[0].content.image}
      height={900}
      x={0}
      y={-50}
      opacity={1}
      scale={1.0}
    />
  )

  return {
    imageRef,
    *playSlides() {
      // Loop through each slide
      for (let i = 0; i < slides.length; i++) {
        console.log(`Processing slide ${i + 1} with audio: ${slides[i].content.audio}`)

        // 이전 슬라이드의 텍스트들을 모두 제거
        const currentTextRefs: any[] = []
        const currentBackgroundRefs: any[] = []

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
              imageRef().y(-50)
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
            imageRef().y(-50)
            imageRef().opacity(1)
            imageRef().filters.brightness(1)
            
            // 새로운 이미지를 페이드 인 (페이드 셔터 효과를 사용하지 않는 경우에만)
            if (slides[i].animations.image.transition?.type !== 'blink' && 
                slides[i].animations.image.transition?.type !== 'fade') {
              yield* imageRef().opacity(1, 0.3)
            }
          }
        } 

        // Add audio for current slide
        const audioRef = createRef<Audio>()
        view.add(
          <Audio
            ref={audioRef}
            src={slides[i].content.audio}
            play={true}
          />
        )

        // Get slide duration
        const slideDuration = slides[i].timing.duration || 5.0
        const textDisplayTime = slideDuration / slides[i].content.texts.length

        // Start animations and text animations in parallel
        yield* all(
          // JSON에 정의된 이미지 애니메이션만 실행
          executeImageAnimations(imageRef, slides[i].animations.image, slideDuration),
          
          // Text animations
          (function* () {
            // Display each text in sequence for the current image
            for (let j = 0; j < slides[i].content.texts.length; j++) {
              // Animate this text
              const textObj = yield* displayText(slides[i].content.texts[j])
              currentTextRefs.push(textObj.textRef)
              currentBackgroundRefs.push(textObj.backgroundRef)

              // 계산된 시간만큼 텍스트 표시
              yield* waitFor(textDisplayTime)

              // Fade out this text before showing the next one (마지막 텍스트가 아닌 경우에만)
              if (j < slides[i].content.texts.length - 1) {
                yield* all(
                  textObj.textRef().opacity(0, 0.2),
                  textObj.backgroundRef().opacity(0, 0.2)
                )
              }
            }
          })()
        )
        yield* all(
          ...currentTextRefs.map(textRef => textRef().opacity(0, 0.1)),
          ...currentBackgroundRefs.map(bgRef => bgRef().opacity(0, 0.1))
        )
      }
    }
  }
} 