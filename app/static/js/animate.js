function drawTracer(x1, y1, x2, y2, duration) {
    let distX = x2 - x1;
    let distY = y2 - y1;
    const timeStep = 15;
    const distStepX = distX * (timeStep/duration);
    const distStepY = distY * (timeStep/duration);
    let timeSpent = 0;
    let x = x1;
    let y = y1;
    let dotFraction = 3;
    let i = 1;
    setStrokeColor("red");
    setLineWidth(2);
    let intervalId = setInterval(function() {
        const prevX = x;
        const prevY = y;
        x += distStepX;
        y += distStepY
        if (i % dotFraction != 0) {
            drawLine(prevX, prevY, x, y);
        }
        timeSpent += timeStep;
        if (timeSpent >= duration)
            clearInterval(intervalId);
        i++;
    }, timeStep);
}

function drawMuzzle(x, y, size) {

}