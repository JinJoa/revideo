import { ImageAnimationConfig } from '../animations/imageAnimations'

// 슬라이드 콘텐츠 인터페이스
export interface SlideContent {
  image: string
  audio: string
}

// 슬라이드 타이밍 인터페이스
export interface SlideTiming {
  duration: number
}

// 슬라이드 애니메이션 인터페이스
export interface SlideAnimations {
  image: ImageAnimationConfig
}

// 구조화된 슬라이드 인터페이스
export interface StructuredSlide {
  content: SlideContent
  timing: SlideTiming
  animations: SlideAnimations
}