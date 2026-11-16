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

function drawKeypoint(trackedKeypoints){
  // Draw the keypoints for each tracked hand and body pose
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
  // return true if hand is pointing
  // compares the y value of fingertips the base of the finger  
  let indexExtended = getKeypoint(hand, 'index_finger_tip').y < getKeypoint(hand, 'index_finger_mcp').y;
  let middleFolded = getKeypoint(hand, 'middle_finger_tip').y > getKeypoint(hand, 'middle_finger_mcp').y;
  let ringFolded = getKeypoint(hand, 'ring_finger_tip').y > getKeypoint(hand, 'ring_finger_mcp').y;
  let pinkyFolded = getKeypoint(hand, 'pinky_finger_tip').y > getKeypoint(hand, 'pinky_finger_mcp').y;
  return indexExtended && middleFolded && ringFolded && pinkyFolded;
}

function isRockSign(hand) {
  let indexExtended = getKeypoint(hand, 'index_finger_tip').y < getKeypoint(hand, 'index_finger_mcp').y;
  let middleFolded = getKeypoint(hand, 'middle_finger_tip').y > getKeypoint(hand, 'middle_finger_mcp').y;
  let ringFolded = getKeypoint(hand, 'ring_finger_tip').y > getKeypoint(hand, 'ring_finger_mcp').y;
  let pinkyExtended = getKeypoint(hand, 'pinky_finger_tip').y < getKeypoint(hand, 'pinky_finger_mcp').y;
 return indexExtended && middleFolded && ringFolded && pinkyExtended;
}

function updateSlider(hand, pose, zone){
  let indexFinger = getKeypoint(hand, 'index_finger_tip');
  let eyes = (getKeypoint(pose, 'left_eye').y + getKeypoint(pose, 'right_eye').y)/2;
  let shoulders = (getKeypoint(pose, 'left_shoulder').y + getKeypoint(pose, 'right_shoulder').y)/2;
  // check if the keypoints are detected and if the index finger is between the eyes and shoulders 
  // and update the slider value accordingly

  if(indexFinger.y > eyes && indexFinger.y < shoulders){ 
    slider[zone] = Math.round(((indexFinger.y - shoulders) / (eyes - shoulders)) * 100); 
    console.log("0: "+ slider[0] + "%   1: "+ slider[1] + "%   2: "+ slider[2] + "%    3: "+ slider[3] + "%");
  }
  soundToggle(zone, slider[zone]); 
}


function soundToggle(index, value) {
  soundEffects[index].volume = value/100;
}
function getKeypoint(pose, name) {
  return pose.keypoints.find(k => k.name === name);
}

function gotPoses(results) {poses = results;}
function gotHands(results) {hands = results;}

// The filters code starts here
function drawContours(){
  // Draws the contours based on the video feed and makes it less detailed 
  lowRes.image(video, 0, 0, cols, rows); 
  lowRes.loadPixels();
  if (lowRes.pixels.length === 0) return;

  // Calculate brightness value for every point, b is the brightness
  for (let i = 0; i < cols * rows; i++) {
    const p = i * 4;
    const b = (lowRes.pixels[p] + lowRes.pixels[p + 1] + lowRes.pixels[p + 2]) / 3;
    const v = constrain((b - 40) / 180, 0, 1);
    values[i] = v;
  }
  
  // Lets d3 generate a smooth outline for each layer
  const silhouettes = d3.contours().size([cols, rows]).thresholds(brightness)(values);

  // Saves the settings, mirrorreverse the image and moves the image back in the right place after the mirrorreversing
  drawingContext.save();
  drawingContext.translate(width, 0);
  drawingContext.scale(-width / cols, height / rows);
  
  // Draw each silhouette with the corresponding color for brightness and restores the canvas for the next frame
  silhouettes.forEach((silhouette, i) => {
    drawingContext.fillStyle = colors[i];
    drawingContext.beginPath();
    path(silhouette);
    drawingContext.fill();
  });
  drawingContext.restore();
}
