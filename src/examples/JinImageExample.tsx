import { makeScene2D, Txt, View2D } from '@revideo/2d'
import { createRef, waitFor, all } from '@revideo/core'
import { JinImage } from '../components/JinImage'

// 예제 이미지 URL - 실제 프로젝트에서는 로컬 이미지를 import 하세요
const exampleImageUrl = 'https://picsum.photos/800/600'

export default makeScene2D('JinImageExample', function* (view: View2D) {
  // JinImage 참조 생성
  const image1 = createRef<JinImage>()
  const image2 = createRef<JinImage>()
  const image3 = createRef<JinImage>()
  const image4 = createRef<JinImage>()

  // 뷰에 여러 JinImage 컴포넌트 추가
  view.add(
    <>
      {/* 기본 애니메이션 설정 사용 */}
      <JinImage
        ref={image1}
        src={exampleImageUrl}
        size={[400, 300]}
        position={[-600, -200]}
        zoomType="zoomIn"
        panType="panRight"
        shutterType="fade"
        animationDuration={3}
        opacity={0}
      />

      {/* 구조화된 애니메이션 설정 사용 */}
      <JinImage
        ref={image2}
        src={exampleImageUrl}
        size={[400, 300]}
        position={[200, -200]}
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
            blinkCount: 2
          }
        }}
        animationDuration={4}
        opacity={0}
      />

      {/* 블러 효과 */}
      <JinImage
        ref={image3}
        src={exampleImageUrl}
        size={[400, 300]}
        position={[-600, 250]}
        zoomType="static"
        panType="none"
        shutterType="none"
        animationDuration={2.5}
        maxBlur={20}
        opacity={1}
      />

      {/* 플래시 효과 */}
      <JinImage
        ref={image4}
        src={exampleImageUrl}
        size={[400, 300]}
        position={[200, 250]}
        zoomType="zoomOut"
        panType="panUp"
        shutterType="flash"
        animationDuration={3.5}
        zoomIntensity={0.25}
        opacity={1}
      />
    </>
  )

  // 애니메이션 시퀀스
  yield* waitFor(1)

  // 첫 번째 이미지: 페이드 인 + 줌 인 + 팬 라이트
  yield* all(
    image1().fadeIn(0.5),
    image1().startAnimation()
  )

  yield* waitFor(0.5)

  // 두 번째 이미지: 깜빡임 + 복합 애니메이션
  yield* all(
    image2().fadeIn(0.3),
    image2().playAnimation()
  )

  yield* waitFor(0.5)

  // 세 번째 이미지: 블러 인 효과
  yield* image3().blurIn(1.5, 15)

  yield* waitFor(0.5)

  // 네 번째 이미지: 플래시 + 복합 애니메이션
  yield* all(
    image4().flash(0.8),
    image4().startAnimation()
  )

  yield* waitFor(2)

  // 모든 이미지에 블러 아웃 효과 적용
  yield* all(
    image1().blurOut(1.5),
    image2().blurOut(1.5),
    image3().blurOut(1.5),
    image4().blurOut(1.5)
  )

  yield* waitFor(1)

  // 모든 이미지 페이드 아웃
  yield* all(
    image1().fadeOut(1),
    image2().fadeOut(1),
    image3().fadeOut(1),
    image4().fadeOut(1)
  )

  yield* waitFor(2)
}) 