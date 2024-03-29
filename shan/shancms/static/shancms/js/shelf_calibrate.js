console.log('Starting script "shelf_calibrate.js"...');

/*********************************************************************
/* API Client
 *********************************************************************/

var ShanAPIClient = function() {
  this.baseUrl = 'http://localhost:8000/shancms';
  return this;
};

ShanAPIClient.prototype.createCalibrationVideoRecordingJob = function (shelfId, callbacks) {
  $.ajax({
    type: 'POST',
    url: '/shancms/shelves/' + shelfId + '/calibration_videos/jobs',
    data: JSON.stringify({shelf_id: shelfId}),
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: function (data) {
      if (data.success) {
        callbacks.success(data);
      } else {
        callbacks.failure({message: 'Failed to create job'});
      }
    },
    error: function (req, status, error) {
      callbacks.failure(error);
    }
  });
  // setTimeout(function () {
  //   var date = new Date();
  //   callbacks.success({
  //     'calibration_video': {
  //       'id': 4,
  //       'recording_date': date.toDateString(),
  //       'video_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.mp4',
  //       'video_calibration_image_url': 'http://localhost:3601/calib-video-2018-08-01-1415-UTC.jpg',
  //     }
  //   });
  // }, 1750);
};

ShanAPIClient.prototype.createCalibrationTestJob = function (shelfId, calibrationVideoId, roisConf, trackingConf, eventsConf, callbacks) {
  var data = JSON.stringify({
    'shelf_id': shelfId,
    'calibration_video_id': calibrationVideoId,
    'rois_conf': roisConf,
    'tracking_conf': trackingConf,
    'events_conf': eventsConf,
  });
  $.ajax({
    type: 'POST',
    url: '/shancms/shelves/' + shelfId + '/experiments/jobs',
    data: data,
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: function (data) {
      if (data.success) {
        callbacks.success(data);
      } else {
        callbacks.failure({message: 'Failed to create job'});
      }
    },
    error: function (req, status, error) {
      callbacks.failure(error);
    }
  });
};

ShanAPIClient.prototype.getShelf = function (shelfId, callbacks) {
  $.get('/shancms/shelves/' + shelfId)
    .fail(function (err) {
      callbacks.failure(err);
    })
    .done(function (data) {
      callbacks.success(data);
    });
};

ShanAPIClient.prototype.updateShelf = function (shelfId, calibrationVideoId, rois, params, callbacks) {
  console.log('Upading params:', params);
  var data = JSON.stringify({
    name: 'calib-bundle_' + (new Date()).toISOString(),
    calibration_video_id: calibrationVideoId,
    tracking_conf: params.tracking_conf,
    events_conf: params.events_conf,
    rois_conf: rois,
  });
  $.ajax({
    type: 'POST',
    url: '/shancms/shelves/' + shelfId + '/calibration_bundles',
    data: data,
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: function (data) {
      if (data.success) {
        callbacks.success(data);
      } else {
        callbacks.failure({message: 'Failed to update shelf'});
      }
    },
    error: function (req, status, error) {
      callbacks.failure(error);
    }
  });
};

ShanAPIClient.prototype.getCalibrationVideo = function (id, callbacks) {
  $.get('/shancms/calibration_videos/' + id)
    .fail(function (err) {
      callbacks.failure(err);
    })
    .done(function (data) {
      callbacks.success(data);
    });
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

/*********************************************************************
/* Data handling
 *********************************************************************/

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

/*
ShanAPIClient.prototype.createCalibrationTestJob = function (shelfId, calibrationVideoId, roisConf, trackingConf, eventsConf, callbacks) {
canvas['shelfRoi'] = {
  x: canvas['clicks'][0].x,
  y: canvas['clicks'][0].y,
  width: w,
  height: h
};

*/

function runTest(shelfId) {
  var canvas = getCanvas();
  var api = new ShanAPIClient();
  var roisConf = [
    canvas['shelfRoi'],
    canvas['aisleRoi']
  ]
  roisConf[0].type = 'shelf';
  roisConf[1].type = 'aisle';
  var params = JSON.parse($('#calib-params').val());
  api.createCalibrationTestJob(shelfId, __calibrationVideoId, roisConf, params.tracking_conf, params.events_conf, {
    success: function (calibrationTest) {
      console.log(calibrationTest);
      updateTestButton($('#btn-test'), )
    },
    failure: function (error) {
      console.error(error);
    }
  })
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

/*********************************************************************
/* UI
 *********************************************************************/

function getCanvas() {
  return document.getElementById('calibration-canvas');
}

function getContext(canvas) {
  return canvas.getContext('2d');
}

function resizeCanvas(canvas, width, height) {
  document.getElementById('canvas-message').width = width;
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
  if (canvas.currentlyEditingRoi === null) {
    return;
  }
  var PADDING = 10;
  var ctx = getContext(canvas);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.67)';
  ctx.fillText('(' + x + ',' + y + ')', x + PADDING, y + 2*PADDING);
}

function renderMouseCursor(canvas, x, y) {
  if (canvas.currentlyEditingRoi === null) {
    return;
  }
  var ctx = getContext(canvas);
  // crosshair
  var CROSSHAIR_THICKNESS = 1;
  var CROSSHAIR_SIZE = 16;
  ctx.fillStyle = 'rgb(0, 255, 0)';
  ctx.fillRect(x - (CROSSHAIR_SIZE / 2), y - (CROSSHAIR_THICKNESS / 2), CROSSHAIR_SIZE, CROSSHAIR_THICKNESS);
  ctx.fillRect(x - (CROSSHAIR_THICKNESS / 2), y - (CROSSHAIR_SIZE / 2), CROSSHAIR_THICKNESS, CROSSHAIR_SIZE);
  // vertical guide
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();
  ctx.closePath();
  // horizontal guide
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();
  ctx.closePath();
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

var hasROIEditingListeners = false;

function addROIEditingListeners(canvas) {
  var mouseMoveHandler = function(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop;
    erase(canvas);
    renderCalibrationImage(canvas, canvas['calibrationImage']);
    renderMousePosition(canvas, relativeX, relativeY);
    renderMouseCursor(canvas, relativeX, relativeY);
    if (canvas['shelfRoi'] || canvas['aisleRoi']) {
      renderRois(canvas, canvas['shelfRoi'], canvas['aisleRoi']);
    }
    if (canvas['currentlyEditingRoi'] !== null && canvas.clicks.length > 0) {
      var w = relativeX - canvas['clicks'][0].x;
      var h = relativeY - canvas['clicks'][0].y;
      var ctx = getContext(canvas);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeRect(canvas['clicks'][0].x, canvas['clicks'][0].y, w, h);
    }
  };
  var mouseClickHandler = function(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop; // - document.body.scrollTop;
    console.log('Mouse click at (x, y):', relativeX, relativeY);
    console.log(e);
    if (canvas['currentlyEditingRoi'] !== null) {
      if (canvas['clicks'].length === 0) {
        canvas['clicks'].push({x: relativeX, y: relativeY});
        $('#canvas-message').text('↘️ Click again to define the region of interest.');
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
          console.log('Aisle ROI created:', canvas['aisleRoi']);
        } else {
          throw new DOMException("unknown roi key: " + canvas['currentlyEditingRoi']);
        }
        setEditingMode(null);
        $('#canvas-message').text('✅ Region of interest updated.');
        setTimeout(function () {
          if (canvas['currentlyEditingRoi'] === null) {
            $('#canvas-message').text('You have unsaved changes.');
          }
        }, 3000);
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

function setEditingMode(currentlyEditingRoi) {
  if (currentlyEditingRoi === null) {
    $("#calibration-canvas").removeClass("cursor-none");
    $("#btn-save").removeClass("button0").addClass('button1');
    $("#btn-test").removeClass("button0").addClass('button3');
    $("#btn-draw-aisle").removeClass("button0").addClass('button2');
    $("#btn-draw-shelf").removeClass("button0").addClass('button2');
    $("#btn-edit-params").removeClass("button0").addClass('button2');
  } else {
    $("#calibration-canvas").addClass("cursor-none");
    $("#btn-save").removeClass("button1").addClass('button0');
    $("#btn-test").removeClass("button3").addClass('button0');
    $("#btn-draw-shelf").removeClass("button2").addClass('button0');
    $("#btn-draw-aisle").removeClass("button2").addClass('button0');
    $("#btn-edit-params").removeClass("button2").addClass('button0');
  }
}

function replaceExtension(path, newExtension) {
  // FIXME fixed extension
  var parts = path.split('.mp4');
  if (parts.length != 2) {
    throw new DOMException('cannot replace extension for: ' + path);
  }
  return parts[0] + '.' + newExtension;
}

function loadCalibrationVideo(id, rois_conf) {
  console.log('Loading calibration video with ID = ', id);
  var api = new ShanAPIClient();
  api.getCalibrationVideo(id, {
    success: function (calibVideo) {
      console.log('Calibration video loaded: ', calibVideo);
      var calibrationImageUrl = replaceExtension(calibVideo['video_url'], 'jpg');
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
          if (rois_conf) {
            canvas['shelfRoi'] = rois_conf.filter(function (c) { return c.type == 'shelf'; })[0];
            canvas['aisleRoi'] = rois_conf.filter(function (c) { return c.type == 'aisle'; })[0];
            renderRois(canvas, canvas['shelfRoi'], canvas['aisleRoi']);
          } else {
            canvas['shelfRoi'] = null;
            canvas['aisleRoi'] = null;
          }
          $('#calibration-container').show();
          if (!hasROIEditingListeners) {
            addROIEditingListeners(canvas);
            console.log('ROI editing listeners are ready.');
            hasROIEditingListeners = true;
          } else {
            console.log('ROI editing listeners already added.');
          }
        },
        failure: function (error) {
          alert(error.message);
          console.error('Failed to download calibration image!\nError:', error);
        }
      });
    },
    failure: function (err) {
      alert('ERROR: failed to load calibration video.');
      console.error('Failed to load calibration video with ID = ', id, err);
    }
  });
}

var __calibrationVideoId;

function init(shelf) {
  if (shelf.calibration_bundle) {
    // load stuff from shelf
    var paramsText = JSON.stringify({
      tracking_conf: shelf.calibration_bundle.tracking_conf,
      events_conf: shelf.calibration_bundle.events_conf
    });
    $('#calib-params').val(paramsText);
    var calibrationVideoId = shelf.calibration_bundle.calibration_video_id;
    __calibrationVideoId = calibrationVideoId;
    loadCalibrationVideo(calibrationVideoId, shelf.calibration_bundle.rois_conf);
  }
  // standard init
  $('#calib-video-select').on('change', function () {
    var calibrationVideoId = parseInt($(this).val());
    __calibrationVideoId = calibrationVideoId;
    loadCalibrationVideo(calibrationVideoId);
  });
  /* Set buttons listeners */
  $('#btn-record').on('click', function () {
    updateRecordingButton($(this), true);
    recordCalibrationVideo(shelf.id)
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
    var canvas = getCanvas();
    if (canvas.currentlyEditingRoi !== null) {
      return;
    }
    updateTestButton($(this), true);
    runTest(shelf.id);
  });
  $('#btn-draw-aisle').on('click', function (e) {
    var canvas = getCanvas();
    if (canvas.currentlyEditingRoi !== null) {
      return;
    }
    canvas['currentlyEditingRoi'] = 'aisle';
    canvas['clicks'] = [];
    setEditingMode(canvas.currentlyEditingRoi);
    $('#canvas-message').text('↖️ Click somewhere to define the top-left corner of the region of interest.');
    console.log(e);
  });
  $('#btn-draw-shelf').on('click', function (e) {
    var canvas = getCanvas();
    if (canvas.currentlyEditingRoi !== null) {
      return;
    }
    canvas['currentlyEditingRoi'] = 'shelf';
    canvas['clicks'] = [];
    setEditingMode(canvas.currentlyEditingRoi);
    console.log(e);
  });
  $('#btn-save').on('click', function (e) {
    var canvas = getCanvas();
    if (canvas.currentlyEditingRoi !== null) {
      return;
    }
    var confirmed = confirm('Are you sure you want to save?');
    if (confirmed) {
      var api = new ShanAPIClient();
      var calibrationVideoId = parseInt($('#calib-video-select').val());
      console.log('calibration video ID = ', calibrationVideoId);
      var rois = [
        {
          type: 'shelf',
          x: canvas['shelfRoi'].x,
          y: canvas['shelfRoi'].y,
          width: canvas['shelfRoi'].width,
          height: canvas['shelfRoi'].height
        },
        {
          type: 'aisle',
          x: canvas['aisleRoi'].x,
          y: canvas['aisleRoi'].y,
          width: canvas['aisleRoi'].width,
          height: canvas['aisleRoi'].height
        },
      ];
      console.log('regions of interest = ', rois);
      var params = JSON.parse($('#calib-params').val());
      console.log('parameters = ', params);
      $('#btn-save').removeClass('button1').addClass('button0');
      $('#canvas-message').text('Saving, please wait...');
      api.updateShelf(shelf.id, calibrationVideoId, rois, params, {
        success: function (shelf) {
          $('#btn-save').removeClass('button0').addClass('button1');
          $('#canvas-message').text('✓ Saved successfully.');
          alert('Your changes were saved successfully.');
        },
        failure: function (error) {
          console.error(error);
          $('#btn-save').removeClass('button0').addClass('button1');
          $('#canvas-message').text('⚠️ An error occurred and your changes have not been saved.');
          alert('The app could not establish a connection to the server, and it is not your fault. Please try again later.');
        }
      });
    }
  });
}

$(document).ready(function () {
  var shelfId = $('[data-shelf-id]').data('shelf-id');
  var api = new ShanAPIClient();
  api.getShelf(shelfId, {
    success: function (shelf) {
      console.log('Loaded shelf:', shelf);
      init(shelf);
    },
    failure: function (err) {
      console.error('Failed to GET shelf:', err);
    }
  });
  // var calibrationVideoId = null;
  // if ($('[data-calibration-video-id]').length > 0) {
  //   calibrationVideoId = $('[data-calibration-video-id]').data('calibration-video-id');
  // }
  // updateCameraLogs(shelfId);
});
