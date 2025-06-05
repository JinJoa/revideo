import { Circle, View2D, Rect, Node, NodeProps, initial, signal } from '@revideo/2d';
import { createRef, tween, easeInOutQuad, easeOutQuart, all, waitFor, linear, SimpleSignal, SignalValue } from '@revideo/core';

export interface ParticleEffectProps extends NodeProps {
  centerX?: SignalValue<number>;
  centerY?: SignalValue<number>;
  particleCount?: SignalValue<number>;
  maxDistance?: SignalValue<number>;
  color?: SignalValue<string>;
  secondaryColor?: SignalValue<string>;
  intensity?: SignalValue<number>;
}

export class ParticleEffect extends Node {
  @initial(0)
  @signal()
  public declare readonly centerX: SimpleSignal<number, this>;

  @initial(0)
  @signal()
  public declare readonly centerY: SimpleSignal<number, this>;

  @initial(80)
  @signal()
  public declare readonly particleCount: SimpleSignal<number, this>;

  @initial(800)
  @signal()
  public declare readonly maxDistance: SimpleSignal<number, this>;

  @initial("#FFD700")
  @signal()
  public declare readonly color: SimpleSignal<string, this>;

  @initial("#FFFFFF")
  @signal()
  public declare readonly secondaryColor: SimpleSignal<string, this>;

  @initial(1.0)
  @signal()
  public declare readonly intensity: SimpleSignal<number, this>;

  private particles: any[] = [];
  private containerRef = createRef<Rect>();

  public constructor(props?: ParticleEffectProps) {
    super({
      ...props,
    });

    this.initializeParticles();
  }

  private initializeParticles() {
    // 컨테이너 생성
    this.add(
      <Rect
        ref={this.containerRef}
        width={'100%'}
        height={'100%'}
        opacity={0}
      />
    );

    // 파티클 생성
    for (let i = 0; i < this.particleCount(); i++) {
      const angle = (i / this.particleCount()) * Math.PI * 2 + Math.random() * 0.3;
      const distance = this.maxDistance() + Math.random() * 200;
      
      const endX = this.centerX() + Math.cos(angle) * distance;
      const endY = this.centerY() + Math.sin(angle) * distance;

      const particleRef = createRef<Circle>();
      const size = 3 + Math.random() * 5;
      const isSecondary = i % 3 === 0;
      
      this.containerRef().add(
        <Circle
          ref={particleRef}
          width={size}
          height={size}
          fill={isSecondary ? this.secondaryColor() : this.color()}
          x={this.centerX()}
          y={this.centerY()}
          opacity={0}
        />
      );

      this.particles.push({
        ref: particleRef,
        startX: this.centerX(),
        startY: this.centerY(),
        endX,
        endY,
        angle,
        size,
        isSecondary,
        delay: Math.random() * 0.5,
        speed: 0.8 + Math.random() * 0.4
      });
    }
  }

  // 1. 폭발 효과 (Explosion)
  public *explosion(duration: number = 2.5) {
    yield* this.containerRef().opacity(1, 0.05);

    const self = this;
    yield* all(
      ...this.particles.map((particle) => 
        (function* () {
          particle.ref().scale(0.1);
          
          yield* all(
            particle.ref().opacity(0.8 * self.intensity(), 0.1),
            particle.ref().scale(1, 0.2),
            tween(duration, value => {
              const progress = easeOutQuart(value);
              const currentX = particle.startX + (particle.endX - particle.startX) * progress;
              const currentY = particle.startY + (particle.endY - particle.startY) * progress;
              
              particle.ref().x(currentX);
              particle.ref().y(currentY);
              
              if (progress > 0.6) {
                const fadeProgress = (progress - 0.6) / 0.4;
                particle.ref().opacity((0.8 * self.intensity()) * (1 - fadeProgress));
                particle.ref().scale(1 + fadeProgress * 0.5);
              }
            })
          );
        })()
      )
    );
  }

  // 2. 소용돌이 효과 (Vortex)
  public *vortex(duration: number = 4.0, rotations: number = 3) {
    yield* this.containerRef().opacity(1, 0.1);

    const self = this;
    yield* all(
      ...this.particles.map((particle, index) => 
        (function* () {
          const delay = (index / self.particles.length) * 1.0;
          yield* waitFor(delay);
          
          yield* particle.ref().opacity(0.7 * self.intensity(), 0.1);
          
          yield* tween(duration, value => {
            const progress = easeInOutQuad(value);
            const spiralAngle = particle.angle + progress * rotations * Math.PI * 2;
            const currentDistance = progress * self.maxDistance();
            
            const currentX = self.centerX() + Math.cos(spiralAngle) * currentDistance;
            const currentY = self.centerY() + Math.sin(spiralAngle) * currentDistance;
            
            particle.ref().x(currentX);
            particle.ref().y(currentY);
            
            // 회전하면서 크기 변화
            particle.ref().scale(1 + Math.sin(progress * Math.PI * 4) * 0.3);
          });
          
          yield* particle.ref().opacity(0, 0.2);
        })()
      )
    );
  }

  // 3. 유성 효과 (Meteor Shower)
  public *meteorShower(duration: number = 3.0) {
    yield* this.containerRef().opacity(1, 0.1);

    const self = this;
    yield* all(
      ...this.particles.map((particle) => 
        (function* () {
          yield* waitFor(particle.delay);
          
          // 시작 위치를 화면 밖으로 설정
          const startAngle = particle.angle + Math.PI;
          particle.ref().x(self.centerX() + Math.cos(startAngle) * self.maxDistance());
          particle.ref().y(self.centerY() + Math.sin(startAngle) * self.maxDistance());
          
          yield* all(
            particle.ref().opacity(0.7 * self.intensity(), 0.1),
            tween(duration * particle.speed, value => {
              const progress = easeOutQuart(value);
              const currentX = particle.ref().x() + Math.cos(particle.angle) * self.maxDistance() * 2 * progress;
              const currentY = particle.ref().y() + Math.sin(particle.angle) * self.maxDistance() * 2 * progress;
              
              particle.ref().x(currentX);
              particle.ref().y(currentY);
              
              // 꼬리 효과
              particle.ref().scale(1 + progress * 0.5);
              
              if (progress > 0.7) {
                const fadeProgress = (progress - 0.7) / 0.3;
                particle.ref().opacity((0.7 * self.intensity()) * (1 - fadeProgress));
              }
            })
          );
        })()
      )
    );
  }

  // 4. 펄스 링 효과 (Pulse Rings)
  public *pulseRings(ringCount: number = 3, ringDuration: number = 1.5) {
    const self = this;
    for (let ring = 0; ring < ringCount; ring++) {
      yield* all(
        ...this.particles.map((particle, index) => 
          (function* () {
            const ringIndex = index % 3;
            if (ringIndex !== ring % 3) return;
            
            particle.ref().x(self.centerX());
            particle.ref().y(self.centerY());
            particle.ref().scale(0.5);
            
            yield* all(
              particle.ref().opacity(0.6 * self.intensity(), 0.1),
              tween(ringDuration, value => {
                const ringProgress = easeOutQuart(value);
                const distance = ringProgress * self.maxDistance();
                
                particle.ref().x(self.centerX() + Math.cos(particle.angle) * distance);
                particle.ref().y(self.centerY() + Math.sin(particle.angle) * distance);
                particle.ref().scale(0.5 + ringProgress * 1.5);
                
                if (ringProgress > 0.5) {
                  const fadeProgress = (ringProgress - 0.5) / 0.5;
                  particle.ref().opacity((0.6 * self.intensity()) * (1 - fadeProgress));
                }
              })
            );
          })()
        )
      );
      
      if (ring < ringCount - 1) {
        yield* waitFor(0.3);
      }
    }
  }

  // 5. 군집 행동 효과 (Swarm Behavior)
  public *swarm(duration: number = 4.0) {
    yield* this.containerRef().opacity(1, 0.1);

    const self = this;
    yield* all(
      ...this.particles.map((particle, index) => 
        (function* () {
          yield* particle.ref().opacity(0.6 * self.intensity(), 0.2);
          
          yield* tween(duration, value => {
            const progress = linear(value);
            
            // 군집 중심점 계산
            const swarmCenterX = self.centerX() + Math.sin(progress * Math.PI * 2) * 200;
            const swarmCenterY = self.centerY() + Math.cos(progress * Math.PI * 2) * 200;
            
            // 개별 파티클 움직임
            const individualAngle = particle.angle + progress * Math.PI * 4;
            const individualDistance = 50 + Math.sin(progress * Math.PI * 8 + index) * 30;
            
            const currentX = swarmCenterX + Math.cos(individualAngle) * individualDistance;
            const currentY = swarmCenterY + Math.sin(individualAngle) * individualDistance;
            
            particle.ref().x(currentX);
            particle.ref().y(currentY);
            
            // 크기 변화
            particle.ref().scale(1 + Math.sin(progress * Math.PI * 6 + index * 0.5) * 0.3);
          });
          
          yield* particle.ref().opacity(0, 0.3);
        })()
      )
    );
  }

  // 6. 연기/먼지 효과 (Dust/Smoke Effect)
  public *dustSmoke(duration: number = 3.0, direction: 'up' | 'horizontal' | 'swirl' = 'up') {
    yield* this.containerRef().opacity(1, 0.1);

    const self = this;
    yield* all(
      ...this.particles.map((particle, index) => 
        (function* () {
          const delay = Math.random() * 0.8;
          yield* waitFor(delay);
          
          // 연기 색상 설정 (회색 계열)
          const smokeColors = ['#A0A0A0', '#808080', '#C0C0C0', '#909090'];
          const dustColors = ['#D2B48C', '#DEB887', '#F5DEB3', '#CD853F'];
          const colorPalette = index % 2 === 0 ? smokeColors : dustColors;
          particle.ref().fill(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
          
          // 연기 파티클 크기 증가
          const initialSize = 8 + Math.random() * 12;
          particle.ref().width(initialSize);
          particle.ref().height(initialSize);
          particle.ref().scale(0.1);
          
          yield* all(
            particle.ref().opacity(0.3 + Math.random() * 0.4, 0.3),
            particle.ref().scale(1, 0.5),
            tween(duration, value => {
              const progress = easeOutQuart(value);
              
              let currentX = particle.startX;
              let currentY = particle.startY;
              
              switch (direction) {
                case 'up':
                  // 위로 상승하는 연기
                  currentX = particle.startX + (Math.sin(progress * Math.PI * 2 + index) * 100);
                  currentY = particle.startY - progress * (self.maxDistance() * 0.8);
                  break;
                case 'horizontal':
                  // 좌우로 퍼지는 먼지
                  currentX = particle.startX + Math.cos(particle.angle) * progress * self.maxDistance();
                  currentY = particle.startY + Math.sin(progress * Math.PI * 3 + index) * 50;
                  break;
                case 'swirl':
                  // 소용돌이치는 연기
                  const swirlAngle = particle.angle + progress * Math.PI * 6;
                  const swirlDistance = progress * self.maxDistance() * 0.6;
                  currentX = self.centerX() + Math.cos(swirlAngle) * swirlDistance;
                  currentY = self.centerY() + Math.sin(swirlAngle) * swirlDistance - progress * 200;
                  break;
              }
              
              particle.ref().x(currentX);
              particle.ref().y(currentY);
              
              // 연기가 퍼지면서 크기 증가 및 투명도 감소
              const scaleMultiplier = 1 + progress * 2;
              particle.ref().scale(scaleMultiplier);
              
              if (progress > 0.4) {
                const fadeProgress = (progress - 0.4) / 0.6;
                particle.ref().opacity((0.3 + Math.random() * 0.4) * (1 - fadeProgress * 0.8));
              }
            })
          );
        })()
      )
    );
  }

  // 7. 화면 가리기 연기 전환 효과 (Smoke Screen Transition) - 개선된 버전
  public *smokeTransition(duration: number = 1.0, coverScreen: boolean = true) {
    const screenWidth = 1920;
    const screenHeight = 1080;
    
    yield* this.containerRef().opacity(1, 0.05);

    const self = this;
    // 연기가 자연스럽게 퍼지면서 화면을 가리는 효과
    yield* all(
      ...this.particles.map((particle, index) => 
        (function* () {
          const delay = (index / self.particles.length) * 0.3; // 더 빠른 시작
          yield* waitFor(delay);
          
          // 더 자연스러운 연기 색상 (그라데이션 효과)
          const smokeColors = ['#3a3a3a', '#4a4a4a', '#5a5a5a', '#454545', '#353535'];
          particle.ref().fill(smokeColors[Math.floor(Math.random() * smokeColors.length)]);
          
          // 다양한 크기의 연기 파티클로 자연스러운 효과
          const smokeSize = 30 + Math.random() * 60;
          particle.ref().width(smokeSize);
          particle.ref().height(smokeSize);
          particle.ref().scale(0.1);
          
          // 중앙에서 바깥쪽으로 퍼지는 자연스러운 연기 패턴
          const angle = (index / self.particles.length) * Math.PI * 2 + Math.random() * 0.5;
          const distance = 300 + Math.random() * 500;
          const targetX = self.centerX() + Math.cos(angle) * distance;
          const targetY = self.centerY() + Math.sin(angle) * distance * 0.8; // 세로로 조금 압축
          
          particle.ref().x(self.centerX());
          particle.ref().y(self.centerY());
          
          yield* all(
            particle.ref().opacity(coverScreen ? (0.6 + Math.random() * 0.2) : 0.3, 0.2),
            particle.ref().scale(0.8 + Math.random() * 0.4, 0.3),
            tween(duration * 0.7, value => {
              const progress = easeOutQuart(value);
              
              // 연기가 소용돌이치며 퍼지는 자연스러운 움직임
              const swirlFactor = Math.sin(progress * Math.PI * 2 + index * 0.3) * 50;
              const currentX = self.centerX() + (targetX - self.centerX()) * progress + swirlFactor;
              const currentY = self.centerY() + (targetY - self.centerY()) * progress - progress * 100; // 위로 약간 상승
              
              particle.ref().x(currentX);
              particle.ref().y(currentY);
              
              // 연기가 퍼지면서 자연스럽게 커지고 흩어짐
              const scaleMultiplier = (0.8 + Math.random() * 0.4) + progress * 1.8;
              particle.ref().scale(scaleMultiplier);
              
              // 가장자리 연기는 부드럽게 투명해짐
              if (progress > 0.3) {
                const fadeProgress = (progress - 0.3) / 0.7;
                const baseOpacity = coverScreen ? (0.6 + Math.random() * 0.2) : 0.3;
                particle.ref().opacity(baseOpacity * (1 - fadeProgress * 0.6));
              }
            })
          );
          
          // 연기가 부드럽게 사라짐
          yield* particle.ref().opacity(0, duration * 0.3);
        })()
      )
    );
  }

  // 8. 먼지 폭풍 효과 (Dust Storm)
  public *dustStorm(duration: number = 4.0, intensity: 'light' | 'medium' | 'heavy' = 'medium') {
    yield* this.containerRef().opacity(1, 0.1);
    
    const stormIntensity = intensity === 'light' ? 0.3 : intensity === 'medium' ? 0.6 : 0.9;
    const self = this;
    
    yield* all(
      ...this.particles.map((particle, index) => 
        (function* () {
          const delay = Math.random() * 1.0;
          yield* waitFor(delay);
          
          // 먼지 색상
          const dustColors = ['#D2691E', '#CD853F', '#DEB887', '#BC8F8F', '#F4A460'];
          particle.ref().fill(dustColors[Math.floor(Math.random() * dustColors.length)]);
          
          const dustSize = 3 + Math.random() * 8;
          particle.ref().width(dustSize);
          particle.ref().height(dustSize);
          
          // 오른쪽에서 왼쪽으로 이동하는 먼지 폭풍
          const startX = self.centerX() + self.maxDistance();
          const endX = self.centerX() - self.maxDistance();
          const waveHeight = 200 + Math.random() * 300;
          
          particle.ref().x(startX);
          particle.ref().y(self.centerY() + (Math.random() - 0.5) * 400);
          particle.ref().scale(0.1);
          
          yield* all(
            particle.ref().opacity(stormIntensity * (0.4 + Math.random() * 0.4), 0.2),
            particle.ref().scale(0.8 + Math.random() * 0.6, 0.3),
            tween(duration, value => {
              const progress = linear(value);
              
              // 먼지가 파도처럼 움직임
              const currentX = startX + (endX - startX) * progress;
              const waveOffset = Math.sin(progress * Math.PI * 4 + index * 0.1) * waveHeight * (1 - progress * 0.5);
              const currentY = particle.ref().y() + waveOffset * 0.02;
              
              particle.ref().x(currentX);
              particle.ref().y(currentY);
              
              // 회전 효과
              particle.ref().rotation(progress * 360 + index * 45);
              
              // 크기 변화 (바람에 날리는 효과)
              const sizeVariation = 1 + Math.sin(progress * Math.PI * 8 + index) * 0.3;
              particle.ref().scale((0.8 + Math.random() * 0.6) * sizeVariation);
              
              if (progress > 0.7) {
                const fadeProgress = (progress - 0.7) / 0.3;
                particle.ref().opacity(stormIntensity * (0.4 + Math.random() * 0.4) * (1 - fadeProgress));
              }
            })
          );
        })()
      )
    );
  }

  // 9. 색상 변화 (Color Transition)
  public *colorTransition(newColor: string, duration: number = 1.0) {
    const self = this;
    yield* all(
      ...this.particles.map(particle => 
        tween(duration, () => {
          particle.ref().fill(particle.isSecondary ? self.secondaryColor() : newColor);
        })
      )
    );
  }

  // 10. 강도 조절 (Intensity Control)
  public *setIntensity(newIntensity: number, duration: number = 1.0) {
    const self = this;
    yield* all(
      ...this.particles.map(particle => 
        particle.ref().opacity(particle.ref().opacity() * (newIntensity / self.intensity()), duration)
      )
    );
    this.intensity(newIntensity);
  }

  // 효과 중지
  public *stop(duration: number = 0.5) {
    yield* this.containerRef().opacity(0, duration);
  }

  // 효과 제거
  public *removeEffect() {
    yield* this.containerRef().opacity(0, 0.1);
    this.remove();
  }
} 