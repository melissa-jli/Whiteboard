var canvas = require('./domNodes').canvas;
var loadingOverlay = require('./domNodes').loadingOverlay;
var selectedTool = require('./toolAttributes').selectedTool;

var canvasData = require('./canvasData.js').canvasData;

var drawing = false;
var prevPos = { x: 0, y: 0 }
var curPos = { x: 0, y: 0 }
var ctx = canvas.getContext('2d');

var socket = io();
socket.emit("new_user", {canvasInfo: canvasData, pass: null});

// Canvas password logic
var passModal = $("#password-modal")

passModal.modal({
  backdrop: 'static',
  keyboard: false
})

var submitButton = document.getElementById('password-submit')
var passwordInput = document.getElementById('password-input')
var errorSpan = document.getElementById('error')

 submitButton.addEventListener('click', function() {
  var password = passwordInput.value
  if (!isBlank(password)) {
    socket.emit("new_user", {canvasInfo: canvasData, pass: password});
  } else {
    errorSpan.innerHTML = 'Please enter the password.';
  }
})
function isBlank(str) {
  return !str || str.trim() === ''
}

socket.on("password_required", function () {
  passModal.modal('show')
});

socket.on("incorrect_password", function () {
  errorSpan.innerHTML = 'The password entered was incorrect';
});

socket.on("canvas_redraw", function (canvasInfo) {
  console.log(canvasInfo); //change this to actually draw the canvas data onto teh canvas
  //canvas.width = canvasInfo.width;
  //canvas.height = canvasInfo.height
  passModal.modal('hide')
  loadingOverlay.classList.add("no-display");
});

socket.on("canvas_update", function(data) {
  update(data.points[0], data.points[1], data.toolAttributes)
});

var draw = function(type, e) {

  if (type === 'down') {
    setCurrentPos(e);

    // Draw the first dot
    ctx.beginPath();
    ctx.fillStyle = selectedTool.attributes.color;
    ctx.arc(curPos.x, curPos.y, selectedTool.attributes.size/2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    drawing = true;

  } else if (type === 'move') {
    if (drawing) {
      setPrevPos();
      setCurrentPos(e);
      stroke();
    }
  } else if (type === 'up' || type === 'out') {
    drawing = false;
  }

}

function setPrevPos() {
  prevPos.x = curPos.x;
  prevPos.y = curPos.y;
}

function setCurrentPos(e) {
  curPos.x = e.clientX - canvas.offsetLeft;
  curPos.y = e.clientY - canvas.offsetTop;
}

function stroke() {
  ctx.beginPath();

  ctx.lineWidth = selectedTool.attributes.size;
  ctx.strokeStyle = selectedTool.attributes.color;

  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.moveTo(prevPos.x, prevPos.y);
  ctx.lineTo(curPos.x, curPos.y);

  socket.emit("new_stroke", {
    toolAttributes: selectedTool.attributes,
    canvasName: canvasData.name,
    points: [prevPos, curPos]
  });

  ctx.stroke();
  ctx.closePath();
}

function update(prevPos, curPos, toolAttributes) {
  ctx.beginPath();

  ctx.lineWidth = toolAttributes.size;
  ctx.strokeStyle = toolAttributes.color;

  ctx.lineJoin = ctx.lineCap = 'round';
  ctx.moveTo(prevPos.x, prevPos.y);
  ctx.lineTo(curPos.x, curPos.y);

  ctx.stroke();
  ctx.closePath();
}

module.exports = draw
