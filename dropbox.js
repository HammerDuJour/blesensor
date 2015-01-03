var debug = false;

var fs = require('fs');
var path = require('path');
var prompt;
var dbox;
try {
  prompt = require('prompt');
  dbox = require('dbox');
}
catch(err) {
  console.log("Error: Missing dependency");
  console.log(err);
  process.exit();
}
var dboxKeysPath = '/home/pi/dbox_keys.txt';
var dboxTokenPath = '/home/pi/dbox_token.txt';
var dboxKeys;
try {
  dboxKeys = JSON.parse(
                 fs.readFileSync(dboxKeysPath, 'utf8'));
}
catch(err) {
  console.log("Error: Unable to open " + dboxKeysPath);
  process.exit();
}
if(debug) console.log("Debug: Keys = ");
if(debug) console.log(dboxKeys);

var dboxApp = dbox.app(dboxKeys);

function getToken(callback) {
  if(fs.existsSync(dboxTokenPath)) {
    if(debug) console.log("Debug: Access token found");
    var dboxToken = JSON.parse(fs.readFileSync(dboxTokenPath, 'utf8'));
    if(typeof callback == 'function') {
      callback(dboxToken);
    }
  } else {
    console.log("Dropbox access token required.");
    dboxApp.requesttoken(function(status, request_token) {
      if(debug) console.log("Debug: Token request status = " + status);
      if(debug) console.log("Debug: " + request_token.oauth_token);
      console.log("Grant access at: ");
      console.log("  " + request_token.authorize_url);
      prompt.start();
      prompt.get("Press enter once access is granted...", function(err, ret) {
        dboxApp.accesstoken(request_token, function(status, access_token){
          if(debug) console.log("Debug: Access request status = " + status);
          if(status == '200') {
            if(debug) console.log("Debug: Access Token =");
            if(debug) console.log(access_token);
            fs.writeFile(dboxTokenPath, 
                         JSON.stringify(access_token), function(err) {
              if(err) {
                console.log("Error: Unable to write to access token file");
                process.exit();
              }
            });
            if(typeof callback == 'function') {
              callback(access_token);
            }
          } else {
            console.log("Error: Access token request failed.");
            process.exit();
          }
        });
      });
    });
  }
}

exports.getAccount = function(callback) {
  getToken(function(token) {
    if(debug) console.log("Debug: Retrieving account data...");
    var dboxClient = dboxApp.client(token);
    
    dboxClient.account(function(status, reply) {
      if(status == '200') {
      if(debug) console.log("Debug: Account data");
      if(debug) console.log(reply);
        if(typeof callback == 'function') {
          callback(reply);
        }
      } else {
        if(debug) console.log("Debug: Error retreiving account data");
      }
    });
  });
}

exports.writeFile = function(filePath, callback) {
  fs.readFile(filePath, function(err, data) {
    if (err) {
      console.log("Error: Cannot read from " + filePath);
      callback(err);
    } else {
      var fileName = path.basename(filePath);
      getToken(function(token) {
        var dboxClient = dboxApp.client(token);
        dboxClient.put(fileName, data, function(status, reply) {
          if(status == '200') {
            callback(err);
          } else {
            callback(status);
          }
        });
      });
    }
  });
}

exports.checkTokens = function() {
  getToken(function(token) {
    console.log("Dropbox token check complete");
  });
}
