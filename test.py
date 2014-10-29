#from socket import (
#    socket,
#    AF_BLUETOOTH,
#    SOCK_RAW,
#    BTPROTO_HCI,
#    SOL_HCI,
#    HCI_FILTER,
#)
import socket;

addr = bytes([0xD0, 0x39, 0x72, 0xC8, 0xEB, 0x6B]);
s = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_RAW, socket.BTPROTO_HCI);

s.connect(addr);
s.close();

