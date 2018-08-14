if (typeof moment === 'undefined') { console.error('Required lib "moment.js" not found.'); }

function getEvents(shelfId, callback) {
  $.get('/shancms/events', {'shelf_id': shelfId})
    .fail(function () {
      callback(null);
    })
    .done(function (data) {
      callback(data);
    });
}

var CHART_LABEL_WALKED = 'Walked';
var CHART_LABEL_INTERACTED = 'Interacted';
var CHART_LABEL_PONDERED = 'Pondered';
var CHART_LABEL_PONDERED_DURATION = 'Pondered Duration';

function createAndShowChart(chartData) {
  console.log('Showing chart with data:', chartData);
  /*
  var container = document.getElementById('chart-container');
  if (document.getElementById('shan-chart')) {
    container.removeChild(document.getElementById('shan-chart'));
  }
  var canvas = document.createElement('canvas');
  canvas.setAttribute('id', 'shan-chart');
  container.appendChild(canvas);
  */
  var ctx = document.getElementById('shan-chart').getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: chartData.labels.map(dateFormattedForLabel),
          datasets: [
            {
              label: CHART_LABEL_WALKED,
              backgroundColor: 'rgba(255, 0, 0)',
              borderColor: 'rgba(255, 0, 0)',
              data: chartData.walkedData,
              fill: false
            },
            {
              label: CHART_LABEL_PONDERED,
              backgroundColor: 'rgba(0, 255, 0)',
              borderColor: 'rgba(0, 255, 0)',
              data: chartData.ponderedData,
              fill: false
            },
            {
              label: CHART_LABEL_PONDERED_DURATION,
              backgroundColor: 'rgba(255, 255, 0)',
              borderColor: 'rgba(255, 255, 0)',
              data: chartData.ponderedDurationData,
              fill: false
            },
            {
              label: CHART_LABEL_INTERACTED,
              backgroundColor: 'rgba(0, 0, 255)',
              borderColor: 'rgba(0, 0, 255)',
              data: chartData.interactedData,
              fill: false
            }
          ]
      },
      options: {
          responsive: true,
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero: true
                  }
              }]
          }
      }
  });
  return myChart;
}

function momentToDate(m) {
  return new Date(m.year(), m.month(), m.date());
}

function dateToString(date) {
  return moment(date).format('MM/DD/YYYY');
}

function stringToDate(string) {
  return momentToDate(moment(string, 'MM/DD/YYYY'));
}

function dateFormattedForLabel(dateString) {
  return moment(dateString, 'MM/DD/YYYY').format('MMM D');
}

function aggregateEventsByDateString(events) {
  if (events.length === 0) {
    throw new DOMException('array "events" is empty');
  }
  var eventsByDateString = {};
  for (var i = 0; i < events.length; i++) {
    var dateString = dateToString(events[i].date);
    if (!eventsByDateString[dateString]) {
      eventsByDateString[dateString] = [];
    }
    eventsByDateString[dateString].push({type: events[i].type, params: events[i].params});
  }
  return eventsByDateString;
}

function daysBetween(date1, date2) {
  var ONE_DAY_MS = 1000 * 60 * 60 * 24;
  var deltaMs = date2.getTime() - date1.getTime();
  return Math.ceil(deltaMs / ONE_DAY_MS);
}

function average(values) {
  var sum = values.reduce(function (acc, val) { return acc + val; }, 0);
  return sum / values.length;
}

function buildChartData(firstDate, lastDate, eventsByDateString) {
  var firstMoment = moment(firstDate);
  var currDate = momentToDate(firstMoment);
  var lastMoment = moment(lastDate);
  var lastDate = momentToDate(lastMoment);
  var labels = [];
  var walkedData = [];
  var interactedData = [];
  var ponderedData = [];
  var ponderedDurationData = [];
  while (currDate.getTime() <= lastDate.getTime()) {
    var currDateString = dateToString(currDate);
    var events = eventsByDateString[currDateString];
    if (!events) { events = []; }
    labels.push(dateToString(currDate));
    walkedData.push(events.filter(function (e) { return e.type === 'walked'; }).length);
    interactedData.push(events.filter(function (e) { return e.type === 'interacted'; }).length);
    ponderedData.push(events.filter(function (e) { return e.type === 'pondered'; }).length);
    var ponderedEvents = events.filter(function (e) { return e.type === 'pondered'});
    if (ponderedEvents.length > 0) {
      var durationsSec = ponderedEvents.map(function (e) { return e.params['duration'] / 1000; });
      ponderedDurationData.push(Math.round(average(durationsSec)));
    } else {
      ponderedDurationData.push(null);
    }
    var nextMoment = moment(currDate).add(1, 'days');
    currDate = momentToDate(nextMoment);
  }
  return {
    labels: labels,
    walkedData: walkedData,
    interactedData: interactedData,
    ponderedData: ponderedData,
    ponderedDurationData: ponderedDurationData
  };
}

function updateChart(chart, chartData) {
  chart.data.labels = [];
  chart.data.datasets = [];
  chart.update();
  chart.data.labels = chartData.labels.map(dateFormattedForLabel);
  chart.data.datasets.push({
    label: CHART_LABEL_WALKED,
    backgroundColor: 'rgba(255, 0, 0)',
    borderColor: 'rgba(255, 0, 0)',
    data: chartData.walkedData,
    fill: false
  });
  chart.data.datasets.push({
    label: CHART_LABEL_PONDERED,
    backgroundColor: 'rgba(0, 255, 0)',
    borderColor: 'rgba(0, 255, 0)',
    data: chartData.ponderedData,
    fill: false
  });
  chart.data.datasets.push({
    label: CHART_LABEL_PONDERED_DURATION,
    backgroundColor: 'rgba(255, 255, 0)',
    borderColor: 'rgba(255, 255, 0)',
    data: chartData.ponderedDurationData,
    fill: false
  });
  chart.data.datasets.push({
    label: CHART_LABEL_INTERACTED,
    backgroundColor: 'rgba(0, 0, 255)',
    borderColor: 'rgba(0, 0, 255)',
    data: chartData.interactedData,
    fill: false
  });
  chart.update();
  console.log('Chart updated with:', chartData);
}

function aggregateChartData(chartData, period) { // TODO: refactor this hacky crap
  var newData = {
    labels: [],
    walkedData: [],
    interactedData: [],
    ponderedData: [],
    ponderedDurationData: []
  };
  var daysInPeriod;
  if (period === 'days') {
    return chartData;
  } else if (period === 'weeks') {
    daysInPeriod = 7;
  } else if (period === 'months') {
    daysInPeriod = 30;
  } else {
    throw new DOMException('invalid period "' + period + '"')
  }
  var index;
  var newIndex = 0;
  for (index = 0; index < (chartData.labels.length - daysInPeriod); index += daysInPeriod) {
    newData.labels[newIndex] = chartData.labels[index] + ' to ' + chartData.labels[index + daysInPeriod - 1];
    var walked = [];
    var pondered = [];
    var ponderedDuration = [];
    var interacted = [];
    for (var i = 0; i < daysInPeriod; i++) {
      walked.push(chartData.walkedData[index + i]);
      pondered.push(chartData.ponderedData[index + i]);
      ponderedDuration.push(chartData.ponderedDurationData[index + i]);
      interacted.push(chartData.interactedData[index + i]);
    }
    newData.walkedData[newIndex] = Math.round(average(walked));
    newData.ponderedData[newIndex] = Math.round(average(pondered));
    newData.ponderedDurationData[newIndex] = Math.round(average(ponderedDuration));
    newData.interactedData[newIndex] = Math.round(average(interacted));
    newIndex += 1;
  }
  // rest of the data up until now
  if (index < chartData.labels.length) {
    newData.labels[newIndex] = chartData.labels[index] + ' to '
    var walked = [];
    var pondered = [];
    var ponderedDuration = [];
    var interacted = [];
    while (index < chartData.labels.length) {
      walked.push(chartData.walkedData[index]);
      pondered.push(chartData.ponderedData[index]);
      ponderedDuration.push(chartData.ponderedDurationData[index]);
      interacted.push(chartData.interactedData[index]);
      index += 1;
    }
    newData.labels[newIndex] += chartData.labels[index - 1]
    newData.walkedData[newIndex] = Math.round(average(walked));
    newData.ponderedData[newIndex] = Math.round(average(pondered));
    newData.ponderedDurationData[newIndex] = Math.round(average(ponderedDuration));
    newData.interactedData[newIndex] = Math.round(average(interacted));
  }
  return newData;
}


$(document).ready(function () {
  initialize();
});

function filterChartDataByDateRange(chartData, startDateString, endDateString) {
  console.log(chartData.labels);
  var filteredData = {
    labels: [],
    walkedData: [],
    interactedData: [],
    ponderedData: [],
    ponderedDurationData: []
  };
  var startDate = stringToDate(startDateString);
  var endDate = stringToDate(endDateString);
  console.log('startDate', startDate)
  console.log('endDate', endDate)
  for (var index = 0; index < chartData.labels.length; index++) {
    var dateString = chartData.labels[index];
    var date = stringToDate(dateString);
    if ((date.getTime() >= startDate.getTime()) && (date.getTime() <= endDate.getTime())) {
      filteredData.labels.push(chartData.labels[index]);
      filteredData.walkedData.push(chartData.walkedData[index]);
      filteredData.interactedData.push(chartData.interactedData[index]);
      filteredData.ponderedData.push(chartData.ponderedData[index]);
      filteredData.ponderedDurationData.push(chartData.ponderedDurationData[index]);
    }
  }
  return filteredData;
}

function initialize() {
  var shelfId;
  try {
    shelfId = parseInt($('[data-shelf-id]').data('shelf-id'))
  } catch (error) {
    var message = "Sorry, the server is currently under maintenance. Please try again later.";
    alert(message);
    console.log("Failed to get shelfId from HTML");
    console.error(error);
    $('#error-message').show();
    $('#error-message').text(message);
  }
  console.log('Shelf ID:', shelfId);
  $('#loader').show();
  getEvents(shelfId, function (data) {
    $('#loader').hide();
    if (data) {
      console.log("Data returned from API:", data);
      if (data.events.length === 0) {
        $('#error-message').show();
        $('#error-message').text('');
        return;
      }
      $('#chart-container').show();
      $('#chart-controls').show();
      $('#btn-reload').show();
      var aggregateByDaysRadio = document.getElementById('agg-days');
      var aggregateByWeeksRadio = document.getElementById('agg-weeks');
      var aggregateByMonthsRadio = document.getElementById('agg-months');
      aggregateByDaysRadio.checked = true;
      aggregateByWeeksRadio.checked = false;
      aggregateByMonthsRadio.checked = false;
      var eventsByDateString = aggregateEventsByDateString(data.events);
      var chartData = buildChartData(data.events[0].date, data.events[data.events.length - 1].date, eventsByDateString);
      var chart = createAndShowChart(chartData);
      var firstDateFromAPI = momentToDate(moment(data.events[0].date));
      var lastDateFromAPI = momentToDate(moment(data.events[data.events.length - 1].date));
      /*
        I'm using this random crap...
        https://github.com/fengyuanchen/datepicker
        ...because the alternatives (Bootstrap, jQuery UI et al.) were made by idiots.
       */
      $('#agg-start-date').val(dateToString(firstDateFromAPI));
      $('#agg-end-date').val(dateToString(lastDateFromAPI));
      $('[data-toggle="datepicker"]').datepicker({
        startDate: firstDateFromAPI,
        endDate: lastDateFromAPI
      });
      $(document).on('pick.datepicker', function (e) {
        $('[data-toggle="datepicker"]').datepicker('hide');
      });
      $('#btn-reload').on('click', function () {
        var startDateString = $('#agg-start-date').val();
        var endDateString = $('#agg-end-date').val();
        var filteredChartData = filterChartDataByDateRange(chartData, startDateString, endDateString);
        var period;
        if (aggregateByWeeksRadio.checked) {
          period = 'weeks';
        } else if (aggregateByMonthsRadio.checked) {
          period = 'months';
        } else {
          period = 'days';
        }
        var updatedChartData = aggregateChartData(filteredChartData, period);
        updateChart(chart, updatedChartData);
      });
    } else {
      var msg = 'Network failure. Please try again in a few minutes.';
      alert(msg);
      console.error("Failed to get events data from API.");
      $('#error-message').show();
      $('#error-message').text(msg);
    }
  });
}
