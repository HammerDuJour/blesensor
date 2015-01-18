#!/bin/sh
#****************************************************************************
#* file: check-ip.sh
#* author: Tom Propst
#* Checks for /tmp/curr_pub_ip.txt and sets it to the new public IP if it has
#* changed.
#* Checks for /tmp/curr_loc_ip.txt and sets it to the new local IP if it has
#* changed.
#* Uncommenting the textme.py line will cause a text message to be sent when
#* a change occurs.
#****************************************************************************

IPFILE="/tmp/curr_pub_ip.txt"
LOCFILE="/tmp/curr_loc_ip.txt"
NEWIP=$($(dirname "$0")/get-public-ip.sh)
NEWLOCIP=$($(dirname "$0")/get-local-ip.sh)

CURRIP=$(cat $IPFILE 2>/dev/null)
#*** Ignore cases when obtaining the public IP fails
if [ "$NEWIP" == "" ]; then
   NEWIP=$CURRIP
fi
CURRLOCIP=$(cat $LOCFILE 2>/dev/null)

if [ "$CURRIP" != "$NEWIP" ] || [ "$CURRLOCIP" != "$NEWLOCIP" ]; then
   echo $NEWIP > $IPFILE
   echo $NEWLOCIP > $LOCFILE
#   $(dirname "$0")/textme.py -m "Pub: $NEWIP Loc: $NEWLOCIP" > /dev/null
fi
