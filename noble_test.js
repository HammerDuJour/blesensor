var noble = require('noble');
var scanTime = 5000;
var restTime = 600000;

var poweredOn = false;
noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    poweredOn = true;
    startScan();
  } else {
    poweredOn = false;
    noble.stopScanning();
  }
});

noble.on('scanStop', function() {
});

noble.on('scanStart', function() {
});

var peripheralDisconnected = function() {
  this.removeAllListeners();
};

function startScan() {
  if(poweredOn) {
    noble.startScanning();
    setTimeout(stopScan, scanTime);
  }
}

function stopScan() {
  noble.stopScanning();
  if(poweredOn) {
    setTimeout(startScan, restTime);
  }
}

process.on('SIGINT', function() {
  exitHandler();
});

process.on('SIGTERM', function() {
  exitHandler();
});

process.on('uncaughtException', function(err) {
  exitHandler();
});

function exitHandler(options, err) {
  noble.stopScanning();
    process.exit();
}
