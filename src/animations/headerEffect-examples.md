# 헤더 효과 사용 가이드

SlideHeader에 다양한 시각적 효과를 적용할 수 있는 헤더 효과 시스템입니다.

## 기본 사용법

### 1. 기본 헤더 (효과 없음)
```typescript
const header = createSlideHeader({
  header: "제목 텍스트",
  view: view
});
```

### 2. 프리셋 효과 사용
```typescript
const header = createSlideHeader({
  header: "제목 텍스트",
  view: view,
  effect: "basic3D"  // 미리 정의된 프리셋 사용
});
```

### 3. 커스텀 효과 설정
```typescript
const header = createSlideHeader({
  header: "제목 텍스트",
  view: view,
  effect: "punch_zoom",
  effectConfig: {
    intensity: 1.5,
    duration: 1.2
  }
});
```

## 사용 가능한 효과들

### 1. 3D 돌출 글씨체 (`3d_extrude`)
```typescript
// 헬퍼 함수 사용
const header = createSlideHeader({
  header: "3D 효과 제목",
  view: view,
  ...HeaderEffects.create3D(5) // intensity: 5
});

// 직접 설정
const header = createSlideHeader({
  header: "3D 효과 제목",
  view: view,
  effect: "3d_extrude",
  effectConfig: {
    intensity: 3,
    duration: 1.0
  }
});
```

### 2. 타이프라이터 효과 (`typewriter`)
```typescript
const header = createSlideHeader({
  header: "한 글자씩 나타나는 제목",
  view: view,
  ...HeaderEffects.createTypewriter(2.5) // duration: 2.5초
});
```

### 3. 충격 줌 효과 (`punch_zoom`)
```typescript
const header = createSlideHeader({
  header: "강력한 임팩트!",
  view: view,
  ...HeaderEffects.createPunchZoom(1.5, 1.0) // intensity: 1.5, duration: 1.0초
});
```

### 4. 하이라이트 단어 효과 (`highlight_words`)
```typescript
const header = createSlideHeader({
  header: "중요한 핵심 내용입니다",
  view: view,
  ...HeaderEffects.createHighlight(['중요한', '핵심'], '#FFD93D')
});
```

### 5. 배경 이미지 효과 (`background_image`)
```typescript
const header = createSlideHeader({
  header: "배경과 함께",
  view: view,
  ...HeaderEffects.createWithBackground('/path/to/background.jpg')
});
```

### 6. 글로우 효과 (`glow_effect`)
```typescript
const header = createSlideHeader({
  header: "빛나는 제목",
  view: view,
  ...HeaderEffects.createGlow('#00FF00') // 녹색 글로우
});
```

### 7. 바운스 인 효과 (`bounce_in`)
```typescript
const header = createSlideHeader({
  header: "튀어나오는 제목",
  view: view,
  ...HeaderEffects.createBounce(1.2)
});
```

### 8. 슬라이드 분할 효과 (`slide_split`)
```typescript
const header = createSlideHeader({
  header: "분할되어 나타나는 제목",
  view: view,
  ...HeaderEffects.createSlideSplit(1.5)
});
```

### 9. 무지개 텍스트 효과 (`rainbow_text`)
```typescript
const header = createSlideHeader({
  header: "무지개 색상 제목",
  view: view,
  ...HeaderEffects.createRainbow(3.0)
});
```

### 10. 흔들림 강조 효과 (`shake_emphasis`)
```typescript
const header = createSlideHeader({
  header: "주목! 중요한 내용",
  view: view,
  ...HeaderEffects.createShake(15, 1.0) // intensity: 15, duration: 1.0초
});
```

## 미리 정의된 프리셋

```typescript
// 사용 가능한 프리셋들
const presets = [
  "basic3D",      // 기본 3D 효과
  "typewriter",   // 타이프라이터 효과
  "powerPunch",   // 강력한 충격 줌
  "highlightDemo", // 하이라이트 데모
  "greenGlow",    // 녹색 글로우
  "bounceIn",     // 바운스 인
  "rainbow",      // 무지개 텍스트
  "shake"         // 흔들림 효과
];

// 프리셋 사용 예시
const header = createSlideHeader({
  header: "프리셋 효과",
  view: view,
  effect: "powerPunch"
});
```

## 동적 효과 변경

```typescript
const header = createSlideHeader({
  header: "변화하는 제목",
  view: view,
  effect: "basic3D"
});

// 애니메이션 중에 효과 변경
yield* header.showHeader();
yield* waitFor(2);
yield* header.changeEffect("rainbow_text", { duration: 2.0 });
yield* waitFor(3);
yield* header.changeEffect("shake_emphasis", { intensity: 20 });
```

## 실제 사용 예시

```typescript
// project.tsx에서 사용
export default makeProject({
  scenes: [makeScene2D(function* (view) {
    // 1. 3D 효과로 시작
    const titleHeader = createSlideHeader({
      header: "아나셀 제품 소개",
      view: view,
      ...HeaderEffects.create3D(4)
    });
    
    yield* titleHeader.showHeader();
    yield* waitFor(2);
    
    // 2. 하이라이트 효과로 변경
    yield* titleHeader.changeEffect("highlight_words", {
      highlightWords: ["아나셀"],
      highlightColor: "#FF6B6B",
      duration: 1.5
    });
    
    yield* waitFor(3);
    
    // 3. 무지개 효과로 마무리
    yield* titleHeader.changeEffect("rainbow_text", {
      duration: 2.0
    });
    
    yield* waitFor(3);
    yield* titleHeader.hideHeader();
  })]
});
```

## 설정 옵션

### HeaderEffectConfig 인터페이스
```typescript
interface HeaderEffectConfig {
  type: HeaderEffectType;
  duration?: number;        // 애니메이션 지속 시간
  intensity?: number;       // 효과 강도
  highlightWords?: string[]; // 하이라이트할 단어들
  highlightColor?: string;   // 하이라이트 색상
  backgroundImage?: string;  // 배경 이미지 경로
  glowColor?: string;       // 글로우 색상
  textColor?: string;       // 기본 텍스트 색상
  strokeColor?: string;     // 테두리 색상
  fontSize?: number;        // 폰트 크기
  fontWeight?: number;      // 폰트 굵기
}
```

## 팁과 주의사항

1. **성능 고려**: 복잡한 효과(3D, 하이라이트 단어)는 많은 요소를 생성하므로 적절히 사용하세요.

2. **텍스트 길이**: 긴 텍스트의 경우 `slide_split` 효과가 잘 작동하지 않을 수 있습니다.

3. **색상 조합**: 배경과 텍스트 색상의 대비를 고려하여 가독성을 확보하세요.

4. **애니메이션 타이밍**: 각 효과의 `duration`을 조정하여 전체 비디오의 리듬에 맞추세요.

5. **효과 정리**: `hideHeader()`를 호출하면 자동으로 추가 요소들이 정리됩니다.