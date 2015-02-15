var noble = require('noble');
var moment = require('moment');
var schedule = require('node-schedule');
var os = require('os');
var fs = require('fs');
var dropbox = require('./dropbox.js');
var exec = require('child_process').exec;

var configPath = __dirname + '/config.json';
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('*** Configuration ***');
  console.log('  Log Path       : ' + config.logPath);
  console.log('  DBox Key Path  : ' + config.dboxKeyPath);
  console.log('  DBox Token Path: ' + config.dboxTokenPath);
  console.log('  Log Roll Int   : ' + config.logRollIntMins + ' min');
  console.log('  Scan Time      : ' + config.scanTimeSecs + ' sec');
  console.log('  Scan Int       : ' + config.scanIntSecs + ' sec');
  console.log('  Disconnect SMS : ' + config.discSMS);
  console.log('  Twilio config  : ' + config.twilioConfPath);
  console.log('  subscribe/poll : ' + config.subPoll);
  console.log('  Sensor prefix  : ' + config.prefix);
  console.log('  Verbose        : ' + config.verbose);
}
catch(err) {
  console.log("Error: Unable to parse " + configPath);
  console.log(err);
  process.exit();
}

dropbox.checkTokens(config.dboxKeyPath, config.dboxTokenPath);

// *** These are UUID's specific to the LightBlue Bean
// *** The service is the "Scratch" service
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
var logFile;
function logFileUpdate(callback) {
  logFile = os.hostname() + '_' + moment().format("YYYY-MM-DD_HH-mm") + '.csv';
  console.log("New log file = " + logFile);
  fs.readdir(config.logPath, function(err, fileList) {
    if(err) {
      logData("Error", "System", "Unable to read log directory " + 
        config.logPath);
      return;
    }
    var uploadAttempts = 0;
    fileList.forEach(function(file) {
      if(file == logFile) { // Skip the current log file if it was created
                            // right away.
        uploadAttempts++;
      } else {
        dropbox.writeFile(config.logPath + file, function(err) {
	  uploadAttempts++;
          if(err) {
            logData("Error", "System", "Unable to upload " + file);
          } else {
            fs.unlink(config.logPath + file, function(err) {
              if(err) logData("Error", "System", "Unable to delete " + file);
            });
          }
	  // Call the callback after the last file upload attempt finishes
          if(typeof(callback) == 'function' && 
	    uploadAttempts == fileList.length) {
            callback();
          }
        });
      }
    });
  });
}

logFileUpdate();

// *** Use node-schedule below instead of setInterval if you want logs to
//     roll over at specific times of day.
/*
var logRule = new schedule.RecurrenceRule();

// Various rules for rolling over the log:
//logRule.hour = 0;                          // Every day at midnight
//logRule.minute = [0, 10, 20, 30, 40, 50];  // Every ten minutes
logRule.minute = 0;                        // Every hour on the hour
//logRule.second = 0;                        // Every minute on the minute

var logRoll = schedule.scheduleJob(logRule, logFileUpdate);
*/

// *** Set the log rollover interval (in ms)
//     mm*ss*1000
setInterval(logFileUpdate, config.logRollIntMins*60*1000);

function logData(logType, sensorID, logMsg) {
  if(config.verbose || logType == "Data" || logType == "Error") {
    var timestamp = moment().format("YYYY-MM-DD HH:mm:ss Z");
    var logString = timestamp + ',' +
                    logType + ',' +
                    sensorID + ',' +
                    logMsg;
    console.log(logString);
    fs.appendFile(config.logPath+logFile, logString + '\n', function (err) {
      if(err){
        console.log(timestamp + ',' +
                    "Error" + ',' +
                    "System" + ',' +
                    "Error writing log file: " + err);
      }
    });
  }
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
  logData("Event", this.advertisement.localName,
    "Lost Connection.");
  if(config.discSMS) {
    exec(__dirname + '/admin/textme.py -c ' + config.twilioConfPath +
      ' -m "Lost "' + 
      this.advertisement.localName, function(error, stdout, stderr) {
      logData("Event", "textme.py", stdout);
    });
  }
  this.removeAllListeners();
};

function startScan() {
  if(poweredOn) {
    noble.startScanning();
    setTimeout(stopScan, config.scanTimeSecs*1000);
  }
}

function stopScan() {
  noble.stopScanning();
  if(poweredOn) {
    setTimeout(startScan, config.scanIntSecs*1000);
  }
}

// *** This is where the magic happens.  
noble.on('discover', function(peripheral) {
  logData("Event", peripheral.advertisement.localName,
    "Discovered.");

  // *** Use the local name in the BLE advertisement to find our devices
  //     with a prefix of "_pearl-".
  if(peripheral.advertisement.localName) {
    if(peripheral.advertisement.localName.lastIndexOf(config.prefix, 0) === 0) {
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

	    if(config.subPoll == "subscribe") {
	      // *** This fires each time a notification is received. We're
	      //     subscribing to changes in the "minutes".
              minutesChar.on('read', function(data, isNotification) {
                minutes = data.readUInt16BE(0);
                tempChar.read(function(error, data) {
                  if(error) {
                    logData("Error", peripheral.advertisement.localName,
                      "Unable to read temp. Aborting reads.");
                    peripheral.disconnect();
                    return;
                  }
                  temp = data.readInt16BE(0);
                  voltChar.read(function(error, data) {
                    if(error) {
                      logData("Error", peripheral.advertisement.localName,
                        "Unable to read voltage. Aborting reads.");
                      peripheral.disconnect();
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
                logData("Event",
		  peripheral.advertisement.localName,
                  "Subscribed to notification.");
              });
            } else {
	      minutesChar.read(function(error, data) {
                if(error) {
                  logData("Error", peripheral.advertisement.localName,
                    "Unable to read temp. Aborting reads.");
                  peripheral.disconnect();
                  return;
		}
                minutes = data.readUInt16BE(0);
                tempChar.read(function(error, data) {
                  if(error) {
                    logData("Error", peripheral.advertisement.localName,
                      "Unable to read temp. Aborting reads.");
                    peripheral.disconnect();
                    return;
                  }
                  temp = data.readInt16BE(0);
                  voltChar.read(function(error, data) {
                    if(error) {
                      logData("Error", peripheral.advertisement.localName,
                        "Unable to read voltage. Aborting reads.");
                      peripheral.disconnect();
                      return;
                    }
                    volts = data.readInt16BE(0);
                    logData("Data", peripheral.advertisement.localName,
                      minutes + ',' +
                      temp + ',' +
                      (volts/100));
                    peripheral.disconnect();
	          });
                });
              });
	    }
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
