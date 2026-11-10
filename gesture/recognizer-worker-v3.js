// 双手、全部类别（2026-11-08 交接包 recognizer-worker-v3.js）。
// Keep tracking independent from canned gesture categories. In this vision runtime,
// filtering every gesture category also removes the returned landmark packets.
importScripts('./vision_bundle.js');
let recognizer;
self.onmessage=async({data})=>{
  if(data.type==='init'){
    try{
      const files=await Vision.FilesetResolver.forVisionTasks(new URL('./wasm',self.location.href).href);
      recognizer=await Vision.GestureRecognizer.createFromOptions(files,{
        baseOptions:{modelAssetPath:new URL('./gesture_recognizer.task',self.location.href).href,delegate:'CPU'},
        canvas:new OffscreenCanvas(1,1),runningMode:'VIDEO',numHands:2,
        minHandDetectionConfidence:.4,minHandPresenceConfidence:.35,minTrackingConfidence:.3,
        cannedGesturesClassifierOptions:{scoreThreshold:0},
      });
      self.postMessage({type:'ready'});
    }catch(error){self.postMessage({type:'error',message:error.message});}
  }
  if(data.type==='frame'){
    try{
      const result=recognizer.recognizeForVideo(data.frame,data.timestamp);
      const hands=(result.landmarks??[]).map((landmarks,index)=>({
        landmarks,worldLandmarks:result.worldLandmarks?.[index]??[],
        handedness:result.handedness?.[index]?.[0]?.categoryName??'hand-'+index,
        name:result.gestures?.[index]?.[0]?.categoryName??'None',score:result.gestures?.[index]?.[0]?.score??0,
      }));
      self.postMessage({type:'result',hands,aspect:data.frame.width/data.frame.height,timestamp:data.timestamp});
    }catch(error){self.postMessage({type:'error',message:error.message});}
    finally{data.frame.close();}
  }
};
