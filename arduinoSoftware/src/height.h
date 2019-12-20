#include "Adafruit_BMP085.h"
#include "Adafruit_Sensor.h"

Adafruit_BMP085 bmp;
float height=0;
void readHeight(){
    height=bmp.readAltitude();
}