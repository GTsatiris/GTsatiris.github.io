let video;
let detector;
let poseNet;
let poses;
let currentPose;
let canvas;
let fontFuzzyBubbles;
let fontFuzzyBubblesBOLD;
let loadingImg;
let rotationAngle;

let startTimer;
let pauseTimer;
let pauseInterval;
let totalPauseInterval;
let resetTime;
let resetPauseTime;

let foundFirstPose;
let switchFlag = false;
// let keypointIndexes = [9, 10, 15, 16];
let modelIsReady = false;
let hasPose = false;
let videoIsReady = false;

let minConf = 0.3;
let tolerance = 50;
let windowSize = 10;
// let levelChecks = [false, false, false];

// let rWrist;
// let lWrist;
// let rAnkle;
// let lAnkle;

// let windowRWRIST = [];
// let windowRANKLE = [];
// let windowLWRIST = [];
// let windowLANKLE = [];

// window.state = {
//   model: false,
//   levels: false,
//   video: false
// }

let windows = new Array(17);
let currentJoints = new Array(17);

//Level points defined in 320x240
// let levelPoints = [
//   [{x:165, y:37}, {x:72, y:30}, {x:260, y:185}],
//   [{x:3, y:11}, {x:151, y:65}, {x:28, y:219}],
//   [{x:63, y:206}, {x:68, y:169}, {x:27, y:83}]
// ];

function translateToNewDim(point) {
  var p = {x:0, y:0, score:0.0};
  p.x = (point.x * windowWidth)/video.width;
  p.y = (point.y * windowHeight)/video.height;
  p.score = point.score;
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

async function initialize() {
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
  // detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER});
  modelIsReady = true;
}

async function videoReady() {
  videoIsReady = true;
  await getPoses();
}

async function getPoses() {
  if(modelIsReady)
  {
    poses = await detector.estimatePoses(video.elt);
    currentPose = poses[0];
    if (typeof currentPose !== 'undefined') {
      if (typeof currentPose.keypoints !== 'undefined') {
        hasPose = true;
        updateKeypoints();
        smoothAndTranslate();
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
  }
  setTimeout(getPoses, 0);
}

async function preload() {
  fontFuzzyBubbles = loadFont('assets/fonts/FuzzyBubbles-Regular.ttf');
  fontFuzzyBubblesBOLD = loadFont('assets/fonts/FuzzyBubbles-Bold.ttf');
  loadingImg = loadImage('assets/img/1544764567.png');
  levelsReady = false;
  loadStandardLevels();
  for (var i = 0; i < windows.length; i++) {
    windows[i] = [];
  }
  
  await initialize();
}

function setup() {
  foundFirstPose = false;
  resetTime = true;
  resetPauseTime = true;
  pauseInterval = 0;
  totalPauseInterval = 0;
  rotationAngle = 0;
  let params = new URLSearchParams(location.search);
  currentLevel = parseInt(params.get('lvl'));
  currLvlData = levelData[currentLevel];

  canvas = createCanvas(windowWidth, windowHeight);
  centerCanvas();
  // canvas.center('horizontal');
  // canvas.center('vertical');

  video = createCapture(VIDEO, videoReady);
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
  video.size(640, 480);

  video.hide();
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
  // window.state.model = modelIsReady;
  // window.state.levels = levelsReady;
  // window.state.video = videoIsReady;
  if(modelIsReady && levelsReady && videoIsReady)
  {
    frameRate(30);

    push();  
    background(50);

    translate(width,0);
    scale(-1, 1);
    image(video, 0, 0, width, height);

    drawLevelPoints();

    if(hasPose)
    {
      foundFirstPose = true;

      if(resetTime)
      {
        resetTime = false;
        startTimer = millis();
      }

      drawKeypoints();

      checkPoints();
      checkProgress();

      if(canProgress)
      {
        //if(currentLevel < 2){
        if(currentLevel < 3){
          currentLevel++;
          canProgress = false;
          resetTime = true;
          currLvlData = levelData[currentLevel];
        }
        else
        {
          currentLevel = 0;
          canProgress = false;
          resetTime = true;
          currLvlData = levelData[currentLevel];
        }
      }
    }
    pop();
    
    let millisec;

    textFont(fontFuzzyBubblesBOLD);
    textSize(windowHeight/12);
    strokeWeight(windowHeight/120);
    stroke(51);
    
    if(!hasPose)
    {
      if(foundFirstPose)
      {
        if(resetPauseTime)
        {
          resetPauseTime = false;
          pauseTimer = millis();
        }
        pauseInterval = millis() - pauseTimer;
      }
      push();
      fill(255, 0, 0);
      textAlign(CENTER, CENTER);
      text('NO POSE DETECTED!', windowWidth/2.0, windowHeight/2.0);
      pop()
    }
    else
    {
      resetPauseTime = true;
      totalPauseInterval += pauseInterval;
      pauseInterval = 0;
      // milliSec = millisToMinAndSec(millis() - startTimer);
      milliSec = msToTime(millis() - startTimer - totalPauseInterval);
    }
    fill(255, 255, 255);
    text('Level ' + (currentLevel + 1), 10, 80);

    
    if((startTimer != null) && (milliSec != null))
    {
      text(milliSec, windowWidth*0.75, 80);
    }
    
  }
  else
  {
    try {
      Print.postMessage("Model: " + modelIsReady);
      Print.postMessage("Levels: " + levelsReady);
      Print.postMessage("Video: " + videoIsReady);
    } catch (error) {
      console.log("Model:" + modelIsReady);
      console.log("Levels:" + levelsReady);
      console.log("Video:" + videoIsReady);
    }
    push();
    frameRate(4);
    background('#111');
    translate(width / 2, height / 2);

    rotate(rotationAngle * 30 * PI/180);
    rotationAngle = rotationAngle + 1;
    imageMode(CENTER);
    image(loadingImg, 0, 0, 150, 150);
    pop();
  }
}

function updateKeypoints() {
  for(var i = 0; i < currLvlData.jointNum; i++)
  {
    var jointIdx = currLvlData.trackedJoins[i];
    if(currentPose.keypoints[jointIdx].score > minConf)
    {
      currentJoints[jointIdx] = currentPose.keypoints[jointIdx];
    }
    else
    {
      currentJoints[jointIdx] = {x : video.width/2.0, y : video.height/2.0, score : currentPose.keypoints[jointIdx].score};
    }
  }
}

function smoothAndTranslate() {
  for(var i = 0; i < currLvlData.jointNum; i++)
  {
    var jointIdx = currLvlData.trackedJoins[i];
    currentJoints[jointIdx] = translateToNewDim(currentJoints[jointIdx]);
    currentJoints[jointIdx] = avgFiltering(currentJoints[jointIdx], jointIdx);
  }
}

function drawKeypoints() {
  for(var i = 0; i < currLvlData.jointNum; i++)
  {
    var jointIdx = currLvlData.trackedJoins[i];
    if(currentJoints[jointIdx].score < minConf)
    {
      continue;
    }
    if(currLvlData.jointSpecific)
    {
      for(var j = 0; j < currLvlData.markerNum; j++)
      {
        if(jointIdx == currLvlData.jointMapping[j].jointID)
        {
          var color = currLvlData.jointMapping[j].jointColor;
          fill(color.R, color.G, color.B);
          break;
        }
      }
    }
    else
    {
      fill(255, 0, 0);
    }
    noStroke();
    ellipse(currentJoints[jointIdx].x, currentJoints[jointIdx].y, 50, 50);
  }
}

function avgFiltering(src, idx) {
  // the first time this runs we add the current x to the array n number of times
  if (windows[idx].length < 1) {
    console.log('this should only run once');
    for (let i = 0; i < windowSize; i++) {
      windows[idx].push(src);
    }
  // if the number of frames to average is increased, add more to the array
  }
  else if (windows[idx].length < windowSize) {
    console.log('adding more xs');
    const moreXs = windowSize - windows[idx].length;
    for (let i = 0; i < moreXs; i++) {
      windows[idx].push(src);
  }
  // otherwise update only the most recent number
  } else {
    windows[idx].shift(); // removes first item from array
    windows[idx].push(src); // adds new x to end of array
  }

  let sum_X = 0;
  let sum_Y = 0;
  let sum_Score = 0.0;
  for (let i = 0; i < windows[idx].length; i++) {
    sum_X += windows[idx][i].x;
    sum_Y += windows[idx][i].y;
    sum_Score += windows[idx][i].score;
  }

  let point = {};
  
  point.x = sum_X / windows[idx].length;
  point.y = sum_Y / windows[idx].length;
  point.score = sum_Score / windows[idx].length;

  // return the average x value 
  return point;
}

function distance(a, b) {
  var dx = a.x - b.x;
	var dy = a.y - b.y;
	return Math.sqrt(dx*dx + dy*dy);
}

function drawLevelPoints() {
  for (let i = 0; i < currLvlData.markerNum; i++) {
    var trans_p = translateToNewDim(currLvlData.markerPos[i]);
    if(currLvlData.markerChecks[i]) {
      if(currLvlData.jointSpecific)
      {
        var color = currLvlData.jointMapping[i].jointColor;
        fill(color.R, color.G, color.B);
      }
      else
      {
        fill(0, 255, 0);
      }
      noStroke();
      ellipse(trans_p.x, trans_p.y, 70, 70);
    }
    else {
      if(currLvlData.jointSpecific)
      {
        var color = currLvlData.jointMapping[i].jointColor;
        fill(color.R, color.G, color.B);
      }
      else
      {
        fill(255, 255, 0);
      }
      noStroke();
      ellipse(trans_p.x, trans_p.y, 90, 90);
    }
  }
}

// function checkPointI(idx) {
//   var trans_p = translateToNewDim(levelPoints[currentLevel][idx]);
//   levelChecks[idx] = ((distance(trans_p, rWrist) < tolerance) || (distance(trans_p, lWrist) < tolerance) || (distance(trans_p, rAnkle) < tolerance) || (distance(trans_p, lAnkle) < tolerance));
// }

function checkPoints() {
  for (let i = 0; i < currLvlData.markerNum; i++) {
    
    var trans_p = translateToNewDim(currLvlData.markerPos[i]);
    
    currLvlData.markerChecks[i] = false;
    let correctOrder = false;

    // if(currLvlData.orderSpecific)
    // {
    //   //TODO
    //   correctOrder = true;
    // }
    // else
    // {
    //   correctOrder = true;
    // }
    if(currLvlData.jointSpecific)
    {
      var jointIdx = currLvlData.jointMapping[i].jointID;
      if(distance(trans_p, currentJoints[jointIdx]) < tolerance)
      {
        currLvlData.markerChecks[i] = true;
      }
      else
      {
        currLvlData.markerChecks[i] = false;
      }
    }
    else
    {
      for (let j = 0; j < currLvlData.jointNum; j++) {
        var jointIdx = currLvlData.trackedJoins[j];
        if(currentJoints[jointIdx].score < minConf)
        {
          continue;
        }
        currLvlData.markerChecks[i] = currLvlData.markerChecks[i] || (distance(trans_p, currentJoints[jointIdx]) < tolerance);
      }
    }
  }
}

function millisToMinAndSec(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  
  // var hrs = (s - mins) / 60;
  // return hrs + ':' + mins + ':' + secs + '.' + Math.floor(ms/10);

  return mins + ':' + ('0'+secs).slice(-2) + ':' + ('0'+Math.floor(ms/10)).slice(-2);
}