#include <stdio.h>
#include <inttypes.h>

int main()
{
  float myPosFloat = 130.37;
  float myNegFloat = -20.73;
  int16_t myPosInt = (int16_t)(myPosFloat + 0.5);
  int16_t myNegInt = (int16_t)(myNegFloat - 0.5);
  uint16_t twoBytes;
  uint8_t twoByteBuffer[2];

  twoBytes = 355;
  printf("twoBytes = %x\n", twoBytes);
  printf("myPosFloat = %f\n", myPosFloat);
  printf("myPosInt = %d\n", myPosInt);
  printf("myNegInt = %d\n", myNegInt);

  printf("myNegFloat = %f\n", myNegFloat);
  printf("sizeof myPosFloat = %lu\n", sizeof(myPosFloat));
  printf("sizeof myPosInt = %lu\n", sizeof(myPosInt));
/*

  printf("twoBytes & 0xFF = %x\n", twoBytes & 0xFF);

  printf("Assigning each byte to the buffer...\n");
  twoByteBuffer[0] = twoBytes;
  twoByteBuffer[1] = twoBytes >> 8;
  printf("twoByteBuffer[0] = %x\n", twoByteBuffer[0]);
  printf("twoByteBuffer[1] = %x\n", twoByteBuffer[1]);
*/

  return(0);
}
