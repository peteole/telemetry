# telemetry
Flight data telemetry for an RC plane
## required hardware
1. 2*Arduino Nano
2. 2*HC12-Transciever
3. MPU-6050 chip for artificial horizon support
4. Pressure sensor for altitude (for example BMP180)
5. GPS Sensor for Position
6. Compass sensor for heading
## how to use it
Wire the sensors and one HC12 module to the flying arduino. Flash the arduino software on the flying arduino for example using vscode and PIO. Connect the other HC12 module and a PC (via USB) to the ground reciever arduino. Next, install NodeJS on the PC, clone the ServerSoftware-Folder and run server.js using NodeJS. Finally, open a webbrowser on any device in the same network as the server PC and open the URL <PCURL>:8080/home.html  . If the browser is running on the server PC, you can use http://localhost:8080/home.html . The GUI will open. Click "connect to server" in order to connect with a flight data server. After clicking "refresh devices", select the arduino connected to the server from the device list. Now, your will recieve live flight data from your RC plane.
