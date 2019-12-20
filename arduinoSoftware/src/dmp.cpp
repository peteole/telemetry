#define gyroFactor 0.00013316211  // pi/180*250/32767
#define accelFactor 0.00059877315 // 9.81*2/32767
//#define SerialDebugging
#include "dmp.h"
#ifdef mpu6050
n::Quaternion currentRotation = {1, 0, 0, 0};
float pitch = 0;
float bank = 0;
float gyroYaw = 0;
long lastRead = 0;
MPU6050 accelgyro;
FloatVector rot;
FloatVector rotSpeed;
FloatVector accel;
//n::Quaternion down;
void beginDmp() {
  Wire.begin();
  accelgyro.initialize();
  lastRead = millis();
  //readAccel();
  //down={0,accel.x,accel.y,accel.z};
}
void readGyro() {
  int16_t x;
  int16_t y;
  int16_t z;
  accelgyro.getRotation(&x, &y, &z);
  long newTime = millis();
  float dt = ((float)(newTime - lastRead)) / 1000.0;
  lastRead = newTime;
  rot.x += dt * gyroFactor * (float)x;
  rot.y += dt * gyroFactor * (float)y;
  rot.z += dt * gyroFactor * (float)z;
  rotSpeed.x = gyroFactor * (float)x;
  rotSpeed.y = gyroFactor * (float)y;
  rotSpeed.z = gyroFactor * (float)z;
  // Serial.println("rot" + toString(rot));
}
void calibrateGyro() {
  accelgyro.setXGyroOffset(-13);
  accelgyro.setYGyroOffset(-18);
  accelgyro.setZGyroOffset(4);
  return;
  accelgyro.CalibrateGyro(12);
  Serial.println((String)accelgyro.getXGyroOffset() + "|" +
                 (String)accelgyro.getYGyroOffset() + "|" +
                 (String)accelgyro.getZGyroOffset());
  return;
  /*const int amount = 1000;
  int xSum = 0;
  int ySum = 0;
  int zSum = 0;
  for (int i = 0; i < amount; i++) {
    int16_t x;
    int16_t y;
    int16_t z;
    accelgyro.getRotation(&x, &y, &z);
    xSum+=x;
    ySum+=y;
    zSum+=z;
    //delay(1);
    Serial.println((String)x+"|"+(String)y+"|"+(String)z);
  }
  accelgyro.setXGyroOffset(xSum/amount);
  accelgyro.setYGyroOffset(ySum/amount);
  accelgyro.setZGyroOffset(zSum/amount);*/
}
void readAccel() {
  int16_t x;
  int16_t y;
  int16_t z;
  accelgyro.getAcceleration(&x, &y, &z);
  accel.x = accelFactor * (float)x;
  accel.y = accelFactor * (float)y;
  accel.z = accelFactor * (float)z;
  // Serial.println("a" + toString(accel));
}
#endif
#ifdef gy89

void beginDmp() {
  gyro.enableAutoRange(true);
  gyro.begin();
  lastRead = millis();
}
#endif
void processRotations() {
  readGyro();
  n::rotateX(currentRotation, rot.x);
  n::rotateY(currentRotation, rot.y);
  n::rotateZ(currentRotation, rot.z);
  // n::Quaternion r{0, rot.x, rot.y, rot.z};
  // n::rotate(currentRotation, r);
  n::unify(currentRotation);
  reset(rot);
  //n::toPitchBank(currentRotation, pitch, bank, gyroYaw);
}
void applyAccel() {
  n::Quaternion acceleration{0, accel.x, accel.y, accel.z};
  n::unify(acceleration);
  n::Quaternion currentLot = {0, 0, 0, -1};
  n::Quaternion measuredLot = n::turnVector(acceleration, currentRotation);
#ifdef SerialDebugging
  Serial.print((String)measuredLot.i+"|"+(String)measuredLot.j+"|"+(String)measuredLot.k+"|||");
  Serial.print((String)acceleration.i+"|"+(String)acceleration.j+"|"+(String)acceleration.k);
#endif
  n::rotateAToB(measuredLot,currentLot, currentRotation, 0.5);
  n::unify(currentRotation);
}