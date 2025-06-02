# JinImage 커스텀 컴포넌트

JinImage는 Motion Canvas(Revideo)를 위한 강력한 이미지 애니메이션 컴포넌트입니다. `imageAnimations.ts`의 모든 애니메이션 효과를 통합하여 사용하기 쉬운 단일 컴포넌트로 제공합니다.

## 목차
- [특징](#특징)
- [설치 및 사용](#설치-및-사용)
- [기본 사용법](#기본-사용법)
- [프로퍼티](#프로퍼티)
- [애니메이션 타입](#애니메이션-타입)
- [메서드](#메서드)
- [예제](#예제)
- [고급 사용법](#고급-사용법)

## 특징

- **다양한 애니메이션 효과**: 줌, 팬, 페이드, 블러, 플래시, 깜빡임 등
- **구조화된 설정**: 복잡한 애니메이션 조합을 쉽게 구성
- **하위 호환성**: 간단한 설정과 구조화된 설정 모두 지원
- **메서드 기반 제어**: 프로그래밍 방식으로 애니메이션 제어 가능
- **자동 재생**: 컴포넌트 생성 시 자동으로 애니메이션 시작 가능

## 설치 및 사용

```typescript
import { JinImage } from '../components/JinImage'
```

## 기본 사용법

### 간단한 애니메이션

```tsx
<JinImage
  src="path/to/image.jpg"
  size={[800, 600]}
  zoomType="zoomIn"
  panType="panRight"
  shutterType="fade"
  animationDuration={3}
/>
```

### 구조화된 애니메이션 설정

```tsx
<JinImage
  src="path/to/image.jpg"
  size={[800, 600]}
  animationConfig={{
    zoom: {
      type: 'zoomInOut',
      intensity: 0.2
    },
    pan: {
      type: 'panLeft',
      distance: 150
    },
    transition: {
      type: 'blink',
      blinkCount: 3
    }
  }}
  animationDuration={4}
/>
```

## 프로퍼티

### 기본 속성

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `src` | `string` | (필수) | 이미지 파일 경로 |
| `animationDuration` | `number` | `3.0` | 애니메이션 지속 시간 (초) |
| `baseY` | `number` | `-50` | 이미지 기본 Y 위치 |
| `autoPlay` | `boolean` | `false` | 컴포넌트 생성 시 자동 애니메이션 시작 |

### 간단한 애니메이션 설정 (하위 호환성)

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `zoomType` | `ZoomType` | `'static'` | 줌 애니메이션 타입 |
| `panType` | `PanType` | `'none'` | 팬 애니메이션 타입 |
| `shutterType` | `ShutterType` | `'none'` | 셔터 효과 타입 |

### 고급 설정

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `animationConfig` | `ImageAnimationConfig` | `null` | 구조화된 애니메이션 설정 |
| `zoomIntensity` | `number` | `0.15` | 줌 강도 (0.1 ~ 1.0) |
| `panDistance` | `number` | `100` | 팬 이동 거리 (픽셀) |
| `shutterDuration` | `number` | `0.3` | 셔터 효과 지속 시간 |
| `blinkCount` | `number` | `3` | 깜빡임 횟수 |
| `maxBlur` | `number` | `30` | 최대 블러 값 |
| `backgroundColor` | `PossibleColor` | `'#000000'` | 배경색 |

## 애니메이션 타입

### ZoomType
- `'zoomIn'`: 확대 애니메이션
- `'zoomOut'`: 축소 애니메이션  
- `'zoomInOut'`: 확대 후 축소
- `'static'`: 줌 없음

### PanType
- `'panLeft'`: 오른쪽에서 왼쪽으로 이동
- `'panRight'`: 왼쪽에서 오른쪽으로 이동
- `'panUp'`: 아래에서 위로 이동
- `'panDown'`: 위에서 아래로 이동
- `'none'`: 이동 없음

### ShutterType
- `'flash'`: 플래시 효과
- `'blink'`: 깜빡임 효과
- `'fade'`: 페이드 인 효과
- `'shutterTransition'`: 셔터 전환 효과
- `'none'`: 효과 없음

## 메서드

### 애니메이션 제어

```typescript
// 애니메이션 시작
yield* image.startAnimation()

// 복합 애니메이션 실행 (설정 기반)
yield* image.playAnimation()

// 커스텀 설정으로 애니메이션 실행
yield* image.playAnimation({
  zoom: { type: 'zoomIn', intensity: 0.3 },
  pan: { type: 'panRight', distance: 200 }
})
```

### 개별 효과

```typescript
// 페이드 효과
yield* image.fadeIn(1.0)
yield* image.fadeOut(1.0)

// 블러 효과
yield* image.blurIn(1.5, 20)
yield* image.blurOut(1.5, 20)

// 밝기 효과
yield* image.brightnessIn(1.0)
yield* image.brightnessOut(1.0)

// 줌 효과
yield* image.zoomIn(2.0, 0.2)
yield* image.zoomOut(2.0, 0.2)

// 팬 효과
yield* image.panLeft(2.0, 150)
yield* image.panRight(2.0, 150)

// 특수 효과
yield* image.flash(0.5)
yield* image.blink(1.0, 3)
```

### 유틸리티 메서드

```typescript
// 설정 업데이트
image.updateConfig({
  zoomType: 'zoomIn',
  animationDuration: 2.0
})

// 상태 확인
const isPlaying = image.isPlayingAnimation()

// 애니메이션 정지
image.stopAnimation()

// 초기 상태로 리셋
image.reset()
```

## 예제

### 1. 기본 예제

```tsx
export default makeScene2D('Basic', function* (view) {
  const image = createRef<JinImage>()
  
  view.add(
    <JinImage
      ref={image}
      src="image.jpg"
      size={[600, 400]}
      zoomType="zoomIn"
      panType="panRight"
      animationDuration={3}
    />
  )
  
  yield* image().startAnimation()
})
```

### 2. 복합 애니메이션 예제

```tsx
export default makeScene2D('Complex', function* (view) {
  const image = createRef<JinImage>()
  
  view.add(
    <JinImage
      ref={image}
      src="image.jpg"
      size={[600, 400]}
      animationConfig={{
        zoom: {
          type: 'zoomInOut',
          intensity: 0.25
        },
        pan: {
          type: 'panLeft',
          distance: 200
        },
        transition: {
          type: 'flash'
        }
      }}
      animationDuration={4}
    />
  )
  
  yield* image().playAnimation()
})
```

### 3. 순차적 효과 예제

```tsx
export default makeScene2D('Sequential', function* (view) {
  const image = createRef<JinImage>()
  
  view.add(
    <JinImage
      ref={image}
      src="image.jpg"
      size={[600, 400]}
      opacity={0}
    />
  )
  
  // 순차적으로 효과 적용
  yield* image().fadeIn(1.0)
  yield* image().zoomIn(2.0, 0.2)
  yield* image().flash(0.5)
  yield* image().blurOut(1.5)
  yield* image().fadeOut(1.0)
})
```

### 4. 병렬 효과 예제

```tsx
export default makeScene2D('Parallel', function* (view) {
  const image = createRef<JinImage>()
  
  view.add(
    <JinImage
      ref={image}
      src="image.jpg"
      size={[600, 400]}
    />
  )
  
  // 병렬로 효과 적용
  yield* all(
    image().zoomIn(3.0),
    image().panRight(3.0, 100),
    image().flash(0.5)
  )
})
```

### 5. 동적 설정 변경 예제

```tsx
export default makeScene2D('Dynamic', function* (view) {
  const image = createRef<JinImage>()
  
  view.add(
    <JinImage
      ref={image}
      src="image.jpg"
      size={[600, 400]}
      zoomType="zoomIn"
    />
  )
  
  // 첫 번째 애니메이션
  yield* image().startAnimation()
  
  // 설정 변경
  image().updateConfig({
    zoomType: 'zoomOut',
    panType: 'panLeft',
    animationDuration: 2.0
  })
  
  // 두 번째 애니메이션
  yield* image().startAnimation()
})
```

## 고급 사용법

### 구조화된 애니메이션 설정

`ImageAnimationConfig` 인터페이스를 사용하여 복잡한 애니메이션을 구성할 수 있습니다:

```typescript
interface ImageAnimationConfig {
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
```

### 커스텀 이징 함수

현재는 `easeInOutQuad`를 기본으로 사용하지만, 향후 버전에서는 커스텀 이징 함수를 지원할 예정입니다.

### 성능 최적화

- 큰 이미지나 복잡한 애니메이션의 경우 `animationDuration`을 적절히 조정하세요
- 불필요한 효과는 `'none'` 또는 `'static'`으로 설정하여 성능을 향상시키세요
- `autoPlay`는 필요한 경우에만 사용하세요

## 주의사항

1. **이미지 로딩**: 이미지가 로드되기 전에 애니메이션이 시작될 수 있습니다. 필요한 경우 `yield* image().toPromise()`를 사용하여 이미지 로딩을 기다리세요.

2. **애니메이션 충돌**: 동시에 여러 애니메이션을 실행할 때 충돌이 발생할 수 있습니다. `isPlayingAnimation()`을 사용하여 상태를 확인하세요.

3. **메모리 관리**: 대량의 이미지를 사용할 때는 적절한 해제를 고려하세요.

## 기여하기

JinImage 컴포넌트는 지속적으로 개선되고 있습니다. 버그 리포트나 기능 제안은 언제든 환영합니다.

## 라이센스

이 컴포넌트는 Motion Canvas(Revideo) 프로젝트의 일부로 동일한 라이센스를 따릅니다. 