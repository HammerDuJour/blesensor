#include <Wire.h>

#define I2C_ADDR 0x5A
#define AMBT_ADDR 0x06
#define OBJT_ADDR 0x07
#define SLEEP_CMD 0xFF

boolean debug = true;

void setup()
{
  if(debug)
  {
    Serial.begin(9600);
    Serial.println("Bean_Temp_MLX90614 starting.");
    Serial.println("Wire.begin()");
  }
  Wire.begin();
}

void loop()
{
  if(debug)
  {
    Serial.println("Begin loop:");
  }
  
  Bean.sleep(10000);
}
