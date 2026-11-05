const WIDTH = 1300;
const HEIGHT = 800;
const cols = 64;  
let rows;
let video;
let lowRes;        
let path;
let options = {maxHands: 8, flipped: false, runtime: "mediapipe", modelType: "full"}; //a maximum of 8 hands can be detected, one for each person in the frame. 

function preload() { 
  // Load the bodyPose and handPose models
  bodyPose = ml5.bodyPose();
  handPose = ml5.handPose(options); 
}

function setup() {
  // Create a canvas and set up the video capture
  createCanvas(WIDTH, HEIGHT);
  pixelDensity(1);
  rows = round(cols * HEIGHT / WIDTH);

  video = createCapture({
    video: { width: WIDTH, height: HEIGHT },
    audio: false
  });
  video.size(WIDTH, HEIGHT);          
  video.hide();

  lowRes = createGraphics(cols, rows); 
  lowRes.pixelDensity(1);
  path = d3.geoPath(null, drawingContext);

  // Start the pose detection
  poseDetection();                          
}

function draw() {
  // Set the background color and draw the contours for the video feed
  background('#3627a3'); 
  drawContours(); 

  // Divide the canvas into 4 zones
  stroke(255);
  strokeWeight(1);
  line(WIDTH / 2, 0, WIDTH / 2, HEIGHT);
  line(WIDTH / 4, 0, WIDTH / 4, HEIGHT);
  line(3 * WIDTH / 4, 0, 3 * WIDTH / 4, HEIGHT);

  // Draw the keypoints for the detected hands and body poses
  drawKeypoints(hands);
  drawKeypoints(poses);

  // Check if the hands are pointing and update the slider values accordingly
  for (let hand of hands) {
    if (isPointing(hand)) {
      updateSlider();
    }
  }
}