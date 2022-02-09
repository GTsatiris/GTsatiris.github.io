let canProgress = false;
let countDown = 3;
let startedCounter = false;
let start;

function checkProgress()
{
    let allMarkersTouched = true;
    for (let i = 0; i < currLvlData.markerNum; i++)
    {
        if(currLvlData.markerChecks[i] == false)
        {
            allMarkersTouched = false;
            break;
        }
    }

    if(allMarkersTouched)
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
        canProgress = false;
    }
}