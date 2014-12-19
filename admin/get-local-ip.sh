#!/bin/sh
/sbin/ifconfig wlan0 | awk '/inet addr/{print substr($2,6)}'
