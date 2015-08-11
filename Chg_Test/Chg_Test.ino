int16_t voltage;

boolean debug = true;

const int chgPin = 0;

void setup()
{
  // Bean.setBeanName("FrankenBean");
  if(debug){
    Serial.begin(9600);
    Serial.println("Bean_Sensor: Initializing.");
  }
  pinMode(chgPin, INPUT_PULLUP);
}

void loop()
{
  Bean.setLed(0, 0, 255);  // Set LED to blue when reading

  //temperature = Bean.getTemperature();
  voltage = Bean.getBatteryVoltage();
  if(debug){Serial.print("Voltage      = "); Serial.println((float)voltage/100.00);}
  
  if(digitalRead(chgPin)) {
    Bean.setLed(0, 255, 0);  // Green when powered and not charging
  } else {
    Bean.setLed(255, 0, 0);  // Red when charging
  }
  if(debug){Serial.print("Chg          = "); Serial.println(digitalRead(chgPin));}
  // Bean.setLed(0, 0, 0);
  
  if(debug){Bean.sleep(5000);}
  else {Bean.sleep(60000);}
}
