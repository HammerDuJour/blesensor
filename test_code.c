#include <stdio.h>
#include <inttypes.h>

int main()
{
   uint16_t twoBytes;
   uint8_t twoByteBuffer[2];

   twoBytes = 355;
   printf("twoBytes = %x\n", twoBytes);

   printf("twoBytes & 0xFF = %x\n", twoBytes & 0xFF);

   printf("Assigning each byte to the buffer...\n");
   twoByteBuffer[0] = twoBytes;
   twoByteBuffer[1] = twoBytes >> 8;
   printf("twoByteBuffer[0] = %x\n", twoByteBuffer[0]);
   printf("twoByteBuffer[1] = %x\n", twoByteBuffer[1]);

   return(0);
}
