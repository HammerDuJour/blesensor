#!/bin/sh
#*** The below awk expression is tenuous and does not work on Mac
/sbin/ifconfig wlan0 | awk '/inet addr/{print substr($2,6)}'
#*** This one is for the Mac
#/sbin/ifconfig en0 | awk '/inet /{print substr($2,1)}'
