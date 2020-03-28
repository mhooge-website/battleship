const MUZZLE_FRAMES = 12;
const HIT_FRAMES = 11;
const MISS_FRAMES = 14;
var MUZZLE_IMAGES = [MUZZLE_FRAMES];
var HIT_IMAGES = [HIT_FRAMES];
var MISS_IMAGES = [MISS_FRAMES];

function loadImages(array, length, source) {
    for (let i = 0; i < length; i++) {
        let img = new Image();
        img.src = "/static/img/" + source + i + ".png";
        array[i] = img;
    }
}

loadImages(MUZZLE_IMAGES, MUZZLE_FRAMES, "muzzle/");
loadImages(HIT_IMAGES, HIT_FRAMES, "explosion/");
loadImages(MISS_IMAGES, MISS_FRAMES, "splash/");

function drawTracer(x1, y1, x2, y2, duration) {
    let distX = x2 - x1;
    let distY = y2 - y1;
    const timeStep = 20;
    const distStepX = distX * (timeStep/duration);
    const distStepY = distY * (timeStep/duration);
    let timeSpent = 0;
    let x = x1;
    let y = y1;
    let dotFraction = 3;
    let i = 1;
    setFillColor("white");
    setLineWidth(2);
    let intervalId = setInterval(function() {
        eraseRect(x-8, y-8, 16, 16)
        x += distStepX;
        y += distStepY
        if (i % dotFraction != 0) {
            fillCircle(x, y, 6);
        }
        timeSpent += timeStep;
        if (timeSpent >= duration)
            clearInterval(intervalId);
        i++;
    }, timeStep);
}

function drawSprite(x, y, w, h, angle, delay, images) {
    let frames = images.length;
    function draw(i) {
        eraseRect(x-(w/2)-6, y-(h/2)-6, w+12, h+12);
        if (i == frames) return;
        let img = images[i];
        drawImage(img, x, y, w, h, -w/2, -h/2, angle);
        setTimeout(function() {
            draw(i+1);
        }, delay)
    }
    draw(0);
}

function drawMuzzle(x, y, w, h, angle) {
    drawSprite(x+w/2, y, w, h, angle, 100, MUZZLE_IMAGES);
}

function drawHit(x, y, w, h, angle) {
    drawSprite(x, y, w, h, angle, 100, HIT_IMAGES);
}

function drawMiss(x, y, w, h, angle) {
    drawSprite(x, y, w, h, angle, 100, MISS_IMAGES);
}