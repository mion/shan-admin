console.log('Starting script "shelf_calibrate.js"...');

var ShanAPIClient = function() {
  this.baseUrl = 'http://localhost:8000/shancms';
  return this;
};

ShanAPIClient.prototype.createCalibrationVideoRecordingJob = function (shelfId, callbacks) {
  setTimeout(function () {
    var date = new Date();
    callbacks.success({
      'calibration_video': {
        'id': 4,
        'recording_date': date.toDateString(),
        'video_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.mp4',
        'video_calibration_image_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.jpg',
      }
    });
  }, 1750);
};

ShanAPIClient.prototype.createCalibrationTestJob = function (shelfId, callbacks) {
};

ShanAPIClient.prototype.setCalibrationVideo = function (shelfId, calibrationVideoId, callbacks) {
};

ShanAPIClient.prototype.getCameraLogs = function (shelfId, numberOfLines, callbacks) {
  setTimeout(function () {
    text = [
      "Mon 6 Aug 05:05 UTC   PREPARING TO RECORD",
      "Mon 6 Aug 05:35 UTC   RECORDING STARTED",
      "Mon 6 Aug 05:59 UTC   RECORDED 1 SEC",
      "Mon 6 Aug 06:28 UTC   RECORDING STOPPED",
    ].join("\n");
    callbacks.success(text);
  }, 1750);
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

function setRecordingStatus(txt) {
  $('#status-record').text(txt);
}

function recordCalibrationVideo(shelfId) {
  var api = new ShanAPIClient();
  setRecordingStatus('');
  api.createCalibrationVideoRecordingJob(shelfId, {
    success: function (calibrationVideo) {
      console.log(calibrationVideo);
      updateRecordingButton($('#btn-record'), false);
      setRecordingStatus('Job created successfully.');
    },
    failure: function (error) {
      console.error(error);
      updateRecordingButton($('#btn-record'), false);
      setRecordingStatus('ERROR: ' + error.message);
    }
  })
}

function onCalibrationVideoUpdate(calibrationVideo) {
}

function updateRecordingButton(btn, isRecording) {
  if (isRecording) {
    btn.removeClass('button3').addClass('button0');
    btn.text('Recording...');
  } else {
    btn.removeClass('button0').addClass('button3');
    btn.text('Record calibration video');
  }
}

function setCameraLogsText(newText) {
  $("#camera-logs").html(newText.split("\n").join("<br>"));
}

function updateCameraLogs(shelfId) {
  var NUMBER_OF_LINES = 5;
  var updateCameraLogsInterval = setInterval(function () {
    var api = new ShanAPIClient();
    api.getCameraLogs(shelfId, NUMBER_OF_LINES, {
      success: function (newCameraLogsText) {
        setCameraLogsText(newCameraLogsText);
        setTimeout(function () {
          updateCameraLogs(shelfId);
        }, 250);
      },
      failure: function (error) {
        console.error(error);
        setCameraLogsText('ERROR:\n' + error.message);
      }
    })
  }, 1000);
}

$(document).ready(function () {
  var shelfId = $('[data-shelf-id]').data('shelf-id');
  var calibrationImageUrl = $('[data-calibration-image-url]').data('calibration-image-url');
  updateCameraLogs(shelfId);
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
  });
  /* Set buttons listeners */
  $('#btn-record').on('click', function () {
    updateRecordingButton($(this), true);
    recordCalibrationVideo(shelfId)
  });
  var isViewingCameraLogs = false;
  $('#camera-logs').hide();
  $('#view-camera-logs').on('click', function () {
    if (isViewingCameraLogs) {
      $('#camera-logs').hide();
      $('#view-camera-logs').text('View camera logs')
      isViewingCameraLogs = false;
    } else {
      $('#camera-logs').show();
      $('#view-camera-logs').text('Hide camera logs')
      isViewingCameraLogs = true;
    }
  });
});