<table>
<tr><td>Project:</td><td>BLE Sensor</td>
</table>

Goal
----
The goal of this project is to implement a system to collect arbitrary data at physically diverse locations and wirelessly aggregate the data in a central location where it can be analyzed with common tools.

Operation
---------
1. Build and configure sensor node with appropriate sensor circuitry (e.g. LightBlue Bean BLE device with IR temp sensor).
1. Program sensor node to read and advertise sensor data (e.g. Bean\_Sensor\_MLX90614).
1. Set the advertisement name of the sensor with an application specific prefix (e.g. \_pearl-) to associate it with the polling application.
1. Deploy aggregation nodes and run a polling application to discover, log, and monitor sensor nodes (e.g. bean\_notify.js).
1. Connect aggregation nodes to a central database to store readings from all sensor nodes. Today, bean\_notify.js will attempt to upload each log file to Dropbox each time a new log file is created. If valid Dropbox account details are not provided in these files, you will be prompted to authorize the app with Dropbox:
   -- dbox\_keys.txt - App specific keys from the developer's account.
   -- dbox\_tokey.txt - Authorization token programmatically generated and tied to the user's account.
1. Filter out duplicate readings from aggregation nodes that detect duplicate sensor nodes.

Design Choices
--------------
- **Sensor Nodes:** [LightBlue Bean by Punchthrough Designs](https://punchthrough.com/bean/).
   - Provides 5 scratch BLE services that can be easily manipulated through Arduino code to advertise custom data.
- **Aggregator:** Node.js
   - Common JS syntax.
   - Native network / HTTP support.
   - Vogue.
- **Sensor Identifiers:** BLE advertisement name
   - Easily set with the LightBlue app but that only runs on Mac (I think).

Tasks
--------------
- [x] Create daily log files.
   - Actually using hourly now but this is configurable.
- [x] Push daily log files to Dropbox.
- [ ] Test the Dropbox data API as an alternative to files.
