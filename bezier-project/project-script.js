let board = null;
let ctx = null;
let addingState = false;
let controlPts = [];
const CONTROL_PT_RADIUS = 4;
let mouseMoveEnabled = false;
let indexOfCtrlPtToBeMoved = -1;

function changeAddingState() {
    addingState = !addingState;

    let addingPtsButton = document.getElementById("addPts");
    if (addingState) {
        addingPtsButton.innerHTML = "Disable adding points option";
    }
    else {
        addingPtsButton.innerHTML = "Enable adding points option";
    }
}

function clearCanvas(clearPoints = true) {
    if (clearPoints) {
        controlPts = [];
    }
    ctx.clearRect(0, 0, board.width, board.height);
}

function start() {
    board = document.getElementById("board");
    if (!board) {
        alert("Could not retrieve canvas!");
        return;
    }

    ctx = board.getContext("2d");
    if (!ctx) {
        alert("Could not load canvas context!");
        return;
    }

    board.addEventListener("click", mouseClickHandler);
    board.addEventListener("mousedown", mouseDownHandler);
    board.addEventListener("mouseup", mouseUpHandler);
    board.addEventListener("mousemove", mouseMoveHandler);
    board.addEventListener("contextmenu", mouseRightClickHandler)
}

function getMouseClickLocation(event) {
    let clientRect = board.getBoundingClientRect();
    let x = event.clientX - clientRect.left;
    let y = event.clientY - clientRect.top;
    return new point(x, y);
}

function mouseClickHandler(event) {
    if (!addingState)
        return;

    let controlPt = getMouseClickLocation(event);
    controlPts.push(controlPt);
    drawPoint(controlPt);
}

function drawPoint(pt) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, CONTROL_PT_RADIUS, 0, 2 * Math.PI, false);
    ctx.lineWidth = 2;
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.strokeStyle = "yellow";
    ctx.stroke();
}

function mouseDownHandler(event) {
    if (addingState) {
        return;
    }

    mouseMoveEnabled = true;

    let mouseClickedLocation = getMouseClickLocation(event);
    for (let i = 0; i < controlPts.length; i++) {
        if (compareMouseLocationToControlPoint(mouseClickedLocation, controlPts[i])) {
            indexOfCtrlPtToBeMoved = i;
            break;
        }
    }

    if (indexOfCtrlPtToBeMoved === -1) {
        mouseMoveEnabled = false;
    }
}

function mouseUpHandler(event) {
    mouseMoveEnabled = false;
    indexOfCtrlPtToBeMoved = -1;
}

function mouseMoveHandler(event) {
    if (!mouseMoveEnabled) {
        return;
    }

    let newLocation = getMouseClickLocation(event);
    controlPts[indexOfCtrlPtToBeMoved] = newLocation;
    clearCanvas(false);
    drawBezierCurve();
    drawControlPoints();
}

function compareMouseLocationToControlPoint(mouseLocation, controlPoint) {
    return mouseLocation.x >= controlPoint.x - CONTROL_PT_RADIUS && mouseLocation.x <= controlPoint.x + CONTROL_PT_RADIUS &&
        mouseLocation.y >= controlPoint.y - CONTROL_PT_RADIUS && mouseLocation.y <= controlPoint.y + CONTROL_PT_RADIUS;
}

function drawControlPoints() {
    for (let i = 0; i < controlPts.length; i++) {
        drawPoint(controlPts[i]);
    }
}

function mouseRightClickHandler(event) {
    let mouseLocation = getMouseClickLocation(event);
    for (let i = 0; i < controlPts.length; i++) {
        if (compareMouseLocationToControlPoint(mouseLocation, controlPts[i])) {
            controlPts.splice(i, 1); // delete the control point
            clearCanvas(false);
            drawBezierCurve();
            drawControlPoints();
            return;
        }
    }
}

function drawControlPolygon() {
    for (let i = 1; i < controlPts.length; i++) {
        plotLine(controlPts[i-1], controlPts[i], "green");
    }
}

function plotLine(previousPoint, nextPoint, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(previousPoint.x, previousPoint.y);
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.stroke();
}

function computeBezierPoint(r, i, t) {
    if (r === 0)
        return controlPts[i];

    let point1 = computeBezierPoint(r - 1, i, t);
    let point2 = computeBezierPoint(r - 1, i + 1, t);

    return new point((1-t)*point1.x + t*point2.x, (1-t)*point1.y + t*point2.y);
}

function computeBezier() {
    let previousPoint = controlPts[0];
    
    for (let t = 0.0; t <= 1.0; t += 0.005) {
        let nextPoint = computeBezierPoint(controlPts.length - 1, 0, t);
        plotLine(previousPoint, nextPoint, "red");
        previousPoint = nextPoint;
    }
}

function drawBezierCurve() {
    if (controlPts.length === 0) {
        return;
    }

    computeBezier();
    drawControlPolygon();
}

function point(x, y) {
    this.x = x;
    this.y = y;
}