const WIDTH = 1300;
const HEIGHT = 800;
const cols = 64;  
const bgMusic = new Audio('music/gbMusic.mp3');
const beat1 = new Audio('newMusic/rave5.mp3');
const beat2 = new Audio('newMusic/rave0.mp3');
const beat3 = new Audio('newMusic/rave3.mp3');
const beat4 = new Audio('newMusic/rave4.mp3');

const COLORS = [255, 234, 41, 14];
let soundEffects = [beat1, beat2, beat3, beat4]; //array of sound effects for each zone
let rows;
let video;
let lowRes;        
let path;
let angle = 0;
let options = {maxHands: 8, flipped: false, runtime: "mediapipe", modelType: "full"}; //a maximum of 8 hands can be detected, one for each person in the frame. 
let lastZone = -1;
let zoneOn = [false, false, false, false]; // utanför draw(), minns varje zons status
let ws = new WebSocket("ws://10.0.0.100:8080");
let L = (n, v) => ws.readyState == 1 && ws.send(JSON.stringify({type: "take", lights: [n], values: v}));

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

  // Soundeffects start at volume 0
  for (let i = 0; i < soundEffects.length; i++) {
    soundEffects[i].loop = true;
    soundEffects[i].play();
    soundEffects[i].volume = 0;
  }

  // Start the pose detection
  poseDetection();                          
}

function draw() {
  // Set the background color and draw the contours for the video feed
  background('#3627a3'); 
    drawContours(); 

    L('Profile 21', { 
        pan: 0.6545,
        tilt: 0.4445, 
        dimmer: 255, 
        sat: 1,
        hue: COLORS[1],
        });

  // Divide the canvas into 4 zones
  stroke('#ffd21f');
  strokeWeight(2);
  line(WIDTH / 2, 0, WIDTH / 2, HEIGHT);
  line(WIDTH / 4, 0, WIDTH / 4, HEIGHT);
  line(3 * WIDTH / 4, 0, 3 * WIDTH / 4, HEIGHT);

  // Draw the keypoints for the detected hands and body poses
  drawKeypoint(poses);
  drawKeypoint(hands);

  for (let pose of poses) {
    let bodyCenter = (getKeypoint(pose, 'left_shoulder').x + getKeypoint(pose, 'right_shoulder').x) / 2;
    let bodyZone = Math.floor(bodyCenter / (width / 4));

    for (let hand of hands) {
      let indexFinger = getKeypoint(hand, 'index_finger_tip');
      let handZone = Math.floor(indexFinger.x / (width / 4));

      //change handsigns to sound effects
      if (isRockSign(hand)) {

        const index = Math.floor(Date.now() / 150) % colors.length; 
        L('Profile 21', { 
          dimmer: 255, 
          hue: COLORS[index], 
          sat: 1,
          focus: 77,
          gobo: 4, 
        });
      } else {
         L('Profile 21', { 
          hue: COLORS[1],
          gobo: 0, 
        });
      }

      if(isPeaceSign(hand)){

      }

      if (isPointing(hand) && handZone == bodyZone) {
        updateSlider(hand, pose, handZone);
      }
    }
    let occupied = [false, false, false, false];

    for (let pose of poses) {   // byt "poses" mot din egen array
      // räkna ut zonen för just den här personen, t.ex. från nosens x-position
      let x = pose.nose.x;
      let zone = floor(x / (width / 4));   // delar bredden i 4 zoner
      if (zone >= 0 && zone <= 3) {
          occupied[zone] = true;
      }
    }

    for (let z = 0; z < 4; z++) {
      if (occupied[z] !== zoneOn[z]) {
          soundToggle(z, occupied[z] ? 50 : 0);
          zoneOn[z] = occupied[z];
      }
    }
  }
}