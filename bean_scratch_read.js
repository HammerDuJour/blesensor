var noble = require('noble');
var moment = require('moment');

var serviceUuids = ['a495ff20c5b14b44b5121370f02d74de'];
var charUuids = ['a495ff21c5b14b44b5121370f02d74de',
                 'a495ff22c5b14b44b5121370f02d74de',
                 'a495ff23c5b14b44b5121370f02d74de'];

var sensor;

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    noble.startScanning();
  } else {
    noble.stopScanning();
  }
});

var peripheralUuid = "ef7d890b8bb04cf1a1262695e62bc6a4";

noble.on('discover', function(peripheral) {
  if (peripheral.uuid === peripheralUuid) {
    noble.stopScanning();

    sensor = peripheral;
    sensor.connect(function(error) {
      if(error) {
        console.log('Connection error.');
        return;
      }
      sensor.discoverServices(serviceUuids,
        function(error, services) {
        if(error) {
          console.log('Unable to discover services.');
          sensor.disconnect();
          return;
        }
        var scratchService = services[0];
        scratchService.discoverCharacteristics(charUuids,
          function(error, characteristics) {
          if(error) {
            console.log('Unable to discover characteristics.');
            sensor.disconnect();
            return;
          }
          var minutesChar = characteristics[0];
          var minutes = 0;
          var tempChar = characteristics[1];
          var temp = 0;
          var voltChar = characteristics[2];
          var volts = 0;
          minutesChar.read(function(error, data) {
            if(error) {
              console.log('Unable to read minutes. Aborting reads.');
              sensor.disconnect();
              return;
            }
            minutes = data.readInt16BE(0);
            tempChar.read(function(error, data) {
              if(error) {
                console.log('Unable to read temp. Aborting reads.');
                sensor.disconnect();
                return;
              }
              temp = data.readInt8(0);
              voltChar.read(function(error, data) {
                if(error) {
                  console.log('Unable to read voltage. Aborting reads.');
                  sensor.disconnect();
                  return;
                }
                volts = data.readInt16BE(0);
                timestamp = moment().format("YYYY-MM-DD hh:mm:ss");
                console.log(timestamp + ',' +
                            minutes + ',' +
                            temp + ',' +
                            (volts/100));
                sensor.disconnect();
                sensor = null;
              });
            });
          });
        });
      });
    });
  }
});

// Start reading from stdin so we don't exit.
process.stdin.resume();

process.on('SIGINT', function() {
  exitHandler();
});

function exitHandler(options, err) {
  console.log();
  console.log('Shutting down...');
  if (sensor != null){
    sensor.disconnect();
  }
  noble.stopScanning();
  process.exit();
}
