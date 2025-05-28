import { Txt, Layout, Rect } from '@revideo/2d';
import { createRef, waitFor, all, Reference, createSignal } from '@revideo/core';

interface Word {
  punctuated_word: string;
  start: number;
  end: number;
}

interface captionSettings {
  fontSize: number;
  textColor: string;
  fontWeight: number;
  fontFamily: string;
  numSimultaneousWords: number;
  stream: boolean;
  textAlign: "center" | "left";
  textBoxWidthInPercent: number;
  borderColor?: string;
  borderWidth?: number;
  currentWordColor?: string;
  currentWordBackgroundColor?: string;
  shadowColor?: string;
  shadowBlur?: number;
  fadeInAnimation?: boolean;
}

interface SlideFooterProps {
  textContainer: Reference<Layout>;
  words: Word[];
  settings: captionSettings;
}

export function* displayWords(props: SlideFooterProps) {
  const { textContainer, words, settings } = props;
  let waitBefore = words[0].start;

  for (let i = 0; i < words.length; i += settings.numSimultaneousWords) {
    const currentBatch = words.slice(i, i + settings.numSimultaneousWords);
    const nextClipStart =
      i < words.length - 1 ? words[i + settings.numSimultaneousWords]?.start || null : null;
    const isLastClip = i + settings.numSimultaneousWords >= words.length;
    const waitAfter = isLastClip ? 1 : 0;
    const textRef = createRef<Txt>();
    yield* waitFor(waitBefore);

    if (settings.stream) {
      let nextWordStart = 0;
      yield textContainer().add(<Txt width={`${settings.textBoxWidthInPercent}%`} textWrap={true} zIndex={2} textAlign={settings.textAlign} ref={textRef} />);

      for (let j = 0; j < currentBatch.length; j++) {
        const word = currentBatch[j];
        yield* waitFor(nextWordStart);
        const optionalSpace = j === currentBatch.length - 1 ? "" : " ";
        const backgroundRef = createRef<Rect>();
        const wordRef = createRef<Txt>();
        const opacitySignal = createSignal(settings.fadeInAnimation ? 0.5 : 1);
        textRef().add(
          <Txt
            fontSize={settings.fontSize}
            fontWeight={settings.fontWeight}
            fontFamily={settings.fontFamily}
            textWrap={true}
            textAlign={settings.textAlign}
            fill={settings.currentWordColor}
            ref={wordRef}
            lineWidth={settings.borderWidth}
            shadowBlur={settings.shadowBlur}
            shadowColor={settings.shadowColor}
            zIndex={2}
            stroke={settings.borderColor}
            opacity={opacitySignal}
          >
            {word.punctuated_word}
          </Txt>
        );
        textRef().add(<Txt fontSize={settings.fontSize}>{optionalSpace}</Txt>);
        textContainer().add(<Rect fill={settings.currentWordBackgroundColor} zIndex={1} size={wordRef().size} position={wordRef().position} radius={10} padding={10} ref={backgroundRef} />);
        yield* all(waitFor(word.end - word.start), opacitySignal(1, Math.min((word.end - word.start) * 0.5, 0.1)));
        wordRef().fill(settings.textColor);
        backgroundRef().remove();
        nextWordStart = currentBatch[j + 1]?.start - word.end || 0;
      }
      textRef().remove();

    } else {
      yield textContainer().add(<Txt width={`${settings.textBoxWidthInPercent}%`} textAlign={settings.textAlign} ref={textRef} textWrap={true} zIndex={2} />);

      const wordRefs = [];
      const opacitySignal = createSignal(settings.fadeInAnimation ? 0.5 : 1);
      for (let j = 0; j < currentBatch.length; j++) {
        const word = currentBatch[j];
        const optionalSpace = j === currentBatch.length - 1 ? "" : " ";
        const wordRef = createRef<Txt>();
        textRef().add(
          <Txt
            fontSize={settings.fontSize}
            fontWeight={settings.fontWeight}
            ref={wordRef}
            fontFamily={settings.fontFamily}
            textWrap={true}
            textAlign={settings.textAlign}
            fill={settings.textColor}
            zIndex={2}
            stroke={settings.borderColor}
            lineWidth={settings.borderWidth}
            shadowBlur={settings.shadowBlur}
            shadowColor={settings.shadowColor}
            opacity={opacitySignal}
          >
            {word.punctuated_word}
          </Txt>
        );
        textRef().add(<Txt fontSize={settings.fontSize}>{optionalSpace}</Txt>);

        // we have to yield once to await the first word being aligned correctly
        if (j === 0 && i === 0) {
          yield;
        }
        wordRefs.push(wordRef);
      }

      yield* all(
        opacitySignal(1, Math.min(0.1, (currentBatch[0].end - currentBatch[0].start) * 0.5)),
        highlightCurrentWord(textContainer, currentBatch, wordRefs, settings.currentWordColor, settings.currentWordBackgroundColor),
        waitFor(currentBatch[currentBatch.length - 1].end - currentBatch[0].start + waitAfter),
      );
      textRef().remove();
    }
    waitBefore = nextClipStart !== null ? nextClipStart - currentBatch[currentBatch.length - 1].end : 0;
  }
}

function* highlightCurrentWord(container: Reference<Layout>, currentBatch: Word[], wordRefs: Reference<Txt>[], wordColor: string, backgroundColor: string) {
  let nextWordStart = 0;

  for (let i = 0; i < currentBatch.length; i++) {
    yield* waitFor(nextWordStart);
    const word = currentBatch[i];
    const originalColor = wordRefs[i]().fill();
    nextWordStart = currentBatch[i + 1]?.start - word.end || 0;
    wordRefs[i]().text(wordRefs[i]().text());
    wordRefs[i]().fill(wordColor);

    const backgroundRef = createRef<Rect>();
    if (backgroundColor) {
      container().add(<Rect fill={backgroundColor} zIndex={1} size={wordRefs[i]().size} position={wordRefs[i]().position} radius={10} padding={10} ref={backgroundRef} />);
    }

    yield* waitFor(word.end - word.start);
    wordRefs[i]().text(wordRefs[i]().text());
    wordRefs[i]().fill(originalColor);

    if (backgroundColor) {
      backgroundRef().remove();
    }
  }
}