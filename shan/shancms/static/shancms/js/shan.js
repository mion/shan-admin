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
          labels: chartData.labels,
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
  return moment(date).format('MMM D');
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
  chart.data.labels = chartData.labels;
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

function initialize() {
  window.moment = moment;
  window.aggregateEventsByDateString = aggregateEventsByDateString;
  window.buildChartData = buildChartData;

  var shelfId = 1;

  getEvents(shelfId, function (data) {
    if (data) {
      console.log(data);
      window.data = data;
      var eventsByDateString = aggregateEventsByDateString(data.events);
      var chartData = buildChartData(data.events[0].date, data.events[data.events.length - 1].date, eventsByDateString);
      var chart = createAndShowChart(chartData);
      /*
        I'm using this random crap...
        https://github.com/fengyuanchen/datepicker
        ...because Bootstrap, jQuery UI et al was made by idiots.
       */
      $('[data-toggle="datepicker"]').datepicker();
      $('#agg-fieldset').show();
      $('#agg-days').on('click', function () {
        var updatedChartData = aggregateChartData(chartData, 'days');
        updateChart(chart, updatedChartData);
      });
      $('#agg-weeks').on('click', function () {
        var updatedChartData = aggregateChartData(chartData, 'weeks');
        updateChart(chart, updatedChartData);
      });
      $('#agg-months').on('click', function () {
        var updatedChartData = aggregateChartData(chartData, 'months');
        updateChart(chart, updatedChartData);
      });
    } else {
      alert('Error getting events.');
    }
  })
}
