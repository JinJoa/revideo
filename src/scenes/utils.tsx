// import {Img} from '@revideo/2d';
// import {all, waitFor} from '@revideo/core';
// import {createRef} from '@revideo/core';
// import {makeScene2D} from '@revideo/2d';₩
// import React from 'react';

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

// //   yield view.add(<Img src={'/images/cartoon_전체.jpg'} size={['100%', '100%']} />);
// //   yield* waitFor(3); // 전체컷 3초 노출
// }); 