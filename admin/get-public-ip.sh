#!/bin/sh
#*****************************************************************************
#* file: get-public-ip.sh
#* author: Tom Propst
#* Returns the public IP address of the machine stripped from the response 
#* from http://checkip.dyndns.org.
#*****************************************************************************

URL="http://checkip.dyndns.org"

if RESP=$(wget -qO - $URL); then
   RESP=${RESP##*: }
   # For some reason, the next line only works when I add more than one 
   # character to the pattern starting with the '<' character.
   RESP=${RESP%\</body*}
   echo $RESP
else
   echo "Error accessing $URL" 1>&2
   exit 1
fi
