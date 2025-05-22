// // import {Video, makeScene2D} from '@revideo/2d';
// // import {waitFor} from '@revideo/core';

// // export default makeScene2D(function* (view) {
// //   const videoFile = useScene().variables.get(
// //     'video',
// //     'https://revideo-example-assets.s3.amazonaws.com/stars.mp4',
// //   )();

// //   yield view.add(<Video src={videoFile} size={['100%', '100%']} play={true} />);

// //   yield* waitFor(10);
// // });


// import { Img, makeScene2D } from '@revideo/2d';
// import { waitFor } from '@revideo/core';

// export default makeScene2D('cartoon', function* (view) {
// //   const images: string[] = [
// //     '/images/cartoon_1.jpg',
// //     '/images/cartoon_2.jpg',
// //     '/images/cartoon_3.jpg',
// //   ];

// //   for (const path of images) {
// //     yield view.add(<Img src={path} />);
// //     yield* waitFor(2); // 각 컷 2초 노출
// //     //view.clear();
// //   }
// yield view.add(<Img src={'src/images/cartoon_1.png'} />);
// yield * waitFor(1);
// yield view.add(<Img src={'src/images/cartoon_2.png'} />);
// yield * waitFor(1);
// yield view.add(<Img src={'src/images/cartoon_3.png'} />);
// yield * waitFor(1);

// });