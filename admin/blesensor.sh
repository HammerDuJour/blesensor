#! /bin/sh
 
### BEGIN INIT INFO
# Provides:          blesensor
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
### END INIT INFO
 
# change this to wherever your node app lives # 
path_to_node_app=/home/pi/blesensor/bean_notify.js
 
# Carry out specific functions when asked to by the system
case "$1" in
  start)
    echo "* starting blesensor * "
    echo "* starting blesensor * [`date`]" >> /var/log/blesensor.log
    /usr/local/bin/node $path_to_node_app >> /dev/null 2>&1&
#    /usr/local/bin/node $path_to_node_app >> /var/log/blesensor.log 2>&1&
    ;;
  stop)
    echo "* stopping blesensor * "
    echo "* stopping blesensor * [`date`]" >> /var/log/blesensor.log
    killall /usr/local/bin/node
    ;;
  *)
    echo "Usage: /etc/init.d/blesensor {start|stop}"
    exit 1
    ;;
esac
 
exit 0
