#!/bin/sh

while true; do
   TIMESTAMP=$(TZ=America/Denver date +"%Y-%m-%d %H:%M:%S %Z")
   # Connect to the MAC of the device and read the battery characteristic.
   BATT=$(gatttool -b D0:39:72:C8:EB:6B --char-read -a 0x0048)
   # The string substitution below was discovered at:
   # http://mywiki.wooledge.org/BashFAQ/100
   # Strip off just the value and add "0x" to represent hex.
   BATT=0x${BATT##*: }
   # Convert to a decimal.
   BATT=$(printf "%d" $BATT)
   echo $TIMESTAMP, $BATT%
   sleep 60
done
