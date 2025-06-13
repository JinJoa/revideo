import {makeProject} from '@revideo/core';
import FirstScene from './scenes/first';
import SecondScene from './scenes/second';
import SlideShow from './scenes/background_test';
import IntermittentFasting from './scenes/intermittent_fasting';

export default makeProject({
  name: 'revideo_test',
  scenes: [IntermittentFasting],
  variables: {
    text: 'Hello Revideo!',
  },
  settings: {
    shared: {
      size: {x: 1080, y: 1920}, // 9:16 세로 비율 (1080x1920)
    },
  },
}); 