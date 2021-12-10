let video;
let poseNet;
let poses = [];
let currentPose;
let canvas;
let switchFlag = false;
let keypointIndexes = [9, 10, 15, 16];
let level = 0;
let modelIsReady = false;
let hasPose = false;

let tolerance = 50;
let windowSize = 10;
let levelChecks = [false, false, false];
let frameWindow = [];
let frameKeypoints = [{x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0}];

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
  //console.log(video.width);
  //console.log(video.height);

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
    // updateKeypoints();
    // frameWindow.push(frameKeypoints);
    // if(frameWindow.length > windowSize)
    // {
    //   frameWindow.shift();
    // }
    //console.log(poses);
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

  translate(width,0);
  scale(-1, 1);
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  if(modelIsReady && hasPose)
  {
    updateKeypoints();

    smoothAndTranslate();

    drawLevelPoints();
    
    //updateKeypoints();
    
    // console.log("PUSHING!!");
    // console.log(frameKeypoints);
    // frameWindow.push(frameKeypoints);
    // if(frameWindow.length > windowSize)
    // {
    //   console.log("POPPING!!");
    //   console.log(frameWindow.pop());
      
    // }

    drawKeypoints();

    

    //WORKING CODE ***************************************************
    // drawKeypoints();

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
  //drawSkeleton();
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

// A function to draw ellipses over the detected keypoints
function updateKeypoints_OLD() {
  pCounter++;
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i += 1) {
    // For each pose detected, loop through all the keypoints
    const pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j += 1) {

      if(!keypointIndexes.includes(j)) {
        continue;
      }

      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      const keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.5) {
        //console.log(keypoint.score);
        // for (let i = 0; i < 4; i++) {
        //   if(distance(translateX(keypoint.position.x), translateY(keypoint.position.y), translateX(levelPointsX[level][i]), translateY(levelPointsY[level][i])) < 50) {
        //     levelChecks[i] = true;
        //   }
        //   else {
        //     levelChecks[i] = false;
        //   }
        // // }
        if(j == 9)
        {
          frameKeypoints[0].x = keypoint.position.x;
          frameKeypoints[0].y = keypoint.position.y;
        }
        if(j == 10)
        {
          frameKeypoints[1].x = keypoint.position.x;
          frameKeypoints[1].y = keypoint.position.y;
        }
        if(j == 15)
        {
          frameKeypoints[2].x = keypoint.position.x;
          frameKeypoints[2].y = keypoint.position.y;
        }
        if(j == 16)
        {
          frameKeypoints[3].x = keypoint.position.x;
          frameKeypoints[3].y = keypoint.position.y;
        }
        // fill(255, 0, 0);
        // noStroke();
        // var new_p = translateToNewDim(keypoint.position);
        // ellipse(new_p.x, new_p.y, 50, 50);
      }
    }
  }
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

function drawKeypoints_OLD() {
  for (let i = 0; i < 4; i++) {
    fill(255, 0, 0);
    noStroke();
    //var new_p = translateToNewDim(getSmoothedJoint(i));
    var cleaned =getSmoothedJointAVG(i);
    var new_p = translateToNewDim(cleaned);
    //var new_p = translateToNewDim(frameKeypoints[i]);
    ellipse(new_p.x, new_p.y, 50, 50);
  }
}

function getSmoothedJointAVG(idx) {
  var p = {x:0, y:0};
  var sum_x = 0;
  var sum_y = 0;
  for (let i = 0; i < frameWindow.length; i++) {
    sum_x = sum_x + frameWindow[i][idx].x;
    sum_y = sum_y + frameWindow[i][idx].y;
  }
  p.x = sum_x / frameWindow.length;
  p.y = sum_y / frameWindow.length;
  return p;
}

function getSmoothedJoint(idx) {
  console.log("START SMOOTHER");
  var p = {x:0, y:0};
  var sum_x = 0;
  var sum_y = 0;
  var exis = [];
  var whys = [];
  for (let i = 0; i < frameWindow.length; i++) {
    exis.push(frameWindow[i][idx].x);
    whys.push(frameWindow[i][idx].y);
  }
  console.log("EXIS: ");
  console.log(exis);
  console.log("WHYS: ");
  console.log(whys);
  exis.sort(function(a, b){return a - b});
  whys.sort(function(a, b){return a - b});
  exis.pop();
  exis.shift();
  exis.pop();
  exis.shift();
  exis.pop();
  exis.shift();
  exis.pop();
  exis.shift();
  exis.pop();
  exis.shift();
  whys.pop();
  whys.shift();
  whys.pop();
  whys.shift();
  whys.pop();
  whys.shift();
  whys.pop();
  whys.shift();
  whys.pop();
  whys.shift();
  console.log("NEW EXIS: ");
  console.log(exis);
  console.log("NEW WHYS: ");
  console.log(whys);
  for (let i = 0; i < exis.length; i++) {
    sum_x = sum_x + exis[i];
  }
  for (let i = 0; i < whys.length; i++) {
    sum_y = sum_y + whys[i];
  }
  p.x = sum_x / exis.length;
  p.y = sum_y / whys.length;
  console.log("END SMOOTHER");
  return p;
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

// A function to draw the skeletons
// function drawSkeleton() {
//   // Loop through all the skeletons detected
//   for (let i = 0; i < poses.length; i += 1) {
//     const skeleton = poses[i].skeleton;
//     // For every skeleton, loop through all body connections
//     for (let j = 0; j < skeleton.length; j += 1) {
//       const partA = skeleton[j][0];
//       const partB = skeleton[j][1];
//       stroke(255, 0, 0);
//       line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
//     }
//   }
// }