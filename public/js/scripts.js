var socket = io();

socket.on('updateStatus', function (msg) {

  var splitted = msg.split(':');
  var id = splitted[0];
  var state = splitted[1];

  $(id).val(state);
});

var addProcess = function () {
  console.log('entra')
  $('#showProcesses').hide();
  $('#newProcess').show();
}

var addJob = function () {
  console.log('entra')
  $('#showJobs').hide();
  $('#newJob').show();
}

var addDataset = function () {
  console.log('entra')
  $('#showDatasets').hide();
  $('#newDataset').show();
}

var downloadDataset = function (elem) {
  var url = '/datasets/' + elem.value;
  window.location.href = url;
}

var downloadJob = function (elem) {
  var url = '/jobs/' + elem.value;
  window.location.href = url;
}

var downloadProcess = function (elem) {
  var url = '/processes' + elem.value;
  window.location.href = url;
}

var deleteJob = function (elem) {
  var url = '/jobs/' + elem.value;
  $.ajax({
  url: url,
    type: 'DELETE',
    success: function(result) {
      location.reload();
    }
  });
}

var deleteDataset = function (elem) {
  var url = '/datasets/' + elem.value;
  console.log(url);
  $.ajax({
  url: url,
    type: 'DELETE',
    success: function(result) {
      location.reload();
    }
  });
}

var deleteProcess = function (elem) {
  var url = '/processes/' + elem.value;
  console.log(url);
  $.ajax({
  url: url,
    type: 'DELETE',
    success: function(result) {
      location.reload();
    }
  });
}
