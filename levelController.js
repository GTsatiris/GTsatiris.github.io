let currentLevel = 0;
let currLvlData;
let levelData;
let levelsReady = false;

function loadStandardLevels()
{
    let httpRequest = new XMLHttpRequest(); // asynchronous request
    httpRequest.open("GET", "assets/levelData/standardLevels.json", true);
    httpRequest.send();
    httpRequest.addEventListener("readystatechange", function() {
        if (this.readyState === this.DONE) {
            // when the request has completed
            levelData = JSON.parse(this.response);
            levelsReady = true;
            // console.log(levelData[0].markerSize1);
        }
    });
}