#include <Wire.h>
#include <Adafruit_MLX90614.h>

float ambTemp;
float objTemp;
int16_t objTempInt;
uint16_t minutes;
int16_t voltage;

boolean debug = false;
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

void setup()
{
  // Bean.setBeanName("FrankenBean");
  minutes = 0;
  if(debug){
    Serial.begin(9600);
    Serial.println("Bean_Sensor: Initializing.");
  }
  mlx.begin();  
}

void loop()
{
  /* Battery precentage is available through a standard Battery service (0x180F).
   * https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.battery_service.xml
   * minutes: number of minutes running, written to scratch 1.
   * temperature: temperature from LBM313 BLE module, written to scratch 2.
   * voltage: battery voltage, written to scratch 3.
   * NOTE: gatttool reads the data from the scratch areas MSB to LSB but
   *       setScratchData writes it from a buffer starting at index 0 from left
   *       to right so I'm writing the MSB into index 0 of the buffer.
  */

  Bean.setLed(255, 0, 0);

  // minutes initialized to zero at startup and incremented after each sleep
  //temperature = Bean.getTemperature();
  if(debug){Serial.print("Running "); Serial.print(minutes); Serial.println(" minutes");}
  ambTemp = mlx.readAmbientTempC();
  if(debug){Serial.print("Amb Temp     = "); Serial.println(ambTemp);}
  objTemp = mlx.readObjectTempC();
  if(objTemp >= 0) { objTempInt = (int16_t)(objTemp + 0.5); }
  else { objTempInt = (int16_t)(objTemp - 0.5); }
  if(debug){Serial.print("Obj Temp     = "); Serial.println(objTemp);}
  if(debug){Serial.print("Obj Temp Int = "); Serial.println(objTempInt);}
  voltage = Bean.getBatteryVoltage();
  if(debug){Serial.print("Voltage      = "); Serial.println((float)voltage/100.00);}
  
  uint8_t buffer[2];
  
  buffer[1] = minutes & 0xFF;
  buffer[0] = minutes >> 8;
  Bean.setScratchData(1, buffer, 2);
  
  buffer[1] = objTempInt & 0xFF;
  buffer[0] = objTempInt >> 8;
  Bean.setScratchData(2, buffer, 2);
  
  buffer[1] = voltage & 0xFF;
  buffer[0] = voltage >> 8;
  Bean.setScratchData(3, buffer, 2);

  Bean.setLed(0, 0, 0);
  
  if(debug){Bean.sleep(5000);}
  else {Bean.sleep(60000);}
  
  minutes++;
}
