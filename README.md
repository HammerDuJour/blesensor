# BLE Sensor
-------------
A system for collecting data from Bluetooth Smart (BLE) sensors. The system consists of:
- A Node.JS application that runs on an Internet-connected platform with BLE capabilities.  Currently only Mac OS X and Linux are tested.
- A BLE sensor, specifcally the LightBlue Bean by Punchthrough Designs running the Bean\_Sensor\_MLX90614 Arduino code.
- A Dropbox account with an app registered for use with this system and the associated keys configured as described below.  See the [Dropbox documentation](https://www.dropbox.com/developers/reference/devguide) for more information.


This is a work in progress and currently designed for a specific application. Over time it will become more generic and flexible but currently requires very specific hardware and associated configuration.
## Installation
````
npm install
````
## Operation
The file [config-example.json](https://github.com/tompropst/datasharing) shows the parameters that should be set for your environment and needs. You must create a ````config.json```` file for your system in the same format. If running as a service, it is best to use abosolute paths. Be sure to store the Dropbox keys and tokens in a safe location. For information on these items, the JSON format, etc, please see the [dbox](https://github.com/sintaxi/dbox) documentation.

Once configured, you launch the app as:
````
node bean_notify.js
````
All data and events are written to a single log file named for the system the script is running on and the date / time the file is started. A new file is created according to the interval specified in the ````config.json```` file. When a new log file is created, the previous file is uploaded to Dropbox.

Sensors should have the Arduino code loaded and a unique Local Name should be assiged to each sensor with the appropriate prefix to denote that the sensor belongs to this system (currently ````_pearl-````). Sensors are scanned for periodically and if discovered, we subscribe to notifications for new data.
