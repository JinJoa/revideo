import { Txt, Rect } from '@revideo/2d'
import { Reference, waitFor, tween, all } from '@revideo/core'
import { easeInOutQuad, easeInQuad, easeOutQuad } from '@revideo/core/lib/tweening'

// 텍스트 애니메이션 타입 정의
export type TextDisplayType = 'fadeIn' | 'slideIn' | 'typewriter' | 'instant'
export type TextAlignment = 'left' | 'center' | 'right'

// 텍스트 스타일 설정 인터페이스
export interface TextStyle {
  fontSize: number
  fontWeight: number
  color: string
  backgroundColor: string
  backgroundOpacity: number
  fontFamily?: string
  textAlign?: TextAlignment
  padding?: number
  radius?: number
}

// 텍스트 표시 애니메이션 설정 인터페이스
export interface TextDisplayConfig {
  type: TextDisplayType
  duration: number
  stagger: number
}

// 텍스트 애니메이션 전체 설정 인터페이스
export interface TextAnimationConfig {
  display: TextDisplayConfig
  style: TextStyle
}

// 텍스트 요소 참조 인터페이스
export interface TextElementRefs {
  textRef: Reference<Txt>
  backgroundRef: Reference<Rect>
}

/**
 * 텍스트 페이드 인 애니메이션
 * @param textRef 텍스트 참조
 * @param backgroundRef 배경 참조
 * @param duration 애니메이션 지속 시간
 */
export function* fadeInText(
  textRef: Reference<Txt>,
  backgroundRef: Reference<Rect>,
  duration: number = 0.3
) {
  // 초기 상태: 투명
  textRef().opacity(0)
  backgroundRef().opacity(0)
  
  // 페이드 인 애니메이션
  yield* all(
    textRef().opacity(1, duration, easeInOutQuad),
    backgroundRef().opacity(0.8, duration, easeInOutQuad)
  )
}

/**
 * 텍스트 슬라이드 인 애니메이션
 * @param textRef 텍스트 참조
 * @param backgroundRef 배경 참조
 * @param duration 애니메이션 지속 시간
 * @param direction 슬라이드 방향 ('left' | 'right' | 'up' | 'down')
 */
export function* slideInText(
  textRef: Reference<Txt>,
  backgroundRef: Reference<Rect>,
  duration: number = 0.3,
  direction: 'left' | 'right' | 'up' | 'down' = 'left'
) {
  const slideDistance = 100
  
  // 초기 위치 설정
  let initialX = 0
  let initialY = 0
  
  switch (direction) {
    case 'left':
      initialX = -slideDistance
      break
    case 'right':
      initialX = slideDistance
      break
    case 'up':
      initialY = -slideDistance
      break
    case 'down':
      initialY = slideDistance
      break
  }
  
  // 초기 상태 설정
  textRef().opacity(0)
  backgroundRef().opacity(0)
  textRef().x(textRef().x() + initialX)
  textRef().y(textRef().y() + initialY)
  backgroundRef().x(backgroundRef().x() + initialX)
  backgroundRef().y(backgroundRef().y() + initialY)
  
  // 슬라이드 인 애니메이션
  yield* all(
    textRef().opacity(1, duration, easeInOutQuad),
    backgroundRef().opacity(0.8, duration, easeInOutQuad),
    textRef().x(textRef().x() - initialX, duration, easeInOutQuad),
    textRef().y(textRef().y() - initialY, duration, easeInOutQuad),
    backgroundRef().x(backgroundRef().x() - initialX, duration, easeInOutQuad),
    backgroundRef().y(backgroundRef().y() - initialY, duration, easeInOutQuad)
  )
}

/**
 * 타이프라이터 효과 애니메이션
 * @param textRef 텍스트 참조
 * @param backgroundRef 배경 참조
 * @param fullText 전체 텍스트
 * @param duration 애니메이션 지속 시간
 */
export function* typewriterText(
  textRef: Reference<Txt>,
  backgroundRef: Reference<Rect>,
  fullText: string,
  duration: number = 1.0
) {
  // 배경 먼저 표시
  backgroundRef().opacity(0.8)
  textRef().opacity(1)
  
  const charCount = fullText.length
  const charDuration = duration / charCount
  
  // 한 글자씩 타이핑 효과
  for (let i = 0; i <= charCount; i++) {
    textRef().text(fullText.substring(0, i))
    yield* waitFor(charDuration)
  }
}

/**
 * 즉시 표시 애니메이션
 * @param textRef 텍스트 참조
 * @param backgroundRef 배경 참조
 */
export function* instantText(
  textRef: Reference<Txt>,
  backgroundRef: Reference<Rect>
) {
  textRef().opacity(1)
  backgroundRef().opacity(0.8)
  yield* waitFor(0.1) // 최소 대기 시간
}

/**
 * 텍스트 애니메이션을 적용하는 메인 함수
 * @param textRef 텍스트 참조
 * @param backgroundRef 배경 참조
 * @param config 텍스트 애니메이션 설정
 * @param fullText 전체 텍스트 (타이프라이터 효과용)
 */
export function* applyTextAnimation(
  textRef: Reference<Txt>,
  backgroundRef: Reference<Rect>,
  config: TextDisplayConfig,
  fullText?: string
) {
  switch (config.type) {
    case 'fadeIn':
      yield* fadeInText(textRef, backgroundRef, config.duration)
      break
    case 'slideIn':
      yield* slideInText(textRef, backgroundRef, config.duration)
      break
    case 'typewriter':
      if (fullText) {
        yield* typewriterText(textRef, backgroundRef, fullText, config.duration)
      } else {
        // 폴백: 페이드 인
        yield* fadeInText(textRef, backgroundRef, config.duration)
      }
      break
    case 'instant':
    default:
      yield* instantText(textRef, backgroundRef)
      break
  }
}

/**
 * 텍스트 스타일을 적용하는 함수
 * @param textRef 텍스트 참조
 * @param backgroundRef 배경 참조
 * @param style 텍스트 스타일 설정
 */
export function applyTextStyle(
  textRef: Reference<Txt>,
  backgroundRef: Reference<Rect>,
  style: TextStyle
) {
  // 텍스트 스타일 적용
  textRef().fontSize(style.fontSize)
  textRef().fontWeight(style.fontWeight)
  textRef().fill(style.color)
  textRef().fontFamily(style.fontFamily || 'Arial')
  textRef().textAlign(style.textAlign || 'center')
  textRef().padding(style.padding || 20)
  
  // 배경 스타일 적용
  backgroundRef().fill(style.backgroundColor)
  backgroundRef().opacity(style.backgroundOpacity)
  backgroundRef().radius(style.radius || 10)
}

/**
 * 여러 텍스트를 순차적으로 표시하는 함수
 * @param textElements 텍스트 요소들의 참조 배열
 * @param config 텍스트 애니메이션 설정
 * @param texts 텍스트 배열
 */
export function* displayTextsSequentially(
  textElements: TextElementRefs[],
  config: TextDisplayConfig,
  texts: string[]
) {
  for (let i = 0; i < textElements.length && i < texts.length; i++) {
    const { textRef, backgroundRef } = textElements[i]
    
    // 각 텍스트에 애니메이션 적용
    yield* applyTextAnimation(textRef, backgroundRef, config, texts[i])
    
    // 스태거 지연 시간 적용 (마지막 텍스트가 아닌 경우)
    if (i < textElements.length - 1) {
      yield* waitFor(config.stagger)
    }
  }
}

/**
 * 모든 텍스트를 동시에 표시하는 함수
 * @param textElements 텍스트 요소들의 참조 배열
 * @param config 텍스트 애니메이션 설정
 * @param texts 텍스트 배열
 */
export function* displayTextsSimultaneously(
  textElements: TextElementRefs[],
  config: TextDisplayConfig,
  texts: string[]
) {
  const animations = []
  
  for (let i = 0; i < textElements.length && i < texts.length; i++) {
    const { textRef, backgroundRef } = textElements[i]
    animations.push(applyTextAnimation(textRef, backgroundRef, config, texts[i]))
  }
  
  // 모든 애니메이션을 동시에 실행
  yield* all(...animations)
}

/**
 * 텍스트 요소들을 페이드 아웃하는 함수
 * @param textElements 텍스트 요소들의 참조 배열
 * @param duration 페이드 아웃 지속 시간
 */
export function* fadeOutTexts(
  textElements: TextElementRefs[],
  duration: number = 0.3
) {
  const animations = []
  
  for (const { textRef, backgroundRef } of textElements) {
    animations.push(
      textRef().opacity(0, duration, easeInOutQuad),
      backgroundRef().opacity(0, duration, easeInOutQuad)
    )
  }
  
  yield* all(...animations)
}

/**
 * 텍스트 요소들을 제거하는 함수
 * @param textElements 텍스트 요소들의 참조 배열
 */
export function removeTextElements(textElements: TextElementRefs[]) {
  for (const { textRef, backgroundRef } of textElements) {
    textRef().remove()
    backgroundRef().remove()
  }
} 