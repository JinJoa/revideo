import {makeProject} from '@revideo/core';
import FirstScene from './scenes/first';
import SecondScene from './scenes/second';
import SlideShow from './scenes/background_test';

export default makeProject({
  name: 'revideo_test',
  scenes: [SlideShow],
  variables: {
    text: 'Hello Revideo!',
  },
  settings: {
    shared: {
      size: {x: 1080, y: 1920}, // 9:16 세로 비율 (1080x1920)
    },
  },
}); 