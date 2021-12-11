let video;
let poseNet;
let poses = [];
let currentPose;
let canvas;
let fontFuzzyBubbles;
let fontFuzzyBubblesBOLD;

let switchFlag = false;
let keypointIndexes = [9, 10, 15, 16];
let level = 0;
let modelIsReady = false;
let hasPose = false;

let tolerance = 50;
let windowSize = 10;
let levelChecks = [false, false, false];

let rWrist;
let lWrist;
let rAnkle;
let lAnkle;

let windowRWRIST = [];
let windowRANKLE = [];
let windowLWRIST = [];
let windowLANKLE = [];

//Level points defined in 320x240
let levelPoints = [
  [{x:165, y:37}, {x:72, y:30}, {x:260, y:185}],
  [{x:3, y:11}, {x:151, y:65}, {x:28, y:219}],
  [{x:63, y:206}, {x:68, y:169}, {x:27, y:83}]
];

function translateToNewDim(point) {
  var p = {x:0, y:0};
  p.x = (point.x * windowWidth)/video.width;
  p.y = (point.y * windowHeight)/video.height;
  return p;
}

function centerCanvas() {
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  canvas.position(x, y);
}

function switchCamera()
{
  switchFlag = !switchFlag;
  stopCapture();
  if(switchFlag==true)
  {
    video.remove();
    options = {
      video: {
        facingMode: {
          exact: "environment"
        }
      }
    };

  }
  else
  {
    video.remove();
    options = {
      video: {
        facingMode: {
          exact: "user"
        }
      }
    };
  }
  video = createCapture(options);
}

function preload() {
  fontFuzzyBubbles = loadFont('assets/fonts/FuzzyBubbles-Regular.ttf');
  fontFuzzyBubblesBOLD = loadFont('assets/fonts/FuzzyBubbles-Bold.ttf');
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  centerCanvas();
  // canvas.center('horizontal');
  // canvas.center('vertical');
  video = createCapture(VIDEO);
  // var constraints = {
  //   video: {
  //     facingMode: {
  //       exact: "environment"
  //     }
  //   }    
  //   //video: {
  //     //facingMode: "user"
  //   //} 
  // };
  // video = createCapture(constraints);
  video.size(320, 240);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on("pose", function(results) {
    poses = results;
    currentPose = poses[0];
    if (typeof currentPose !== 'undefined') {
      if (typeof currentPose.pose !== 'undefined') {
        hasPose = true;
      }
      else
      {
        hasPose = false;
      }
    }
    else
    {
      hasPose = false;
    }
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

function modelReady() {
  modelIsReady = true;
  console.log("Model Ready");
}

function deviceTurned() {
  resizeCanvas(windowWidth, windowHeight);
  centerCanvas();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  centerCanvas();
} 

function draw() {
  push();  
  background(50);

  translate(width,0);
  scale(-1, 1);
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  if(modelIsReady && hasPose)
  {    
    updateKeypoints();

    smoothAndTranslate();

    drawLevelPoints();

    drawKeypoints();

    for (let i = 0; i < 3; i++) {
      checkPointI(i);
    }

    if(levelChecks[0] && levelChecks[1] && levelChecks[2])
    {
      if(level < 2){
        level++;
      }
      else
      {
        level = 0;
      }
    }
  }
  pop();
  
  textFont(fontFuzzyBubblesBOLD);
  textSize(windowHeight/12);
  strokeWeight(10);
  stroke(51);
  fill(255, 255, 255);
  text('Level ' + (level + 1), 10, 80);
  
}

function updateKeypoints() {
  rWrist = currentPose.pose.rightWrist;
  lWrist = currentPose.pose.leftWrist;
  rAnkle = currentPose.pose.rightAnkle;
  lAnkle = currentPose.pose.leftAnkle;
}

function smoothAndTranslate() {
  rWrist = translateToNewDim(rWrist);
  lWrist = translateToNewDim(lWrist);
  rAnkle = translateToNewDim(rAnkle);
  lAnkle = translateToNewDim(lAnkle);

  rWrist = avgRWRIST(rWrist);
  lWrist = avgLWRIST(lWrist);
  rAnkle = avgRANKLE(rAnkle);
  lAnkle = avgLANKLE(lAnkle);
}

function drawKeypoints() {
  fill(255, 0, 0);
  noStroke();
  ellipse(rWrist.x, rWrist.y, 50, 50);

  fill(255, 0, 0);
  noStroke();
  ellipse(rAnkle.x, rAnkle.y, 50, 50);

  fill(255, 0, 0);
  noStroke();
  ellipse(lWrist.x, lWrist.y, 50, 50);

  fill(255, 0, 0);
  noStroke();
  ellipse(lAnkle.x, lAnkle.y, 50, 50);
}

function avgRWRIST(x) {
  // the first time this runs we add the current x to the array n number of times
  if (windowRWRIST.length < 1) {
      console.log('this should only run once');
      for (let i = 0; i < windowSize; i++) {
          windowRWRIST.push(x);
      }
  // if the number of frames to average is increased, add more to the array
  } else if (windowRWRIST.length < windowSize) {
      console.log('adding more xs');
      const moreXs = windowSize - windowRWRIST.length;
      for (let i = 0; i < moreXs; i++) {
          windowRWRIST.push(x);
      }
  // otherwise update only the most recent number
  } else {
      windowRWRIST.shift(); // removes first item from array
      windowRWRIST.push(x); // adds new x to end of array
  }

  let sum_X = 0;
  let sum_Y = 0;
  for (let i = 0; i < windowRWRIST.length; i++) {
    sum_X += windowRWRIST[i].x;
    sum_Y += windowRWRIST[i].y;
  }

  let point = {};
  
  point.x = sum_X / windowRWRIST.length;
  point.y = sum_Y / windowRWRIST.length;

  // return the average x value 
  return point;
}

function avgRANKLE(x) {
  // the first time this runs we add the current x to the array n number of times
  if (windowRANKLE.length < 1) {
      console.log('this should only run once');
      for (let i = 0; i < windowSize; i++) {
          windowRANKLE.push(x);
      }
  // if the number of frames to average is increased, add more to the array
  } else if (windowRANKLE.length < windowSize) {
      console.log('adding more xs');
      const moreXs = windowSize - windowRANKLE.length;
      for (let i = 0; i < moreXs; i++) {
          windowRANKLE.push(x);
      }
  // otherwise update only the most recent number
  } else {
      windowRANKLE.shift(); // removes first item from array
      windowRANKLE.push(x); // adds new x to end of array
  }

  let sum_X = 0;
  let sum_Y = 0;
  for (let i = 0; i < windowRANKLE.length; i++) {
    sum_X += windowRANKLE[i].x;
    sum_Y += windowRANKLE[i].y;
  }

  let point = {};
  
  point.x = sum_X / windowRANKLE.length;
  point.y = sum_Y / windowRANKLE.length;

  // return the average x value 
  return point;
}

function avgLWRIST(x) {
  // the first time this runs we add the current x to the array n number of times
  if (windowLWRIST.length < 1) {
      console.log('this should only run once');
      for (let i = 0; i < windowSize; i++) {
          windowLWRIST.push(x);
      }
  // if the number of frames to average is increased, add more to the array
  } else if (windowLWRIST.length < windowSize) {
      console.log('adding more xs');
      const moreXs = windowSize - windowLWRIST.length;
      for (let i = 0; i < moreXs; i++) {
          windowLWRIST.push(x);
      }
  // otherwise update only the most recent number
  } else {
      windowLWRIST.shift(); // removes first item from array
      windowLWRIST.push(x); // adds new x to end of array
  }

  let sum_X = 0;
  let sum_Y = 0;
  for (let i = 0; i < windowLWRIST.length; i++) {
    sum_X += windowLWRIST[i].x;
    sum_Y += windowLWRIST[i].y;
  }

  let point = {};
  
  point.x = sum_X / windowLWRIST.length;
  point.y = sum_Y / windowLWRIST.length;

  // return the average x value 
  return point;
}

function avgLANKLE(x) {
  // the first time this runs we add the current x to the array n number of times
  if (windowLANKLE.length < 1) {
      console.log('this should only run once');
      for (let i = 0; i < windowSize; i++) {
          windowLANKLE.push(x);
      }
  // if the number of frames to average is increased, add more to the array
  } else if (windowLANKLE.length < windowSize) {
      console.log('adding more xs');
      const moreXs = windowSize - windowLANKLE.length;
      for (let i = 0; i < moreXs; i++) {
          windowLANKLE.push(x);
      }
  // otherwise update only the most recent number
  } else {
      windowLANKLE.shift(); // removes first item from array
      windowLANKLE.push(x); // adds new x to end of array
  }

  let sum_X = 0;
  let sum_Y = 0;
  for (let i = 0; i < windowLANKLE.length; i++) {
    sum_X += windowLANKLE[i].x;
    sum_Y += windowLANKLE[i].y;
  }

  let point = {};
  
  point.x = sum_X / windowLANKLE.length;
  point.y = sum_Y / windowLANKLE.length;

  // return the average x value 
  return point;
}

function distance(a, b) {
  var dx = a.x - b.x;
	var dy = a.y - b.y;
	return Math.sqrt(dx*dx + dy*dy);
}

function drawLevelPoints() {
  for (let i = 0; i < 3; i++) {
    var trans_p = translateToNewDim(levelPoints[level][i]);
    if(levelChecks[i]) {
      fill(0, 255, 0);
      noStroke();
      ellipse(trans_p.x, trans_p.y, 70, 70);
    }
    else {
      fill(255, 255, 0);
      noStroke();
      ellipse(trans_p.x, trans_p.y, 90, 90);
    }
  }
}

function checkPointI(idx) {
  var trans_p = translateToNewDim(levelPoints[level][idx]);
  levelChecks[idx] = ((distance(trans_p, rWrist) < tolerance) || (distance(trans_p, lWrist) < tolerance) || (distance(trans_p, rAnkle) < tolerance) || (distance(trans_p, lAnkle) < tolerance));
}