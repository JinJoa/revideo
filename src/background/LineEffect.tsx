import { Line, View2D, Rect, Node, NodeProps, initial, signal } from '@revideo/2d';
import { createRef, tween, easeInOutQuad, easeOutQuart, all, waitFor, linear, SimpleSignal, SignalValue } from '@revideo/core';

export interface LineEffectProps extends NodeProps {
  centerX?: SignalValue<number>;
  centerY?: SignalValue<number>;
  lineCount?: SignalValue<number>;
  maxLength?: SignalValue<number>;
  color?: SignalValue<string>;
  secondaryColor?: SignalValue<string>;
  opacity?: SignalValue<number>;
}

export class LineEffect extends Node {
  @initial(0)
  @signal()
  public declare readonly centerX: SimpleSignal<number, this>;

  @initial(0)
  @signal()
  public declare readonly centerY: SimpleSignal<number, this>;

  @initial(50)
  @signal()
  public declare readonly lineCount: SimpleSignal<number, this>;

  @initial(1200)
  @signal()
  public declare readonly maxLength: SimpleSignal<number, this>;

  @initial("#FFFFFF")
  @signal()
  public declare readonly color: SimpleSignal<string, this>;

  @initial("#00CED1")
  @signal()
  public declare readonly secondaryColor: SimpleSignal<string, this>;

  @initial(0.6)
  @signal()
  public declare readonly opacity: SimpleSignal<number, this>;

  private lines: any[] = [];
  private containerRef = createRef<Rect>();

  public constructor(props?: LineEffectProps) {
    super({
      ...props,
    });

    this.initializeLines();
  }

  private initializeLines() {
    // 컨테이너 생성
    this.add(
      <Rect
        ref={this.containerRef}
        width={'100%'}
        height={'100%'}
        opacity={0}
      />
    );

    // 선들 생성
    for (let i = 0; i < this.lineCount(); i++) {
      const angle = (i / this.lineCount()) * Math.PI * 2;
      const startDistance = 0;
      const endDistance = startDistance + this.maxLength();
      
      const startX = this.centerX() + Math.cos(angle) * startDistance;
      const startY = this.centerY() + Math.sin(angle) * startDistance;
      const endX = this.centerX() + Math.cos(angle) * endDistance;
      const endY = this.centerY() + Math.sin(angle) * endDistance;

      const lineRef = createRef<Line>();
      const isSecondary = i % 2 === 0;
      
      this.containerRef().add(
        <Line
          ref={lineRef}
          points={[
            [startX, startY],
            [startX, startY]
          ]}
          stroke={isSecondary ? this.secondaryColor() : this.color()}
          lineWidth={2 + Math.random() * 4}
          opacity={0}
          lineCap="round"
        />
      );

      this.lines.push({
        ref: lineRef,
        startX,
        startY,
        endX,
        endY,
        angle,
        isSecondary,
        delay: Math.random() * 0.3
      });
    }
  }

  // 1. 방사형 확장 효과 (Radial Burst)
  public *radialBurst(duration: number = 3.0) {
    yield* this.containerRef().opacity(1, 0.1);

    const self = this;
    yield* all(
      ...this.lines.map((line) => 
        (function* () {
          yield* waitFor(line.delay);
          
          yield* all(
            line.ref().opacity(self.opacity(), 0.2),
            tween(duration * 0.8, value => {
              const progress = easeOutQuart(value);
              const currentEndX = line.startX + (line.endX - line.startX) * progress;
              const currentEndY = line.startY + (line.endY - line.startY) * progress;
              line.ref().points([
                [line.startX, line.startY],
                [currentEndX, currentEndY]
              ]);
            })
          );
          
          // 페이드아웃
          yield* line.ref().opacity(0, duration * 0.2);
        })()
      )
    );
  }

  // 2. 나선형 회전 효과 (Spiral Motion)
  public *spiralMotion(duration: number = 4.0, rotations: number = 2) {
    yield* this.containerRef().opacity(1, 0.1);

    const self = this;
    yield* all(
      ...this.lines.map((line, index) => 
        (function* () {
          const delay = (index / self.lines.length) * 0.8;
          yield* waitFor(delay);
          
          yield* line.ref().opacity(self.opacity(), 0.2);
          
          yield* tween(duration, value => {
            const progress = easeInOutQuad(value);
            const spiralAngle = line.angle + progress * rotations * Math.PI * 2;
            const currentDistance = progress * self.maxLength();
            
            const currentStartX = self.centerX() + Math.cos(spiralAngle) * (currentDistance * 0.2);
            const currentStartY = self.centerY() + Math.sin(spiralAngle) * (currentDistance * 0.2);
            const currentEndX = self.centerX() + Math.cos(spiralAngle) * currentDistance;
            const currentEndY = self.centerY() + Math.sin(spiralAngle) * currentDistance;
            
            line.ref().points([
              [currentStartX, currentStartY],
              [currentEndX, currentEndY]
            ]);
          });
          
          yield* line.ref().opacity(0, 0.3);
        })()
      )
    );
  }

  // 3. 펄스 웨이브 효과 (Pulse Wave)
  public *pulseWave(waveCount: number = 3, waveDuration: number = 1.0) {
    yield* this.containerRef().opacity(1, 0.1);

    const self = this;
    for (let wave = 0; wave < waveCount; wave++) {
      yield* all(
        ...this.lines.map((line, index) => 
          (function* () {
            const delay = (index / self.lines.length) * 0.5;
            yield* waitFor(delay);
            
            yield* all(
              tween(waveDuration, value => {
                const waveProgress = Math.sin(value * Math.PI);
                const distance = waveProgress * self.maxLength();
                
                line.ref().points([
                  [line.startX, line.startY],
                  [line.startX + Math.cos(line.angle) * distance,
                   line.startY + Math.sin(line.angle) * distance]
                ]);
                
                line.ref().opacity(self.opacity() * waveProgress);
                line.ref().lineWidth((2 + Math.random() * 4) * (1 + waveProgress * 0.5));
              })
            );
          })()
        )
      );
      
      if (wave < waveCount - 1) {
        yield* waitFor(0.2);
      }
    }
  }

  // 4. 흐름 효과 (Flow Stream)
  public *flowStream(duration: number = 3.0) {
    yield* this.containerRef().opacity(1, 0.1);

    const self = this;
    yield* all(
      ...this.lines.map((line, index) => 
        (function* () {
          const groupDelay = Math.floor(index / 5) * 0.2;
          yield* waitFor(groupDelay);
          
          yield* all(
            line.ref().opacity(self.opacity() * 0.7, 0.1),
            tween(duration, value => {
              const progress = linear(value);
              const startOffset = progress * self.maxLength() * 0.3;
              const endOffset = progress * self.maxLength();
              
              line.ref().points([
                [line.startX + Math.cos(line.angle) * startOffset,
                 line.startY + Math.sin(line.angle) * startOffset],
                [line.startX + Math.cos(line.angle) * endOffset,
                 line.startY + Math.sin(line.angle) * endOffset]
              ]);
              
              // 거리에 따른 페이드
              if (progress > 0.7) {
                const fadeProgress = (progress - 0.7) / 0.3;
                line.ref().opacity(self.opacity() * 0.7 * (1 - fadeProgress));
              }
            })
          );
        })()
      )
    );
  }

  // 5. 색상 변화 효과 (Color Shift)
  public *colorShift(colors: string[], duration: number = 2.0) {
    const colorSteps = colors.length - 1;
    
    for (let i = 0; i < colorSteps; i++) {
      yield* all(
        ...this.lines.map((line) => 
          tween(duration / colorSteps, () => {
            const newColor = line.isSecondary ? colors[i + 1] : colors[i];
            line.ref().stroke(newColor);
          })
        )
      );
    }
  }

  // 6. 강도 조절 (Intensity Control)
  public *setIntensity(newIntensity: number, duration: number = 1.0) {
    yield* all(
      ...this.lines.map(line => 
        line.ref().opacity(this.opacity() * newIntensity, duration)
      )
    );
  }

  // 효과 중지
  public *stop(duration: number = 0.5) {
    yield* all(
      this.containerRef().opacity(0, duration),
      ...this.lines.map(line => line.ref().opacity(0, duration))
    );
  }

  // 효과 제거
  public *removeEffect() {
    yield* this.containerRef().opacity(0, 0.1);
    this.containerRef().remove();
  }
} 