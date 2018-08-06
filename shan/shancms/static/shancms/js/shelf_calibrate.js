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
  setTimeout(function () {
    var date = new Date();
    callbacks.success({
      'calibration_test': {
        'id': 1,
        'creation_date': date.toDateString(),
        'status': 'progress 0.85',
        'creation_date': date.toDateString(),
        'result_video_url': 'http://localhost:3601/test-result-12345678.mp4',
      }
    })
  }, 1750);
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

function renderCalibrationImage(canvas, img) {
  return getContext(canvas).drawImage(img, 0, 0);
}

function erase(canvas) {
  var ctx = getContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function renderMousePosition(canvas, x, y) {
  var PADDING = 10;
  var ctx = getContext(canvas);
  renderCalibrationImage(canvas, canvas.calibrationImage);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.67)';
  ctx.fillText('(' + x + ',' + y + ')', x + PADDING, y + 2*PADDING);
}

function renderMouseCursor(canvas, x, y) {
  var ctx = getContext(canvas);
  var CROSSHAIR_THICKNESS = 1;
  var CROSSHAIR_SIZE = 16;
  ctx.fillStyle = 'rgb(0, 255, 0)';
  ctx.fillRect(x - (CROSSHAIR_SIZE / 2), y - (CROSSHAIR_THICKNESS / 2), CROSSHAIR_SIZE, CROSSHAIR_THICKNESS);
  ctx.fillRect(x - (CROSSHAIR_THICKNESS / 2), y - (CROSSHAIR_SIZE / 2), CROSSHAIR_THICKNESS, CROSSHAIR_SIZE);
}

function renderRois(canvas, shelfRoi, aisleRoi) {
  var PADDING = 20;
  var ctx = getContext(canvas);
  if (aisleRoi) {
    ctx.fillStyle = 'rgba(255, 155, 0, 0.45)';
    ctx.fillRect(aisleRoi.x, aisleRoi.y, aisleRoi.width, aisleRoi.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeRect(aisleRoi.x, aisleRoi.y, aisleRoi.width, aisleRoi.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 1.00)';
    ctx.fillText('Aisle', aisleRoi.x + PADDING/2, aisleRoi.y + PADDING);
  }
  if (shelfRoi) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.45)';
    ctx.fillRect(shelfRoi.x, shelfRoi.y, shelfRoi.width, shelfRoi.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeRect(shelfRoi.x, shelfRoi.y, shelfRoi.width, shelfRoi.height);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 1.00)';
    ctx.fillText('Shelf', shelfRoi.x + PADDING/2, shelfRoi.y + PADDING);
  }
}

function addROIEditingListeners(canvas) {
  var mouseMoveHandler = function(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop;
    erase(canvas);
    renderCalibrationImage(canvas, canvas['calibrationImage']);
    renderMousePosition(canvas, relativeX, relativeY);
    renderMouseCursor(canvas, relativeX, relativeY);
    renderRois(canvas, canvas['shelfRoi'], canvas['aisleRoi']);
  };
  var mouseClickHandler = function(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop; // - document.body.scrollTop;
    console.log('Mouse click at (x, y):', relativeX, relativeY);
    console.log(e);
    if (canvas['currentlyEditingRoi'] !== null) {
      if (canvas['clicks'].length === 0) {
        canvas['clicks'].push({x: relativeX, y: relativeY});
      } else if (canvas['clicks'].length === 1) {
        var w = relativeX - canvas['clicks'][0].x;
        var h = relativeY - canvas['clicks'][0].y;
        if (canvas['currentlyEditingRoi'] === 'shelf') {
          canvas['shelfRoi'] = {
            x: canvas['clicks'][0].x,
            y: canvas['clicks'][0].y,
            width: w,
            height: h
          };
          canvas['currentlyEditingRoi'] = null;
          canvas['clicks'] = [];
          console.log('Shelf ROI created:', canvas['shelfRoi']);
        } else if (canvas['currentlyEditingRoi'] === 'aisle') {
          canvas['aisleRoi'] = {
            x: canvas['clicks'][0].x,
            y: canvas['clicks'][0].y,
            width: w,
            height: h
          };
          canvas['currentlyEditingRoi'] = null;
          canvas['clicks'] = [];
          console.log('Aisle ROI created:', canvas['shelfAisle']);
        } else {
          throw new DOMException("unknown roi key: " + canvas['currentlyEditingRoi']);
        }
        renderCalibrationImage(canvas, canvas['calibrationImage']);
        renderRois(canvas, canvas['shelfRoi'], canvas['aisleRoi']);
      }
    }
  };
  canvas.addEventListener("mousemove", mouseMoveHandler, false);
  canvas.addEventListener("mousedown", mouseClickHandler, false);
}

function setRecordingStatus(txt) {
  $('#status-record').text(txt);
}

function updateTestButton(btn, isLoading) {
  if (isLoading) {
    btn.removeClass('button3').addClass('button0');
    btn.text('Please wait...');
  } else {
    btn.removeClass('button0').addClass('button3');
    btn.text('Run a test');
  }
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

function runTest(shelfId, rois, params) {
  var api = new ShanAPIClient();
  api.createCalibrationTestJob(shelfId, {
    success: function (calibrationTest) {
      console.log(calibrationTest);
      updateTestButton($('#btn-test'), )
    },
    failure: function (error) {
      console.error(error);
    }
  })
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

      renderCalibrationImage(canvas, image);
      console.log('Calibration image rendered.');

      // FIXME: This is very bad.
      canvas['calibrationImage'] = image;
      canvas['currentlyEditingRoi'] = null;
      canvas['shelfRoi'] = {x: 0, y: 0, width: 0, height: 0};
      canvas['aisleRoi'] = {x: 0, y: 0, width: 0, height: 0};
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
  $('#btn-test').on('click', function () {
    updateTestButton($(this), true);
    var canvas = getCanvas();
    runTest(shelfId);
  });
  $('#btn-draw-aisle').on('click', function (e) {
    var canvas = getCanvas();
    canvas['currentlyEditingRoi'] = 'aisle';
    canvas['clicks'] = [];
    console.log(e);
  });
  $('#btn-draw-shelf').on('click', function (e) {
    var canvas = getCanvas();
    canvas['currentlyEditingRoi'] = 'shelf';
    canvas['clicks'] = [];
    console.log(e);
  });
});