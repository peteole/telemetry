#define gyro
//#define bmp
#define HC12Module
//#define SerialDebugging
#define NEO6M

#ifdef HC12Module
#include "sendData.h"
#endif
#include "dmp.h"
#ifdef bmp
#include "height.h"
#endif
#include <Arduino.h>

#ifdef NEO6M
#include "position.h"
#endif
//#include "compass.h"

float speed = 0;
float heading = 0;
float height = 0;
int counter = 0;

void setup() {
#ifdef SerialDebugging
  Serial.begin(9600);
#endif
// bmp.begin();
// beginCompass();
#ifdef HC12Module
  HC12.begin(9600);
#endif
#ifdef NEO6M
  initializeGPS();
#endif
  beginDmp();
  calibrateGyro();
  // write(10);
  // write(10);
}

void loop() {
#ifdef bmp
  readHeight();
#endif
  // readCompass();
  readGyro();
  readAccel();
#ifdef NEO6M
  readGPSPart(10);
#endif
  processRotations();
  n::toPitchBank(currentRotation, pitch, bank, gyroYaw);
  applyAccel();
#ifdef HC12Module
  if (counter % 2 == 0) {
    writeStart();
    write((uint8_t)2); // head 2
    write(pitch);
    write(bank);
    write(gyroYaw);
    write(height);
    readGyro();
    write(speed);
    writeEnd();
    // write gps data
    if (counter % 100 == 0) {
      writeStart();
      write((uint8_t)3); // head 3
      write(gps.time.value());
      write(gps.location.lat());
      write(gps.location.lng());
      writeEnd();
    }
  }
#endif
#ifdef SerialDebugging
  Serial.println("|" + (String)(pitch * 57) + "|" + (String)(bank * 57) + "|" +
                 (String)(gyroYaw * 57) + "|");
  // Serial.println("a " + toString(accel) + " rot " + toString(rotSpeed));
// Serial.println((String)atan2(accel.x,accel.z)+"|"+(String)atan2(accel.y,accel.z));
#endif
  counter++;
}