var drawCtx;

function setStrokeColor(color) {
    drawCtx.strokeStyle = color;
}

function setLineWidth(width) {
    drawCtx.lineWidth = width;
}

function setFillColor(color) {
    drawCtx.fillStyle = color;
}

function setFont(font) {
    drawCtx.font = font;
}

function fillString(string, x, y) {
    drawCtx.fillText(string, x, y);
}

function arc(x, y, d, start, angle) {
    drawCtx.arc(x, y, d, start, angle);
}

function fillArc(x, y, d, start, angle) {
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
    arc(x, y, d, start, angle);
    drawCtx.fill();
}

function fillCircle(x, y, d) {
    circlePath(x, y, d);
    drawCtx.fill();
}

function drawCircle(x, y, d) {
    circlePath(x, y, d);
    drawCtx.stroke();
}

function circlePath(x, y, d) {
    drawCtx.beginPath();
    arc(x, y, d, 0, Math.PI * 2);
}

function drawLine(x1, y1, x2, y2) {
    drawCtx.beginPath();
    drawCtx.moveTo(x1, y1);
    drawCtx.lineTo(x2, y2);
    drawCtx.stroke();
}

function drawRectangle(x, y, w, h) {
    drawCtx.strokeRect(x, y, w, h);
}

function fillRectangle(x, y, w, h) {
    drawCtx.fillRect(x, y, w, h);
}

function fillPath(xs, ys) {
    drawCtx.beginPath();
    drawCtx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) {
        drawCtx.lineTo(xs[i], ys[i]);
    }
    drawCtx.lineTo(xs[0], ys[0]);
    drawCtx.fill();
}

function drawImage(img, x, y) {
    drawCtx.drawImage(img, x, y);
}

function eraseAll(canvas) {
    let fill = drawCtx.fillStyle;
    let bgColor = canvas.style.backgroundColor;
    if (bgColor == "")
        bgColor = window.getComputedStyle(canvas, null).backgroundColor;
    drawCtx.fillStyle = bgColor;
    drawCtx.fillRect(0, 0, canvas.width, canvas.height);
    drawCtx.fillStyle = fill;
}

function setHelperContext(ctx) {
    drawCtx = ctx;
}