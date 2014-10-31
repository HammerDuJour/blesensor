uint8_t temperature;
uint16_t minutes;
int16_t voltage;

void setup()
{
  // Bean.setBeanName("FrankenBean");
  minutes = 0;
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
  // minutes initialized to zero at startup and incremented after each sleep
  temperature = Bean.getTemperature();
  voltage = Bean.getBatteryVoltage();
  
  uint8_t buffer[2];
  
  buffer[1] = minutes & 0xFF;
  buffer[0] = minutes >> 8;
  Bean.setScratchData(1, buffer, 2);
  
  buffer[0] = temperature;
  Bean.setScratchData(2, buffer, 1);
  
  buffer[1] = voltage & 0xFF;
  buffer[0] = voltage >> 8;
  Bean.setScratchData(3, buffer, 2);
  
  Bean.sleep(60000);
  
  minutes++;
}
