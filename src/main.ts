import {makeProject} from '@revideo/core';
import FirstScene from './scenes/first';

export default makeProject({
  name: 'revideo_test',
  scenes: [FirstScene],
  variables: {
    text: 'Hello Revideo!',
  },
  settings: {
    shared: {
      size: {x: 1080, y: 1920}, // 9:16 세로 비율 (1080x1920)
    },
  },
}); 