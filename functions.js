const colors = ['#5a2dff', '#8a22d0', '#d0208a', '#ff2a50', '#ff8c1a', '#ffd21f']; //flytta till andra filen
const brightness = [0.2, 0.35, 0.5, 0.65, 0.8, 0.9];

let poses = [];
let hands = [];
let slider =[0, 0, 0, 0];
let values = []; 

function poseDetection(){
  // Start the pose detection for body and hands
  bodyPose.detectStart(video, gotPoses);
  handPose.detectStart(video, gotHands);
}

function drawKeypoints(trackedKeypoints){
  // Draw the keypoints for each tracked hand or body pose
 for (let i = 0; i < trackedKeypoints.length; i++) {
    let trackedKeypoint = trackedKeypoints[i];
    for (let j = 0; j < trackedKeypoint.keypoints.length; j++) {
      let keypoint = trackedKeypoint.keypoints[j];
      
      fill(0, 255, 0);
      noStroke();
      circle(width - keypoint.x, keypoint.y, 10); 
    }
  }
}

function isPointing(hand) {
  // Check if the index finger is extended and the other fingers are folded
  let indexExtended = hand.keypoints[8].y < hand.keypoints[5].y;
  let middleFolded = hand.keypoints[12].y > hand.keypoints[9].y;
  let ringFolded = hand.keypoints[16].y > hand.keypoints[13].y;
  let pinkyFolded = hand.keypoints[20].y > hand.keypoints[17].y;

  return indexExtended && middleFolded && ringFolded && pinkyFolded;
}

function updateSlider(){
  // Update the slider values based on the position of the index finger of each hand
  for (let hand of hands) {
    let indexFinger = hand.keypoints[8];

    if (poses.length > 0) {
      let pose = poses[0];
      let points = [pose.keypoints[1], pose.keypoints[2], pose.keypoints[5], pose.keypoints[6]];

      // check if the hand and body is in the same zone
      let bodyCenter = (pose.keypoints[5].x + pose.keypoints[6].x) / 2;
      let handZone = Math.floor(indexFinger.x / (width / 4));
      let bodyZone = Math.floor(bodyCenter / (width / 4));
      if (handZone !== bodyZone) {
        continue;
      }
      
      // check if the keypoints are detected and if the index finger is between the eyes and shoulders 
      // and update the slider value accordingly
      if (points.every(point => point.confidence > 0.1)) {
        let eyes = (pose.keypoints[1].y + pose.keypoints[2].y) / 2;
        let shoulders = (pose.keypoints[5].y + pose.keypoints[6].y) / 2;

        if(indexFinger.y > eyes && indexFinger.y < shoulders){ 
          slider[handZone] = Math.round(((indexFinger.y - shoulders) / (eyes - shoulders)) * 100); 
          console.log("0: "+ slider[0] + "%   1: "+ slider[1] + "%   2: "+ slider[2] + "%    3: "+ slider[3] + "%");
        }
      }
    }
  }
}

function drawContours(){
  // Draw the contours based on the video feed and the slider values
  lowRes.image(video, 0, 0, cols, rows); 
  lowRes.loadPixels();
  if (lowRes.pixels.length === 0) return;

  for (let i = 0; i < cols * rows; i++) {
    const p = i * 4;
    const b = (lowRes.pixels[p] + lowRes.pixels[p + 1] + lowRes.pixels[p + 2]) / 3;
    const v = constrain((b - 40) / 180, 0, 1);
    values[i] = lerp(values[i] ?? v, v, 0.4);
  }
  
  // Generate the contours 
  const silhouettes = d3.contours()
    .size([cols, rows])
    .thresholds(brightness)(values);

  drawingContext.save();
  drawingContext.translate(width, 0);
  drawingContext.scale(-width / cols, height / rows);
  
  // Draw each silhouette with the corresponding color
  silhouettes.forEach((silhouette, i) => {
    drawingContext.fillStyle = colors[i];
    drawingContext.beginPath();
    path(silhouette);
    drawingContext.fill();
  });
  drawingContext.restore();
}

function gotPoses(results) {
  // Callback for body pose detection results
  poses = results;
}

function gotHands(results) {
  // Callback for hand pose detection results
  hands = results;
}

