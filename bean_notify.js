var noble = require('noble');
var moment = require('moment');

var serviceUuids = ['a495ff20c5b14b44b5121370f02d74de'];
var charUuids = ['a495ff21c5b14b44b5121370f02d74de',
                 'a495ff22c5b14b44b5121370f02d74de',
                 'a495ff23c5b14b44b5121370f02d74de'];

function logData(logType, sensorID, logMsg) {
  var timestamp = moment().format("YYYY-MM-DD hh:mm:ss");
  console.log(timestamp + ',' +
              logType + ',' +
              sensorID + ',' +
              logMsg);
}

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    logData("Event", "System", "Bluetooth enabled.");
    noble.startScanning();
  } else {
    logData("Event", "System", "Bluetooth disabled.");
    noble.stopScanning();
  }
});

noble.on('scanStop', function() {
  logData("Event", "System", "Scanning has stopped.");
});

noble.on('scanStart', function() {
  logData("Event", "System", "Scanning has started.");
});

//var peripheralUuid = "ef7d890b8bb04cf1a1262695e62bc6a4"; // BeanSensor01
//var peripheralUuid = "b92766e2be854af3860c066c6c6e1d94"; // FrankenBean

var peripheralDisconnected = function() {
  logData("Event", this.advertisement.localName, "Lost Connection.");
  //noble.startScanning();
  this.removeAllListeners();
};

var sensor = {"name":"", "connected":false};

noble.on('discover', function(peripheral) {
  logData("Event", peripheral.advertisement.localName, "Discovered.");
  //if (peripheral.uuid === peripheralUuid) {
  if(peripheral.advertisement.localName) {
    if(peripheral.advertisement.localName.lastIndexOf("_pearl-", 0) === 0) {

      peripheral.on('disconnect', peripheralDisconnected);

      peripheral.connect(function(error) {
        if(error) {
          logData("Error", peripheral.advertisement.localName,
            "Connection Error.");
          return;
        }
        //noble.stopScanning();
        peripheral.discoverServices(serviceUuids,
          function(error, services) {
          if(error) {
            logData("Error", peripheral.advertisement.localName,
              "Unable to discover services.");
            peripheral.disconnect();
            return;
          }
          var scratchService = services[0];
          scratchService.discoverCharacteristics(charUuids,
            function(error, characteristics) {
            if(error) {
              logData("Error", peripheral.advertisement.localName,
                "Unable to discover characteristics.");
              peripheral.disconnect();
              return;
            }
            var minutesChar = characteristics[0];
            var minutes = 0;
            var tempChar = characteristics[1];
            var temp = 0;
            var voltChar = characteristics[2];
            var volts = 0;

            minutesChar.on('read', function(data, isNotification) {
              minutes = data.readUInt16BE(0);
              tempChar.read(function(error, data) {
                if(error) {
                  logData("Error", peripheral.advertisement.localName,
                    "Unable to read temp. Aborting reads.");
                  return;
                }
                //temp = data.readInt8(0);
                temp = data.readInt16BE(0);
                voltChar.read(function(error, data) {
                  if(error) {
                    logData("Error", peripheral.advertisement.localName,
                      "Unable to read voltage. Aborting reads.");
                    return;
                  }
                  volts = data.readInt16BE(0);
                  logData("Data", peripheral.advertisement.localName,
                    minutes + ',' +
                    temp + ',' +
                    (volts/100));
                });
              });
            });

            minutesChar.notify(true, function(error) {
              logData("Event", peripheral.advertisement.localName,
                "Subscribed to notification.");
            });

          });
        });
      });
    }
  }
});

// Start reading from stdin so we don't exit.
//process.stdin.resume();

process.on('SIGINT', function() {
  logData("Event", "System", "SIGINT caught.");
  exitHandler();
});

process.on('SIGTERM', function() {
  logData("Event", "System", "SIGTERM caught.");
  exitHandler();
});

process.on('uncaughtException', function(err) {
  logData("Error", "System", "Caught exception: " + err);
  exitHandler();
});

function exitHandler(options, err) {
  console.log();
  logData("Event", "System", "Shutting down.");
  /*
  if (sensor != null){
    sensor.disconnect();
  }
  */
  noble.stopScanning();
  process.exit();
}
