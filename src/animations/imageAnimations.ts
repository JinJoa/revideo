import { Img, Rect, View2D } from '@revideo/2d'
import { Reference, waitFor, tween, all, createRef } from '@revideo/core'
import { easeInOutQuad, easeInQuad, easeOutQuad } from '@revideo/core/lib/tweening'

// 줌 타입 정의
export type ZoomType = 'zoomIn' | 'zoomOut' | 'zoomInOut' | 'static'

// 팬 타입 정의  
export type PanType = 'panLeft' | 'panRight' | 'panUp' | 'panDown' | 'none'

// 셔터 효과 타입 정의
export type ShutterType = 'flash' | 'blink' | 'shutterTransition' | 'fade' | 'none'

// 새로운 구조화된 애니메이션 설정 인터페이스
export interface ImageAnimationConfig {
  zoom?: {
    type: ZoomType
    intensity?: number
    easing?: string
  }
  pan?: {
    type: PanType
    distance?: number
    easing?: string
  }
  transition?: {
    type: ShutterType
    duration?: number
    blinkCount?: number
  }
}

// 기존 애니메이션 옵션 인터페이스 (하위 호환성)
export interface AnimationOptions {
  zoomType?: ZoomType
  panType?: PanType
  shutterType?: ShutterType
}

/**
 * 줌 애니메이션을 적용하는 함수
 * @param imageRef 이미지 참조
 * @param zoomType 줌 타입
 * @param duration 애니메이션 지속 시간
 */
export function* applyZoomAnimation(
  imageRef: Reference<Img>, 
  zoomType: ZoomType = 'static', 
  duration: number
) {
  switch (zoomType) {
    case 'zoomIn':
      // Start from normal size, zoom in during the slide
      imageRef().scale(1.0)
      yield* tween(duration, value => {
        imageRef().scale(1.0 + value * 0.15) // Zoom from 1.0 to 1.15 (subtle zoom)
      }, easeInOutQuad)
      break
      
    case 'zoomOut':
      // Start zoomed in, zoom out during the slide
      imageRef().scale(1.15)
      yield* tween(duration, value => {
        imageRef().scale(1.15 - value * 0.15) // Zoom from 1.15 to 1.0
      }, easeInOutQuad)
      break
      
    case 'zoomInOut':
      // Zoom in first half, zoom out second half
      imageRef().scale(1.0)
      // Zoom in during first 60% of the duration
      yield* tween(duration * 0.6, value => {
        imageRef().scale(1.0 + value * 0.1) // Zoom from 1.0 to 1.1
      }, easeInOutQuad)
      // Zoom out during last 40% of the duration
      yield* tween(duration * 0.4, value => {
        imageRef().scale(1.1 - value * 0.1) // Zoom from 1.1 to 1.0
      }, easeInOutQuad)
      break
      
    case 'static':
    default:
      // No zoom animation, just keep static
      imageRef().scale(1.0)
      yield* waitFor(duration)
      break
  }
}

/**
 * 팬 애니메이션을 적용하는 함수
 * @param imageRef 이미지 참조
 * @param panType 팬 타입
 * @param duration 애니메이션 지속 시간
 * @param baseY 기본 Y 위치 (기본값: -50)
 */
export function* applyPanAnimation(
  imageRef: Reference<Img>, 
  panType: PanType = 'none', 
  duration: number,
  baseY: number = -50
) {
  const panDistance = 100 // 팬 이동 거리 (픽셀)
  
  switch (panType) {
    case 'panLeft':
      // Start from right, move to left
      imageRef().x(panDistance / 2)
      yield* tween(duration, value => {
        imageRef().x(panDistance / 2 - value * panDistance) // Move from right to left
      }, easeInOutQuad)
      break
      
    case 'panRight':
      // Start from left, move to right
      imageRef().x(-panDistance / 2)
      yield* tween(duration, value => {
        imageRef().x(-panDistance / 2 + value * panDistance) // Move from left to right
      }, easeInOutQuad)
      break
      
    case 'panUp':
      // Start from bottom, move to top
      imageRef().y(baseY + panDistance / 2)
      yield* tween(duration, value => {
        imageRef().y(baseY + panDistance / 2 - value * panDistance) // Move from bottom to top
      }, easeInOutQuad)
      break
      
    case 'panDown':
      // Start from top, move to bottom
      imageRef().y(baseY - panDistance / 2)
      yield* tween(duration, value => {
        imageRef().y(baseY - panDistance / 2 + value * panDistance) // Move from top to bottom
      }, easeInOutQuad)
      break
      
    case 'none':
    default:
      // No pan animation, keep original position
      imageRef().x(0)
      imageRef().y(baseY)
      yield* waitFor(duration)
      break
  }
}

/**
 * 줌 타입에 따른 초기 스케일을 계산하는 헬퍼 함수
 * @param zoomType 줌 타입
 * @returns 초기 스케일 값
 */
export function getInitialScale(zoomType: ZoomType = 'static'): number {
  return zoomType === 'zoomOut' ? 1.15 : 1.0
}

/**
 * 팬 타입에 따른 초기 위치를 계산하는 헬퍼 함수
 * @param panType 팬 타입
 * @param baseY 기본 Y 위치 (기본값: -50)
 * @returns 초기 위치 {x, y}
 */
export function getInitialPosition(panType: PanType = 'none', baseY: number = -50): { x: number; y: number } {
  const panDistance = 100
  
  switch (panType) {
    case 'panLeft':
      return { x: panDistance / 2, y: baseY }
    case 'panRight':
      return { x: -panDistance / 2, y: baseY }
    case 'panUp':
      return { x: 0, y: baseY + panDistance / 2 }
    case 'panDown':
      return { x: 0, y: baseY - panDistance / 2 }
    default:
      return { x: 0, y: baseY }
  }
}

/**
 * 셔터 타입에 따른 초기 상태를 계산하는 헬퍼 함수
 * @param shutterType 셔터 효과 타입
 * @returns 초기 상태 {opacity, brightness}
 */
export function getInitialShutterState(shutterType: ShutterType = 'none'): { opacity: number; brightness: number } {
  switch (shutterType) {
    case 'blink':
      return { opacity: 0, brightness: 1 }
    default:
      return { opacity: 1, brightness: 1 }
  }
}

/**
 * 줌과 팬 애니메이션을 동시에 적용하는 편의 함수
 * @param imageRef 이미지 참조
 * @param options 애니메이션 옵션
 * @param duration 애니메이션 지속 시간
 * @param baseY 기본 Y 위치 (기본값: -50)
 */
export function* applyImageAnimations(
  imageRef: Reference<Img>,
  options: AnimationOptions,
  duration: number,
  baseY: number = -50
) {
  const { zoomType = 'static', panType = 'none', shutterType = 'none' } = options
  
  // 초기 위치와 스케일 설정
  const initialScale = getInitialScale(zoomType)
  const initialPosition = getInitialPosition(panType, baseY)
  const initialShutterState = getInitialShutterState(shutterType)
  
  imageRef().scale(initialScale)
  imageRef().x(initialPosition.x)
  imageRef().y(initialPosition.y)
  
  // 셔터 효과 초기 상태 설정
  imageRef().opacity(initialShutterState.opacity)
  imageRef().filters.brightness(initialShutterState.brightness)
  
  // 줌, 팬, 셔터 애니메이션을 동시에 실행
  yield* all(
    applyZoomAnimation(imageRef, zoomType, duration),
    applyPanAnimation(imageRef, panType, duration, baseY),
    applyShutterEffect(imageRef, shutterType, duration, baseY)
  )
}

/**
 * 셔터 효과를 적용하는 함수
 * @param imageRef 이미지 참조
 * @param shutterType 셔터 효과 타입
 * @param duration 애니메이션 지속 시간
 * @param baseY 기본 Y 위치 (기본값: -50)
 */
export function* applyShutterEffect(
  imageRef: Reference<Img>,
  shutterType: ShutterType = 'none',
  duration: number,
  baseY: number = -50
) {
  switch (shutterType) {
    case 'flash':
      // 플래시 효과: 순간적으로 밝아졌다가 원래대로
      yield* tween(0.1, value => {
        imageRef().filters.brightness(1 + value * 2) // 밝기 1.0 → 3.0
      }, easeOutQuad)
      yield* tween(0.2, value => {
        imageRef().filters.brightness(3 - value * 2) // 밝기 3.0 → 1.0
      }, easeInQuad)
      yield* waitFor(duration - 0.3)
      break
      
    case 'blink':
      // 깜빡임 효과: 빠르게 나타났다 사라졌다 반복
      const blinkCount = 3
      const blinkDuration = Math.min(duration * 0.4, 0.6) / blinkCount
      
      for (let i = 0; i < blinkCount; i++) {
        yield* tween(blinkDuration / 2, value => {
          imageRef().opacity(value) // 투명도 0 → 1
        }, easeInOutQuad)
        yield* tween(blinkDuration / 2, value => {
          imageRef().opacity(1 - value) // 투명도 1 → 0
        }, easeInOutQuad)
      }
      
      // 마지막에 완전히 나타남
      yield* tween(0.2, value => {
        imageRef().opacity(value) // 투명도 0 → 1
      }, easeInOutQuad)
      yield* waitFor(duration - blinkDuration * blinkCount - 0.2)
      break
      
    case 'shutterTransition':
      // 셔터 전환 효과: 위아래에서 검은 막이 닫혔다 열리는 전환 효과
      const transitionDuration = 0.5
      const transitionDistance = 100 // 전환 거리 (픽셀)
      
      // 위쪽 막 내리기
      yield* tween(transitionDuration, value => {
        imageRef().y(baseY + transitionDistance / 2 - value * transitionDistance)
      }, easeInOutQuad)
      
      // 아래쪽 막 올리기
      yield* tween(transitionDuration, value => {
        imageRef().y(baseY - transitionDistance / 2 + value * transitionDistance)
      }, easeInOutQuad)
      
      yield* waitFor(duration - 2 * transitionDuration)
      break
      
    case 'fade':
      // 화면이 점점 어두워지는 Fade Out 효과
      yield* applyFadeOutAnimation(imageRef, duration)
      break
      
    case 'none':
    default:
      // 셔터 효과 없음
      imageRef().opacity(1)
      imageRef().filters.brightness(1)
      yield* waitFor(duration)
      break
  }
}

/**
 * 화면이 점점 어두워지는 Fade Out 효과
 * @param imageRef 이미지 참조
 * @param duration 애니메이션 지속 시간
 */
export function* applyFadeOutAnimation(
  imageRef: Reference<Img>,
  duration: number
) {
  const holdTime = duration * 0.9; // 90%는 현재 상태 유지
  const animTime = duration - holdTime; // 10%만 애니메이션
  const start = imageRef().opacity();
  if (holdTime > 0) {
    yield* waitFor(holdTime);
  }
  yield* tween(animTime, value => {
    imageRef().opacity(start * (1 - value));
  }, easeInOutQuad);
}

/**
 * 검정 화면에서 점점 이미지가 밝아지는 Fade In 효과
 * @param imageRef 이미지 참조
 * @param duration 애니메이션 지속 시간
 */
export function* applyFadeInAnimation(
  imageRef: Reference<Img>,
  duration: number
) {
  const holdTime = duration * 0.9; // 90%는 검정 상태 유지
  const animTime = duration - holdTime; // 10%만 애니메이션
  imageRef().opacity(0);
  if (holdTime > 0) {
    yield* waitFor(holdTime);
  }
  yield* tween(animTime, value => {
    imageRef().opacity(value);
  }, easeInOutQuad);
}

/**
 * 화면이 점점 흐려지는 Blur Out 효과
 * @param imageRef 이미지 참조
 * @param duration 애니메이션 지속 시간
 * @param maxBlur 최대 blur 값(px)
 */
export function* applyBlurOutAnimation(
  imageRef: Reference<Img>,
  duration: number,
  maxBlur: number = 30
) {
  const holdTime = duration * 0.9; // 90%는 선명하게 유지
  const animTime = duration - holdTime; // 10%만 애니메이션
  imageRef().filters.blur(0);
  if (holdTime > 0) {
    yield* waitFor(holdTime);
  }
  yield* tween(animTime, value => {
    imageRef().filters.blur(value * maxBlur);
  }, easeInOutQuad);
}

/**
 * 흐려진 화면에서 점점 선명해지는 Blur In 효과
 * @param imageRef 이미지 참조
 * @param duration 애니메이션 지속 시간
 * @param maxBlur 최대 blur 값(px)
 */
export function* applyBlurInAnimation(
  imageRef: Reference<Img>,
  duration: number,
  maxBlur: number = 30
) {
  const animTime = duration * 0.1; // 전체 컷 시간중 10%만 애니메이션
  const holdTime = duration - animTime; // 나머지 90%는 선명하게 유지
  imageRef().filters.blur(maxBlur);
  yield* tween(animTime, value => {
    imageRef().filters.blur(maxBlur * (1 - value));
  }, easeInOutQuad);
  if (holdTime > 0) {
    imageRef().filters.blur(0);
    yield* waitFor(holdTime);
  }
}

/**
 * 검정 화면에서 점점 이미지가 밝아지는 Brightness In 효과
 * @param imageRef 이미지 참조
 * @param duration 애니메이션 지속 시간
 */
export function* applyBrightnessInAnimation(
  imageRef: Reference<Img>,
  duration: number
) {
  const animTime = duration * 0.1; // 10%만 애니메이션
  const holdTime = duration - animTime; // 90%는 밝은 상태 유지
  imageRef().filters.brightness(0);
  yield* tween(animTime, value => {
    imageRef().filters.brightness(value);
  }, easeInOutQuad);
  if (holdTime > 0) {
    imageRef().filters.brightness(1);
    yield* waitFor(holdTime);
  }
}

/**
 * 화면이 점점 어두워지는 Brightness Out 효과
 * @param imageRef 이미지 참조
 * @param duration 애니메이션 지속 시간
 */
export function* applyBrightnessOutAnimation(
  imageRef: Reference<Img>,
  duration: number
) {
  const holdTime = duration * 0.9; // 90%는 밝은 상태 유지
  const animTime = duration - holdTime; // 10%만 애니메이션
  imageRef().filters.brightness(1);
  if (holdTime > 0) {
    yield* waitFor(holdTime);
  }
  yield* tween(animTime, value => {
    imageRef().filters.brightness(1 - value);
  }, easeInOutQuad);
}

/**
 * 새로운 구조화된 설정을 사용하여 이미지 애니메이션을 적용하는 함수
 * @param imageRef 이미지 참조
 * @param config 애니메이션 설정
 * @param duration 애니메이션 지속 시간
 * @param baseY 기본 Y 위치
 */
export function* applyImageAnimationsFromConfig(
  imageRef: Reference<Img>,
  config: ImageAnimationConfig,
  duration: number,
  baseY: number = -50
) {
  // 기본값 설정
  const zoomConfig = config.zoom || { type: 'static' }
  const panConfig = config.pan || { type: 'none' }
  const transitionConfig = config.transition || { type: 'none' }
  
  // 초기 위치와 스케일 설정
  const initialScale = getInitialScaleFromConfig(zoomConfig)
  const initialPosition = getInitialPositionFromConfig(panConfig, baseY)
  const initialShutterState = getInitialShutterStateFromConfig(transitionConfig)
  
  imageRef().scale(initialScale)
  imageRef().x(initialPosition.x)
  imageRef().y(initialPosition.y)
  
  // 셔터 효과 초기 상태 설정
  imageRef().opacity(initialShutterState.opacity)
  imageRef().filters.brightness(initialShutterState.brightness)
  
  // 줌, 팬, 셔터 애니메이션을 동시에 실행
  yield* all(
    applyZoomAnimationFromConfig(imageRef, zoomConfig, duration),
    applyPanAnimationFromConfig(imageRef, panConfig, duration, baseY),
    applyShutterEffectFromConfig(imageRef, transitionConfig, duration, baseY)
  )
}

/**
 * 구조화된 설정에서 줌 애니메이션을 적용하는 함수
 */
export function* applyZoomAnimationFromConfig(
  imageRef: Reference<Img>, 
  zoomConfig: NonNullable<ImageAnimationConfig['zoom']>, 
  duration: number
) {
  const intensity = zoomConfig.intensity || 0.15
  
  switch (zoomConfig.type) {
    case 'zoomIn':
      imageRef().scale(1.0) // 초기 스케일 설정
      yield* tween(duration, value => {
        imageRef().scale(1.0 + value * intensity)
      }, easeInOutQuad)
      break
      
    case 'zoomOut':
      imageRef().scale(1.0 + intensity) // 초기 스케일 설정
      yield* tween(duration, value => {
        imageRef().scale(1.0 + intensity - value * intensity)
      }, easeInOutQuad)
      break
      
    case 'zoomInOut':
      imageRef().scale(1.0) // 초기 스케일 설정
      yield* tween(duration * 0.6, value => {
        imageRef().scale(1.0 + value * intensity)
      }, easeInOutQuad)
      yield* tween(duration * 0.4, value => {
        imageRef().scale(1.0 + intensity - value * intensity)
      }, easeInOutQuad)
      break
      
    case 'static':
    default:
      imageRef().scale(1.0) // 초기 스케일 설정
      yield* waitFor(duration)
      break
  }
}

/**
 * 구조화된 설정에서 팬 애니메이션을 적용하는 함수
 */
export function* applyPanAnimationFromConfig(
  imageRef: Reference<Img>, 
  panConfig: NonNullable<ImageAnimationConfig['pan']>, 
  duration: number,
  baseY: number = -50
) {
  const panDistance = panConfig.distance || 100
  
  switch (panConfig.type) {
    case 'panLeft':
      imageRef().x(panDistance / 2) // 초기 위치 설정
      yield* tween(duration, value => {
        imageRef().x(panDistance / 2 - value * panDistance)
      }, easeInOutQuad)
      break
      
    case 'panRight':
      imageRef().x(-panDistance / 2) // 초기 위치 설정
      yield* tween(duration, value => {
        imageRef().x(-panDistance / 2 + value * panDistance)
      }, easeInOutQuad)
      break
      
    case 'panUp':
      imageRef().y(baseY + panDistance / 2) // 초기 위치 설정
      yield* tween(duration, value => {
        imageRef().y(baseY + panDistance / 2 - value * panDistance)
      }, easeInOutQuad)
      break
      
    case 'panDown':
      imageRef().y(baseY - panDistance / 2) // 초기 위치 설정
      yield* tween(duration, value => {
        imageRef().y(baseY - panDistance / 2 + value * panDistance)
      }, easeInOutQuad)
      break
      
    case 'none':
    default:
      imageRef().x(0) // 초기 위치 설정
      imageRef().y(baseY)
      yield* waitFor(duration)
      break
  }
}

/**
 * 구조화된 설정에서 셔터 효과를 적용하는 함수
 */
export function* applyShutterEffectFromConfig(
  imageRef: Reference<Img>,
  transitionConfig: NonNullable<ImageAnimationConfig['transition']>,
  duration: number,
  baseY: number = -50
) {
  const effectDuration = transitionConfig.duration || 0.3
  
  switch (transitionConfig.type) {
    case 'flash':
      imageRef().opacity(1) // 초기 상태 설정
      imageRef().filters.brightness(1)
      yield* tween(0.1, value => {
        imageRef().filters.brightness(1 + value * 2)
      }, easeOutQuad)
      yield* tween(0.2, value => {
        imageRef().filters.brightness(3 - value * 2)
      }, easeInQuad)
      yield* waitFor(duration - 0.3)
      break
      
    case 'blink':
      imageRef().opacity(0) // 초기 상태 설정
      imageRef().filters.brightness(1)
      const blinkCount = transitionConfig.blinkCount || 3
      const blinkDuration = Math.min(duration * 0.4, 0.6) / blinkCount
      
      for (let i = 0; i < blinkCount; i++) {
        yield* tween(blinkDuration / 2, value => {
          imageRef().opacity(value)
        }, easeInOutQuad)
        yield* tween(blinkDuration / 2, value => {
          imageRef().opacity(1 - value)
        }, easeInOutQuad)
      }
      
      yield* tween(0.2, value => {
        imageRef().opacity(value)
      }, easeInOutQuad)
      yield* waitFor(duration - blinkDuration * blinkCount - 0.2)
      break
      
    case 'fade':
      imageRef().opacity(0) // 초기 상태 설정
      imageRef().filters.brightness(1)
      yield* applyFadeInAnimation(imageRef, duration)
      break
      
    case 'shutterTransition':
      // 이 효과는 별도로 처리됨
      imageRef().opacity(1) // 초기 상태 설정
      imageRef().filters.brightness(1)
      yield* waitFor(duration)
      break
      
    case 'none':
    default:
      imageRef().opacity(1) // 초기 상태 설정
      imageRef().filters.brightness(1)
      yield* waitFor(duration)
      break
  }
}

/**
 * 구조화된 설정에서 초기 스케일을 계산하는 헬퍼 함수
 */
export function getInitialScaleFromConfig(zoomConfig: NonNullable<ImageAnimationConfig['zoom']>): number {
  const intensity = zoomConfig.intensity || 0.15
  return zoomConfig.type === 'zoomOut' ? 1.0 + intensity : 1.0
}

/**
 * 구조화된 설정에서 초기 위치를 계산하는 헬퍼 함수
 */
export function getInitialPositionFromConfig(
  panConfig: NonNullable<ImageAnimationConfig['pan']>, 
  baseY: number = -50
): { x: number; y: number } {
  const panDistance = panConfig.distance || 100
  
  switch (panConfig.type) {
    case 'panLeft':
      return { x: panDistance / 2, y: baseY }
    case 'panRight':
      return { x: -panDistance / 2, y: baseY }
    case 'panUp':
      return { x: 0, y: baseY + panDistance / 2 }
    case 'panDown':
      return { x: 0, y: baseY - panDistance / 2 }
    default:
      return { x: 0, y: baseY }
  }
}

/**
 * 구조화된 설정에서 셔터 타입에 따른 초기 상태를 계산하는 헬퍼 함수
 */
export function getInitialShutterStateFromConfig(
  transitionConfig: NonNullable<ImageAnimationConfig['transition']>
): { opacity: number; brightness: number } {
  switch (transitionConfig.type) {
    case 'blink':
      return { opacity: 0, brightness: 1 }
    case 'fade':
      return { opacity: 0, brightness: 1 }
    default:
      return { opacity: 1, brightness: 1 }
  }
}

/**
 * 애니메이션 설정에 따라 이미지의 초기 상태를 설정하는 통합 함수
 * @param imageRef 이미지 참조
 * @param config 이미지 애니메이션 설정
 * @param baseY 기본 Y 위치 (기본값: -50)
 */
export function setImageInitialState(
  imageRef: Reference<Img>,
  config: ImageAnimationConfig,
  baseY: number = -50
) {
  // 기본 상태 설정
  imageRef().scale(1.0)
  imageRef().x(0)
  imageRef().y(baseY)
  imageRef().opacity(1)
  imageRef().filters.brightness(1)
  
  // 줌 애니메이션이 있는 경우 초기 스케일 설정
  if (config.zoom) {
    const initialScale = getInitialScaleFromConfig(config.zoom)
    imageRef().scale(initialScale)
  }
  
  // 팬 애니메이션이 있는 경우 초기 위치 설정
  if (config.pan) {
    const initialPosition = getInitialPositionFromConfig(config.pan, baseY)
    imageRef().x(initialPosition.x)
    imageRef().y(initialPosition.y)
  }
  
  // 셔터 효과가 있는 경우 초기 상태 설정
  if (config.transition) {
    const initialShutterState = getInitialShutterStateFromConfig(config.transition)
    imageRef().opacity(initialShutterState.opacity)
    imageRef().filters.brightness(initialShutterState.brightness)
  }
}

/**
 * 정의된 애니메이션만 선택적으로 실행하는 함수
 * @param imageRef 이미지 참조
 * @param config 이미지 애니메이션 설정
 * @param duration 애니메이션 지속 시간
 * @param baseY 기본 Y 위치 (기본값: -50)
 */
export function* applyDefinedImageAnimations(
  imageRef: Reference<Img>,
  config: ImageAnimationConfig,
  duration: number,
  baseY: number = -50
) {
  const animationPromises: Generator<any, any, any>[] = []
  
  // 줌 애니메이션이 정의된 경우에만 실행
  if (config.zoom && config.zoom.type !== 'static') {
    animationPromises.push(applyZoomAnimationFromConfig(imageRef, config.zoom, duration))
  }
  
  // 팬 애니메이션이 정의된 경우에만 실행
  if (config.pan && config.pan.type !== 'none') {
    animationPromises.push(applyPanAnimationFromConfig(imageRef, config.pan, duration, baseY))
  }
  
  // 셔터 효과가 정의된 경우에만 실행 (shutterTransition 제외)
  if (config.transition && 
      config.transition.type !== 'none' && 
      config.transition.type !== 'shutterTransition') {
    animationPromises.push(applyShutterEffectFromConfig(imageRef, config.transition, duration, baseY))
  }
  
  // 정의된 애니메이션들만 병렬 실행
  if (animationPromises.length > 0) {
    yield* all(...animationPromises)
  } else {
    yield* waitFor(duration)
  }
}

/**
 * JSON에 정의된 애니메이션을 동적으로 실행하는 함수
 * @param imageRef 이미지 참조
 * @param config 이미지 애니메이션 설정
 * @param duration 애니메이션 지속 시간
 * @param baseY 기본 Y 위치 (기본값: -50)
 */
export function* executeImageAnimations(
  imageRef: Reference<Img>,
  config: ImageAnimationConfig,
  duration: number,
  baseY: number = -50
) {
  const animations: Generator<any, any, any>[] = []
  
  // JSON에 정의된 애니메이션만 실행
  if (config.zoom) {
    animations.push(applyZoomAnimationFromConfig(imageRef, config.zoom, duration))
  }
  
  if (config.pan) {
    animations.push(applyPanAnimationFromConfig(imageRef, config.pan, duration, baseY))
  }
  
  if (config.transition && config.transition.type !== 'shutterTransition') {
    animations.push(applyShutterEffectFromConfig(imageRef, config.transition, duration, baseY))
  }
  
  // 정의된 애니메이션들을 병렬 실행하거나 대기
  if (animations.length > 0) {
    yield* all(...animations)
  } else {
    yield* waitFor(duration)
  }
}

/**
 * 셔터 전환 효과를 적용하는 함수 (화면 전체를 덮는 셔터)
 * @param view 뷰 참조
 * @param onTransition 전환 중에 실행할 콜백 함수
 * @param duration 전체 셔터 전환 지속 시간
 */
export function* applyShutterTransition(
  view: View2D,
  onTransition: () => void,
  duration: number = 1.0
) {
  const shutterDuration = duration / 3 // 닫기, 전환, 열기 각각 1/3씩
  
  // 위쪽과 아래쪽 셔터 막 생성
  const topShutter = new Rect({
    width: '100%',
    height: '50%',
    fill: '#000000',
    x: 0,
    y: -960, // 화면 위쪽 밖에서 시작
    zIndex: 1000 // 다른 요소들 위에 표시
  })
  
  const bottomShutter = new Rect({
    width: '100%',
    height: '50%',
    fill: '#000000',
    x: 0,
    y: 960, // 화면 아래쪽 밖에서 시작
    zIndex: 1000 // 다른 요소들 위에 표시
  })
  
  // 셔터 막들을 뷰에 추가
  view.add(topShutter)
  view.add(bottomShutter)
  
  // 1단계: 셔터 닫기 (위아래에서 중앙으로)
  yield* all(
    topShutter.y(-480, shutterDuration), // 위에서 중앙으로
    bottomShutter.y(480, shutterDuration) // 아래에서 중앙으로
  )
  
  // 2단계: 전환 실행 (셔터가 완전히 닫힌 상태)
  onTransition()
  yield* waitFor(shutterDuration)
  
  // 3단계: 셔터 열기 (중앙에서 위아래로)
  yield* all(
    topShutter.y(-960, shutterDuration), // 중앙에서 위로
    bottomShutter.y(960, shutterDuration) // 중앙에서 아래로
  )
  
  // 셔터 막 제거
  topShutter.remove()
  bottomShutter.remove()
}