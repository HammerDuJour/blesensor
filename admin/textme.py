#! /usr/bin/env python
#****************************************************************************
#* file: textme.py
#* author: Tom Propst
#* Sends the message passed after -m as an SMS to the number specified
#* in the configuration file.
#* By default, ~/twilio.conf is used as the configuration file unless
#* another file is specified after the -c option.
#****************************************************************************

import sys
import subprocess
import urllib
import urllib2
import xml.etree.ElementTree as ET
import socket
import getopt
from os.path import expanduser

home = expanduser('~')

try:
    opts, args = getopt.getopt(sys.argv[1:], 'c:m:')
except getopt.GetoptError as err:
    print str(err)
    sys.exit(2)

# Twilio stuff
# You must have a file listed below that contains 4 lines for:
# Twilio Account SID
# Twilio Authentication Token
# Twilio Phone Number
# Recipient Phone Number
twilioConfigFile = home + '/twilio.conf'
msgBody = '<empty message>'

for o, a in opts:
    if o == '-c':
        twilioConfigFile = a
    elif o == '-m':
        msgBody = a
    else:
        assert False, 'unhandled exception'

hostName = socket.gethostname()
msgBody = hostName + ': ' + msgBody

# if len(sys.argv) > 1:
#     msgBody = hostName + ": " + sys.argv[1]
# else:
#     msgBody = hostName + ": <empty message>"

try:
    params = [line.strip() for line in open(twilioConfigFile)]
except:
    raise

if len(params) >= 4:
    accountSid = params[0]
    authToken = params[1]
    fromNum = params[2]
    toNum = params[3]
else:
    print 'Invalid configuration file ' + twilioConfigFile
    sys.exit(2)

baseUrl = 'https://api.twilio.com/2010-04-01/Accounts/' + \
    accountSid +  '/SMS/Messages'
parameters = {'From' : fromNum,
              'To' : toNum,
              'Body' : msgBody}

data = urllib.urlencode(parameters)
req = urllib2.Request(baseUrl, data)
password_mgr = urllib2.HTTPPasswordMgrWithDefaultRealm()
password_mgr.add_password(None, baseUrl, accountSid, authToken)
handler = urllib2.HTTPBasicAuthHandler(password_mgr)
opener = urllib2.build_opener(handler)

# Install the opener.
# Now all calls to urllib2.urlopen use the opener.
urllib2.install_opener(opener)

response = urllib2.urlopen(req)
result = response.read()

resultElements = ET.ElementTree(ET.fromstring(result))
resultRoot = resultElements.getroot()
for status in resultRoot.iter('Status'):
    print 'Msg Status: ' + status.text

