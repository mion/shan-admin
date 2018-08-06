console.log('Starting script "shelf_calibrate.js"...');

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

function addROIEditingListeners(canvas) {
  var mouseMoveHandler = function(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop;
    // console.log('mousemove (x, y)', relativeX, relativeY);
  }
  canvas.addEventListener("mousemove", mouseMoveHandler, false);
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

      addROIEditingListeners(canvas);
      console.log('ROI editing listeners are ready.');
    },
    failure: function (error) {
      alert(error.message);
      console.error('Failed to download calibration image!\nError:', error);
    }
  })
});