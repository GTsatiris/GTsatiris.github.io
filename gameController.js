let canProgress = false;
let allMarkersTouched;
let correctOrder;
let correctJoints;
let countDown = 3;
let startedCounter = false;
let start;

function checkProgress()
{
    currLvlData = levelData[currentLevel];

    if(currLvlData.orderSpecific)
    {
        // TODO
        correctOrder = true;
    }
    if(currLvlData.jointSpecific)
    {
        //TODO
        correctJoints = true;
    }

    let allMarkersTouched = true;
    for (let i = 0; i < currLvlData.markerNum; i++)
    {
        if(currLvlData.markerChecks[i] == false)
        {
            allMarkersTouched = false;
            break;
        }
    }

    if(allMarkersTouched && correctJoints && correctOrder)
    {
        if(startedCounter)
        {
            let end = second();
            if(end - start >= countDown)
            {
                startedCounter = false;
                canProgress = true;
            }
        }
        else
        {
            start = second();
            startedCounter = true;
        }
    }
    else
    {
        startedCounter = false;
    }
}