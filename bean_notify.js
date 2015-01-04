var noble = require('noble');
var moment = require('moment');
var schedule = require('node-schedule');
var os = require('os');
var fs = require('fs');
var dropbox = require('./dropbox.js');

dropbox.checkTokens();

// *** These are UUID's specific to the LightBlue Bean
// *** The service is the "Scratch" servie
var serviceUuids = ['a495ff20c5b14b44b5121370f02d74de'];
// *** These are the Scratch Characteristics being used for:
//     - Nunmber of minutes running (e.g. battery use)
//     - Object temperature (IR)
//     - Bean battery voltage
var charUuids = ['a495ff21c5b14b44b5121370f02d74de',
                 'a495ff22c5b14b44b5121370f02d74de',
                 'a495ff23c5b14b44b5121370f02d74de'];

// *** The log file will contain all types of events including data.
// *** Each log file update creates a new, timestamped file and attempts to
//     upload the previous file to Dropbox.
var logPath = "./logs/";
var logFile;
function logFileUpdate(callback) {
  var filePath = logPath + logFile;
  if(fs.existsSync(filePath)) {
    dropbox.writeFile(filePath, function(err) {
      if(err) {
        logData("Error", "System", "Unable to upload " + filePath);
      } else {
        fs.unlink(filePath, function(err) {
	  if(err) logData("Error", "System", "Unable to delete " + filePath);
	});
      }
      if(typeof(callback) == 'function') {
        callback();
      }
    });
  }
  logFile = os.hostname() + '_' + moment().format("YYYY-MM-DD_HH-mm") + '.csv';
}

logFileUpdate();

console.log("File name = " + logFile);

var logRule = new schedule.RecurrenceRule();

// Various rules for rolling over the log:
//logRule.hour = 0;                          // Every day at midnight
//logRule.minute = [0, 10, 20, 30, 40, 50];  // Every ten minutes
logRule.minute = 0;                        // Every hour on the hour
//logRule.second = 0;                        // Every minute on the minute

var logRoll = schedule.scheduleJob(logRule, logFileUpdate);

function logData(logType, sensorID, logMsg) {
  var timestamp = moment().format("YYYY-MM-DD HH:mm:ss Z");
  var logString = timestamp + ',' +
                  logType + ',' +
                  sensorID + ',' +
                  logMsg;
  console.log(logString);
  fs.appendFile(logPath+logFile, logString + '\n', function (err) {
    if(err){
      console.log(timestamp + ',' +
                  "Error" + ',' +
                  "System" + ',' +
                  "Error writing log file: " + err);
    }
  });
}

// *** Track the state of the BT radio. If it is off, not much will happen.
var poweredOn = false;

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    logData("Event", "System", "Bluetooth enabled.");
    poweredOn = true;
    startScan();
  } else {
    logData("Event", "System", "Bluetooth disabled.");
    poweredOn = false;
    noble.stopScanning();
  }
});

noble.on('scanStop', function() {
  logData("Event", "System", "Scanning has stopped.");
});

noble.on('scanStart', function() {
  logData("Event", "System", "Scanning has started.");
});

var peripheralDisconnected = function() {
  logData("Event", this.advertisement.localName, "Lost Connection.");
  this.removeAllListeners();
};

var scanTime = 30000;  // Time (ms) spent scanning for devices
var scanInt = 300000;  // Time (ms) between scans
function startScan() {
  if(poweredOn) {
    noble.startScanning();
    setTimeout(stopScan, scanTime);
  }
}

function stopScan() {
  noble.stopScanning();
  if(poweredOn) {
    setTimeout(startScan, scanInt);
  }
}

// *** This is where the magic happens.  
noble.on('discover', function(peripheral) {
  logData("Event", peripheral.advertisement.localName, "Discovered.");

  // *** Use the local name in the BLE advertisement to find our devices
  //     with a prefix of "_pearl-".
  if(peripheral.advertisement.localName) {
    if(peripheral.advertisement.localName.lastIndexOf("_pearl-", 0) === 0) {

      peripheral.on('disconnect', peripheralDisconnected);

      peripheral.connect(function(error) {
        if(error) {
          logData("Error", peripheral.advertisement.localName,
            "Connection Error.");
          return;
        }
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

	    // *** This fires each time a notification is received. We're
	    //     subscribing to changes in the "minutes".
            minutesChar.on('read', function(data, isNotification) {
              minutes = data.readUInt16BE(0);
              tempChar.read(function(error, data) {
                if(error) {
                  logData("Error", peripheral.advertisement.localName,
                    "Unable to read temp. Aborting reads.");
                  return;
                }
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
// We don't need this the scheduling / timers above run forever.
//process.stdin.resume();

process.on('SIGINT', function() {
  console.log();
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
  logData("Event", "System", "Shutting down.");
  noble.stopScanning();
  logFileUpdate(function() {
    process.exit();
  });
}
