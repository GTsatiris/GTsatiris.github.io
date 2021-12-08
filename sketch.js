let video;
let poseNet;
let poses = [];
let canvas;
let switchFlag = false;
let keypointIndexes = [9, 10, 15, 16];
let level = 0;
let modelIsReady = false;

//Level points defined in 320x240
let levelPointsX = [
  [41, 165, 72, 260],
  [3, 54, 151, 28],
  [63, 68, 59, 27]
];
let levelPointsY = [
  [11, 98, 65, 219],
  [159, 37, 3, 185],
  [206, 169, 30, 83]
];

function translateX(old_x) {
  return (old_x * windowWidth)/video.width;
}

function translateY(old_y) {
  return (old_y * windowHeight)/video.height;
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
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  if(modelIsReady)
  {
    drawLevelPoints();
    drawKeypoints();
  }
  //drawSkeleton();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i += 1) {
    // For each pose detected, loop through all the keypoints
    const pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j += 1) {
      if(!keypointIndexes.includes(j))
        continue;

      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      const keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(255, 0, 0);
        noStroke();
        ellipse(translateX(keypoint.position.x), translateY(keypoint.position.y), 50, 50);
      }
    }
  }
}

function drawLevelPoints() {
  for (let i = 0; i < 4; i++) {
    fill(0, 255, 0);
    noStroke();
    ellipse(translateX(levelPointsX[level][i]), translateY(levelPointsY[level][i]), 70, 70);
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i += 1) {
    const skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j += 1) {
      const partA = skeleton[j][0];
      const partB = skeleton[j][1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}