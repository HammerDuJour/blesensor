#!/bin/sh

while true; do
   # Date / time formatting from this site:
   # http://tldp.org/LDP/abs/html/timedate.html
   TIMESTAMP=$(TZ=America/Denver date +"%Y-%m-%d %H:%M:%S %Z")

   # Connect to the MAC of the device and read the battery characteristic.
   BATT=$(gatttool -b D0:39:72:C8:EB:6B --char-read -a 0x0048)
   # The string substitution below was discovered at:
   # http://mywiki.wooledge.org/BashFAQ/100
   # Strip off just the value and add "0x" to represent hex.
   BATT=0x${BATT##*: }
   # Convert to a decimal.
   BATT=$(printf "%d" $BATT)

   # Connect to the MAC of the device and read the scratch 1 characteristic.
   VALUE=$(gatttool -b D0:39:72:C8:EB:6B --char-read -a 0x0033)
   VALUE=0x$(echo ${VALUE##*: } | tr -d ' ')
   VALUE=$(printf "%d" $VALUE)

   # Connect to the MAC of the device and read the scratch 1 characteristic.
   TEMP=$(gatttool -b D0:39:72:C8:EB:6B --char-read -a 0x0037)
   TEMP=0x${TEMP##*: }
   TEMP=$(printf "%d" $TEMP)

   # Connect to the MAC of the device and read the scratch 1 characteristic.
   VOLT=$(gatttool -b D0:39:72:C8:EB:6B --char-read -a 0x003B)
   VOLT=0x$(echo ${VOLT##*: } | tr -d ' ')
   VOLT=$(printf "%d" $VOLT)
   # Use bc to evaluate VOLT/100 to 2 decimal places.
   VOLT=$(echo "scale=2;$VOLT/100" | bc -l)

   echo $TIMESTAMP, $VALUE min, $BATT%, $TEMP deg, $VOLT V

   sleep 60
done
