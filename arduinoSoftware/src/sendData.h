#include "Arduino.h"
#include "SoftwareSerial.h"
#ifndef sendData_H
#define sendData_H
SoftwareSerial HC12(11, 10);
template <typename T> void write(T *toPrint, int length) {
  length *= sizeof(T);
  uint8_t *bin = reinterpret_cast<uint8_t *>(toPrint);
  for (int i = 0; i < length; i++) {
    HC12.write(bin[i]);
    if (bin[i] == 255) {
      HC12.write((uint8_t)2);
    }
  }
}
template <typename T> void write(T toPrint) {
  int length = sizeof(T);
  uint8_t *bin = reinterpret_cast<uint8_t *>(&toPrint);
  for (int i = 0; i < length; i++) {
    HC12.write(bin[i]);
    if (bin[i] == 255) {
      HC12.write((uint8_t)2);
    }
  }
}
void writeStart() {
  HC12.write((uint8_t)255);
  HC12.write((uint8_t)0);
}
void writeEnd() {
  HC12.write((uint8_t)255);
  HC12.write((uint8_t)1);
}
#endif