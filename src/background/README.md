# Background Components

재사용 가능한 배경 컴포넌트들입니다. 씬에 직접 배경을 넣지 않고 이 컴포넌트들을 사용하여 일관된 스타일을 유지하고 재사용성을 높일 수 있습니다.

## 컴포넌트 목록

### 1. SolidBackground
단색 배경을 제공하는 컴포넌트입니다.

**Props:**
- `color`: 배경 색상 (기본값: '#000000')
- 기타 RectProps 속성들

**사용법:**
```tsx
import { SolidBackground } from '@/components/background';

<SolidBackground color="#1a1a2e">
  {/* 컨텐츠 */}
</SolidBackground>
```

### 2. GradientBackground
그라데이션 배경을 제공하는 컴포넌트입니다.

**Props:**
- `fromColor`: 시작 색상 (기본값: '#000000')
- `toColor`: 끝 색상 (기본값: '#ffffff')
- `gradientDirection`: 그라데이션 방향 ('horizontal' | 'vertical' | 'diagonal', 기본값: 'vertical')
- 기타 RectProps 속성들

**사용법:**
```tsx
import { GradientBackground } from '@/components/background';

<GradientBackground 
  fromColor="#667eea" 
  toColor="#764ba2"
  gradientDirection="diagonal"
>
  {/* 컨텐츠 */}
</GradientBackground>
```

### 3. AnimatedBackground
색상이 변화하는 애니메이션 배경을 제공하는 컴포넌트입니다.

**Props:**
- `colors`: 색상 배열 (기본값: ['#ff0000', '#00ff00', '#0000ff'])
- `duration`: 애니메이션 지속 시간 (기본값: 3초)
- `loop`: 반복 여부 (기본값: true)
- 기타 RectProps 속성들

**사용법:**
```tsx
import { AnimatedBackground } from '@/components/background';

<AnimatedBackground 
  colors={['#ff6b6b', '#4ecdc4', '#45b7d1']}
  duration={5}
  loop={true}
>
  {/* 컨텐츠 */}
</AnimatedBackground>
```

## 씬에서 사용하는 방법

기존 씬 파일에서 다음과 같이 사용할 수 있습니다:

```tsx
import { makeScene2D } from '@revideo/2d';
import { SolidBackground, GradientBackground } from '@/components/background';

export default makeScene2D(function* (view) {
  view.add(
    <GradientBackground 
      fromColor="#667eea" 
      toColor="#764ba2"
      gradientDirection="vertical"
    >
      <Txt text="Hello World" fontSize={60} fill="#fff" />
    </GradientBackground>
  );
  
  // 애니메이션 코드...
});
```

## 중첩 배경

여러 배경을 중첩하여 복잡한 효과를 만들 수 있습니다:

```tsx
<GradientBackground fromColor="#667eea" toColor="#764ba2">
  <SolidBackground color="rgba(0, 0, 0, 0.3)">
    {/* 컨텐츠 */}
  </SolidBackground>
</GradientBackground>
```

## 추가 배경 컴포넌트

필요에 따라 다음과 같은 배경 컴포넌트들을 추가로 만들 수 있습니다:
- `ImageBackground`: 이미지 배경
- `PatternBackground`: 패턴 배경
- `ParticleBackground`: 파티클 효과 배경 