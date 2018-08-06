console.log('Starting script "shelf_calibrate.js"...');

var ShanAPIClient = function() {
  this.baseUrl = 'http://localhost:8000/shancms';
  return this;
};

ShanAPIClient.prototype.createCalibrationVideoRecordingJob = function (shelfId, callbacks) {
};

ShanAPIClient.prototype.createCalibrationTestJob = function (shelfId, callbacks) {
};

ShanAPIClient.prototype.setCalibrationVideo = function (shelfId, calibrationVideoId, callbacks) {
};

function downloadImage(url, callbacks) {
  var image = new Image();
  image.addEventListener('load', function () {
    callbacks.success(image);
  }, false);
  image.addEventListener('error', function (err) {
    callbacks.failure({code: 'image_download_failed', message: 'Network is unavailable.'});
  }, false);
  image.src = url;
}

function getCanvas() {
  return document.getElementById('calibration-canvas');
}

function getContext(canvas) {
  return canvas.getContext('2d');
}

function resizeCanvas(canvas, width, height) {
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function renderCalibrationImage(ctx, img) {
  ctx.drawImage(img, 0, 0);
}

function renderMousePosition(canvas, x, y) {
  var ctx = getContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  renderCalibrationImage(ctx, canvas.calibrationImage);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.67)';
  ctx.fillText('(' + x + ',' + y + ')', x, y);
}

function renderMouseCursor(canvas, x, y) {
  var ctx = getContext(canvas);
  var CROSSHAIR_THICKNESS = 1;
  var CROSSHAIR_SIZE = 16;
  ctx.fillStyle = 'rgb(0, 255, 0)';
  ctx.fillRect(x - (CROSSHAIR_SIZE / 2), y - (CROSSHAIR_THICKNESS / 2), CROSSHAIR_SIZE, CROSSHAIR_THICKNESS);
  ctx.fillRect(x - (CROSSHAIR_THICKNESS / 2), y - (CROSSHAIR_SIZE / 2), CROSSHAIR_THICKNESS, CROSSHAIR_SIZE);
}

function addROIEditingListeners(canvas) {
  var mouseMoveHandler = function(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop;
    renderMousePosition(canvas, relativeX + 10, relativeY + 15);
    renderMouseCursor(canvas, relativeX, relativeY);
  };
  var mouseClickHandler = function(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop;
    console.log('Mouse click at (x, y):', relativeX, relativeY);
  };
  canvas.addEventListener("mousemove", mouseMoveHandler, false);
  canvas.addEventListener("mousedown", mouseClickHandler, false);
}

$(document).ready(function () {
  var calibrationImageUrl = $('[data-calibration-image-url]').data('calibration-image-url');
  downloadImage(calibrationImageUrl, {
    success: function (image) {
      var canvas = getCanvas();
      var context = getContext(canvas);
      console.log('Calibration image downloaded successfully.');

      resizeCanvas(canvas, image.width, image.height);
      console.log('Canvas resized to width/height: ', image.width, image.height);

      renderCalibrationImage(context, image);
      console.log('Calibration image rendered.');

      // FIXME: This is very bad.
      canvas['calibrationImage'] = image;
      canvas['currentlyEditingRoi'] = null;
      canvas['shelfRoi'] = {x: 0, y: 0, width: 100, height: 100};
      canvas['aisleRoi'] = {x: 0, y: 0, width: 100, height: 100};
      addROIEditingListeners(canvas);
      console.log('ROI editing listeners are ready.');
    },
    failure: function (error) {
      alert(error.message);
      console.error('Failed to download calibration image!\nError:', error);
    }
  })
});