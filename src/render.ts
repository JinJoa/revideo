import {renderVideo} from '@revideo/renderer';

async function render() {
  console.log('Rendering video...');

  // This is the main function that renders the video
  const file = await renderVideo({
    projectFile: './src/main.ts',
    settings: {
      logProgress: true,
      outFile: 'anacell_hair_solution.mp4',
    },
  });

  console.log(`Rendered video to ${file}`);
}

render();