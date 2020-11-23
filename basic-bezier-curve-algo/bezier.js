let board = null; // Represents the canvas element in the html file.
let ctx = null; // Context of board element.
let addingState = false; // Has the user pressed the button "Start adding points"? If yes, then addingState is true, false otherwise.
let controlPts = []; // Here we store the control points.
const CONTROL_PT_RADIUS = 4; // Defines the radius of a control point.
let tolerance = 10; // When the user wants to remove/reposition a control point, this defines how far can the user press from the center of the control point in order to specify that he wants to remove/move exactly that control point.
let mouseMoveEnabled = false; // When the user holds the left button and is currently moving a point, this helps distinguish this event.
let indexOfCtrlPtToBeMoved = -1; // The index of the control point to be moved in the controlPts array.
let isCurveDrawn = false;
let addCtrlPoly = true; // If the user has pressed "Remove control polygon" button, this is false, otherwise - true.

// when the html file is loaded this function is called to do add event listeners to the canvas
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
    board.addEventListener("contextmenu", mouseRightClickHandler);
}

// when the mouse is pressed (left click)
function mouseClickHandler(event) {
    // do nothing if the user hasn't pressed "Start adding points" button
    if (!addingState)
        return;

    let controlPt = getMouseClickLocation(event); // gets the location of the mouse click in the canvas
    controlPts.push(controlPt); // adds that location in the array
    drawPoint(controlPt);
}

// when the user holds the left button
function mouseDownHandler(event) {
    // if the user is currently adding points, do nothing
    if (addingState) {
        return;
    }

    // enable the listener of mouse movement in the canvas
    mouseMoveEnabled = true;

    let mouseClickedLocation = getMouseClickLocation(event);

    // find out which point has the user specified by the click
    for (let i = 0; i < controlPts.length; i++) {
        if (compareMouseLocationToControlPoint(mouseClickedLocation, controlPts[i])) {
            indexOfCtrlPtToBeMoved = i;
            break;
        }
    }

    // if no such point was found, disable the mouse movement listener, because there is no control point to move
    if (indexOfCtrlPtToBeMoved === -1) {
        mouseMoveEnabled = false;
    }
}

// when the user releases the left button
function mouseUpHandler() {
    mouseMoveEnabled = false;
    indexOfCtrlPtToBeMoved = -1;
}

// when the user holds the left button of the mouse and is moving a control point in the canvas
function mouseMoveHandler(event) {
    // do nothing if there is nothing to move
    if (!mouseMoveEnabled) {
        return;
    }

    controlPts[indexOfCtrlPtToBeMoved] = getMouseClickLocation(event);
    clearCanvas(false);
    drawControlPoints();

    // if there are only control points on the canvas, prior to moving a control point, don't draw the curve
    if (isCurveDrawn) {
        drawBezierCurve();
    }
}

// when the user presses the right button
function mouseRightClickHandler(event) {
    let mouseLocation = getMouseClickLocation(event);

    // find out which control point has the user pressed on and remove it, then redraw the control points and the curve
    for (let i = 0; i < controlPts.length; i++) {
        if (compareMouseLocationToControlPoint(mouseLocation, controlPts[i])) {
            controlPts.splice(i, 1); // delete the control point
            clearCanvas(false);
            drawControlPoints();

            // again, if there were only control points on the canvas, prior to removing a control point, don't draw the curve
            if (isCurveDrawn) {
                drawBezierCurve();
            }
            return;
        }
    }
}

// when the user presses the button "Start adding points"/"Stop adding points"
function changeAddingState() {
    addingState = !addingState;

    let addingPtsButton = document.getElementById("addPts");
    // Change content of the button accordingly
    if (addingState) {
        addingPtsButton.innerHTML = "Stop adding points";
    }
    else {
        addingPtsButton.innerHTML = "Start adding points";
    }
}

// when the user has pressed on the button "Remove control polygon"/"Add control polygon"
function changeCtrPolyState() {
    addCtrlPoly = !addCtrlPoly;

    let ctrlPolyButton = document.getElementById("removeCtrlPoly");

    // Change content of the button accordingly
    if (addCtrlPoly) {
        ctrlPolyButton.innerHTML = "Remove control polygon";
    }
    else {
        ctrlPolyButton.innerHTML = "Add control polygon";
    }

    // redraw
    clearCanvas(false);
    drawControlPoints();
    drawBezierCurve();
}

// when the user has pressed "Clear canvas" button
function clearCanvasForButton() {
    clearCanvas();
    isCurveDrawn = false;
}

// clear the canvas with an option to remove or not the control points
// if there is a redraw going on, there is no need to remove the control points
function clearCanvas(clearPoints = true) {
    if (clearPoints) {
        controlPts = [];
    }
    ctx.clearRect(0, 0, board.width, board.height);
}

// returns the mouse click location
function getMouseClickLocation(event) {
    let clientRect = board.getBoundingClientRect();
    let x = event.clientX - clientRect.left;
    let y = event.clientY - clientRect.top;
    return new point(x, y);
}

// compares the mouse click location to the location of a control point
function compareMouseLocationToControlPoint(mouseLocation, controlPoint) {
    return mouseLocation.x >= controlPoint.x - tolerance && mouseLocation.x <= controlPoint.x + tolerance &&
        mouseLocation.y >= controlPoint.y - tolerance && mouseLocation.y <= controlPoint.y + tolerance;
}

// this is the recursive version of the de Casteljau algorithm
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
        plotLine(previousPoint, nextPoint, "indianred");
        previousPoint = nextPoint;
    }

    plotLine(previousPoint, controlPts[controlPts.length - 1], "#CD5C5C");
}

function drawBezierCurve() {
    if (controlPts.length === 0) {
        return;
    }

    if (!isCurveDrawn)
        isCurveDrawn = true;

    computeBezier();
    if (addCtrlPoly)
        drawControlPolygon();
}

function drawControlPolygon() {
    for (let i = 1; i < controlPts.length; i++) {
        plotLine(controlPts[i-1], controlPts[i], "mediumseagreen");
    }
}

function plotLine(previousPoint, nextPoint, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(previousPoint.x, previousPoint.y);
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.stroke();
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

function drawControlPoints() {
    for (let i = 0; i < controlPts.length; i++) {
        drawPoint(controlPts[i]);
    }
}

// since we are constructing points with the new operator, then this is a constructor function which creates instances
function point(x, y) {
    this.x = x;
    this.y = y;
}
