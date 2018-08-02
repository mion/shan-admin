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

function showChart(chartData) {
  var ctx = document.getElementById("myChart").getContext('2d');
  var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: chartData.labels,
          datasets: [
            {
              label: 'Walked',
              backgroundColor: 'rgba(255, 0, 0)',
              borderColor: 'rgba(255, 0, 0)',
              data: chartData.walkedData,
              fill: false
            },
            {
              label: 'Pondered',
              backgroundColor: 'rgba(0, 255, 0)',
              borderColor: 'rgba(0, 255, 0)',
              data: chartData.ponderedData,
              fill: false
            },
            {
              label: 'Pondered Duration',
              backgroundColor: 'rgba(255, 255, 0)',
              borderColor: 'rgba(255, 255, 0)',
              data: chartData.ponderedDurationData,
              fill: false
            },
            {
              label: 'Interacted',
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
}

function momentToDate(m) {
  return new Date(m.year(), m.month(), m.date());
}

function dateToString(date) {
  return moment(date).format('MMM D YYYY');
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

window.moment = moment;
window.aggregateEventsByDateString = aggregateEventsByDateString;
window.buildChartData = buildChartData;

getEvents(1, function (data) {
  if (data) {
    console.log(data);
    window.data = data;
    var eventsByDateString = aggregateEventsByDateString(data.events);
    var chartData = buildChartData(data.events[0].date, data.events[data.events.length - 1].date, eventsByDateString);
    showChart(chartData);
  } else {
    alert('Error getting events.');
  }
})