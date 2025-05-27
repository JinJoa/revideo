# 애니메이션 시스템

이 폴더는 Revideo 프로젝트에서 사용할 수 있는 재사용 가능한 애니메이션 함수들을 포함합니다.

## 파일 구조

- `imageAnimations.ts` - 이미지 줌/팬/셔터 애니메이션 함수들
- `textAnimations.ts` - 텍스트 표시 애니메이션 함수들  
- `README.md` - 애니메이션 시스템 문서

## 이미지 애니메이션

### 줌 애니메이션 타입
- `zoomIn` - 정상 크기에서 확대
- `zoomOut` - 확대된 상태에서 정상 크기로
- `zoomInOut` - 확대 후 다시 축소
- `static` - 줌 없음 (기본값)

### 팬 애니메이션 타입
- `panLeft` - 오른쪽에서 왼쪽으로 이동
- `panRight` - 왼쪽에서 오른쪽으로 이동
- `panUp` - 아래에서 위로 이동
- `panDown` - 위에서 아래로 이동
- `none` - 팬 없음 (기본값)

### 셔터 효과 타입
- `flash` - 플래시 효과
- `blink` - 깜빡임 효과
- `shutterTransition` - 셔터 전환 효과 (화면 전체를 덮는 셔터)
- `fade` - 페이드 효과
- `none` - 효과 없음 (기본값)

### 특별한 전환 효과

#### 셔터 전환 (Shutter Transition)
화면 전체를 덮는 검은 셔터가 위아래에서 닫혔다가 열리면서 이미지를 전환하는 효과입니다.

```typescript
import { applyShutterTransition } from '../animations/imageAnimations'

// 셔터 전환 효과 사용
yield* applyShutterTransition(view, () => {
  // 셔터가 닫힌 상태에서 실행할 코드
  imageRef().src(newImageSrc)
  // 기타 설정 변경...
}, 1.0) // 전체 지속 시간
```

### 구조화된 이미지 애니메이션 설정

```typescript
interface ImageAnimationConfig {
  zoom: {
    type: ZoomType
    intensity?: number
    easing?: string
  }
  pan: {
    type: PanType
    distance?: number
    easing?: string
  }
  transition: {
    type: ShutterType
    duration?: number
    blinkCount?: number
  }
}
```

## 텍스트 애니메이션

### 텍스트 표시 애니메이션 타입
- `fadeIn` - 페이드 인 효과
- `slideIn` - 슬라이드 인 효과
- `typewriter` - 타이프라이터 효과
- `instant` - 즉시 표시

### 텍스트 스타일 설정

```typescript
interface TextStyle {
  fontSize: number
  fontWeight: number
  color: string
  backgroundColor: string
  backgroundOpacity: number
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right'
  padding?: number
  radius?: number
}
```

### 텍스트 애니메이션 설정

```typescript
interface TextAnimationConfig {
  display: {
    type: TextDisplayType
    duration: number
    stagger: number
  }
  style: TextStyle
}
```

## 사용 예시

### 이미지 애니메이션

```typescript
import { 
  applyZoomAnimation, 
  applyPanAnimation, 
  applyImageAnimations,
  getInitialScale,
  getInitialPosition,
  getInitialScaleFromConfig,
  getInitialPositionFromConfig
} from '../animations/imageAnimations'

// 개별 애니메이션 적용
yield* applyZoomAnimation(imageRef, 'zoomIn', 3.0)
yield* applyPanAnimation(imageRef, 'panLeft', 3.0)

// 레거시 방식: 동시 애니메이션 적용
yield* applyImageAnimations(imageRef, {
  zoomType: 'zoomIn',
  panType: 'panLeft'
}, 3.0)

// 구조화된 설정 사용
const config: ImageAnimationConfig = {
  zoom: { type: 'zoomIn', intensity: 0.15, easing: 'easeInOutQuad' },
  pan: { type: 'panLeft', distance: 100, easing: 'easeInOutQuad' },
  transition: { type: 'fade', duration: 0.3 }
}

yield* applyImageAnimationsFromConfig(imageRef, config, 3.0)

// 초기값 설정
const scale = getInitialScaleFromConfig(config.zoom)
const position = getInitialPositionFromConfig(config.pan)
```

### 텍스트 애니메이션

```typescript
import { 
  applyTextAnimation,
  applyTextStyle,
  displayTextsSequentially,
  fadeOutTexts,
  TextElementRefs
} from '../animations/textAnimations'

// 텍스트 애니메이션 설정
const textConfig = {
  display: {
    type: 'fadeIn' as const,
    duration: 0.3,
    stagger: 0.2
  },
  style: {
    fontSize: 56,
    fontWeight: 700,
    color: 'fffb00',
    backgroundColor: '#000000',
    backgroundOpacity: 0.8
  }
}

// 개별 텍스트 애니메이션
yield* applyTextAnimation(textRef, backgroundRef, textConfig.display, "Hello World")

// 여러 텍스트 순차 표시
const textElements: TextElementRefs[] = [
  { textRef: text1Ref, backgroundRef: bg1Ref },
  { textRef: text2Ref, backgroundRef: bg2Ref }
]

yield* displayTextsSequentially(textElements, textConfig.display, ["First text", "Second text"])

// 텍스트 페이드 아웃
yield* fadeOutTexts(textElements, 0.3)
```

## JSON 설정 기반 사용

`slides.json`에서 애니메이션을 설정할 수 있습니다:

```json
{
  "id": 1,
  "content": {
    "image": "/images/example.png",
    "texts": ["첫 번째 텍스트", "두 번째 텍스트"],
    "audio": "/audio/slide_1.mp3"
  },
  "animations": {
    "image": {
      "zoom": {
        "type": "zoomIn",
        "intensity": 0.15,
        "easing": "easeInOutQuad"
      },
      "pan": {
        "type": "panLeft",
        "distance": 100,
        "easing": "easeInOutQuad"
      },
      "transition": {
        "type": "fade",
        "duration": 0.3
      }
    },
    "text": {
      "display": {
        "type": "fadeIn",
        "duration": 0.3,
        "stagger": 0.2
      },
      "style": {
        "fontSize": 56,
        "fontWeight": 700,
        "color": "fffb00",
        "backgroundColor": "#000000",
        "backgroundOpacity": 0.8
      }
    }
  },
  "timing": {
    "duration": 5.0,
    "textDisplayTime": "auto"
  }
}
```

이 애니메이션 시스템은 슬라이드뿐만 아니라 다른 용도로도 재사용할 수 있도록 설계되었습니다. 구조화된 설정을 통해 JSON 파일만 수정하여 애니메이션을 쉽게 변경할 수 있습니다.