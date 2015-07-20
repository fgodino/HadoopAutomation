
var Notification = window.Notification || window.mozNotification || window.webkitNotification;

Notification.requestPermission(function (permission) {

});

function showNotification(name, status) {

  var instance = new Notification(
    "Process finished", {
      body: "Process " + name + " finished with status " + status,
      icon: "/img/iitlogo.png"
    }
  );

  instance.onclick = function () {
    // Something to do
  };
  instance.onerror = function () {
    // Something to do
  };
  instance.onshow = function () {
    // Something to do
  };
  instance.onclose = function () {
    // Something to do
  };

  return false;
}


var socket = io();

socket.on('updateStatus', function (msg) {

  var splitted = msg.split(':');
  var id = splitted[0];
  var state = splitted[1];

  var name = $('#' + id + ' .processName').text();

  console.log(state);

  if (state === 'SUCCESS' || state === 'FAILED') {
    if (state === 'SUCCESS') {
      $('#' + id + ' .download').prop('disabled', false);
    }

    $('#' + id + ' .relaunch').prop('disabled', false);
    showNotification(name, state);
  }

  $('#' + id + ' .status').text(state);
});

function addProcess () {
  console.log('entra')
  $('#showProcesses').hide();
  $('#newProcess').show();
}

function addJob () {
  console.log('entra')
  $('#showJobs').hide();
  $('#newJob').show();
}

function addDataset () {
  $('#showDatasets').hide();
  $('#newDataset').show();
}

function downloadDataset (elem) {
  var url = '/datasets/' + elem.value;
  window.location.href = url;
}

function downloadJob (elem) {
  var url = '/jobs/' + elem.value;
  window.location.href = url;
}

function downloadProcess (elem) {
  var url = '/processes/' + elem.value;
  window.location.href = url;
}

function deleteJob (elem) {
  var url = '/jobs/' + elem.value;
  $.ajax({
  url: url,
    type: 'DELETE',
    success: function(result) {
      location.reload();
    }
  });
}

function deleteDataset (elem) {
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

function deleteProcess (elem) {
  var url = '/processes/' + elem.value;
  $.ajax({
  url: url,
    type: 'DELETE',
    success: function(result) {
      location.reload();
    }
  });
}

function relaunchProcess (elem) {
  var url = '/processes/' + elem.value;
  $.ajax({
  url: url,
    type: 'PUT',
    success: function(result) {
      location.reload();
    }
  });
}

