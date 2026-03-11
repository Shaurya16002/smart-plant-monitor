# Arduino Hardware Integration Guide

## Overview
This guide will help you connect your Arduino sensors to the Smart Plant Monitoring System app. Once configured, your Arduino will automatically send real-time sensor data to the app without manual intervention.

---

## Hardware Requirements

### Required Components:
- **ESP8266** or **ESP32** (WiFi-enabled microcontroller)
- **Soil Moisture Sensor** (Capacitive or Resistive)
- **DHT11** or **DHT22** (Temperature & Humidity sensor)
- Jumper wires
- Breadboard
- 5V Power supply or USB cable

---

## Wiring Diagram

### Soil Moisture Sensor Connections:
```
Moisture Sensor    →    ESP8266/ESP32
─────────────────────────────────────
VCC                →    3.3V
GND                →    GND
A0 (Analog Out)    →    A0 (Analog Pin)
```

### DHT Temperature/Humidity Sensor:
```
DHT Sensor         →    ESP8266/ESP32
─────────────────────────────────────
VCC (+)            →    5V
GND (-)            →    GND
DATA               →    D4 (Digital Pin 4)
```

**Note:** Add a 10kΩ pull-up resistor between DATA and VCC for DHT sensor if not built-in.

---

## Software Setup

### Step 1: Install Arduino IDE
1. Download from: https://www.arduino.cc/en/software
2. Install appropriate board support:
   - For ESP8266: Add `http://arduino.esp8266.com/stable/package_esp8266com_index.json` to Board Manager URLs
   - For ESP32: Add `https://dl.espressif.com/dl/package_esp32_index.json` to Board Manager URLs

### Step 2: Install Required Libraries
Open Arduino IDE → Tools → Manage Libraries, then install:
1. **DHT sensor library** by Adafruit
2. **Adafruit Unified Sensor** (dependency for DHT)
3. **ArduinoJson** by Benoit Blanchon

For ESP8266/ESP32, the WiFi libraries are pre-installed.

### Step 3: Configure Arduino Code
1. Open `/arduino_code/plant_monitor.ino`
2. Update the following values:

```cpp
// WiFi Credentials
const char* ssid = "YOUR_WIFI_SSID";           // Your WiFi network name
const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password

// API Configuration
const char* serverUrl = "https://plant-guardian-21.preview.emergentagent.com/api/readings";
String plantId = "YOUR_PLANT_ID";  // Get this from the app
```

### Step 4: Get Your Plant ID
1. Open the Smart Plant Monitoring app
2. Create a new plant
3. Tap on the plant to view details
4. The URL will show the plant ID: `/plant-details?id=YOUR_PLANT_ID`
5. Copy this ID and paste it in the Arduino code

### Step 5: Calibrate Moisture Sensor
Different sensors have different readings. You need to calibrate:

1. **Get DRY reading:**
   - Keep sensor in dry air
   - Upload basic reading sketch
   - Note the analog value (e.g., 850)

2. **Get WET reading:**
   - Submerge sensor in water (don't submerge electronics!)
   - Note the analog value (e.g., 400)

3. **Update code:**
```cpp
int dryValue = 850;  // Your dry reading
int wetValue = 400;  // Your wet reading
```

### Step 6: Upload Code
1. Connect Arduino to computer via USB
2. Select correct Board and Port in Arduino IDE
3. Click Upload button
4. Wait for "Done uploading" message

---

## API Details

### Endpoint
```
POST https://plant-guardian-21.preview.emergentagent.com/api/readings
```

### Request Format
```json
{
  "plant_id": "YOUR_PLANT_ID",
  "moisture": 65.5,
  "temperature": 24.3,
  "humidity": 58.2
}
```

### Headers
```
Content-Type: application/json
```

### Response (Success)
```json
{
  "id": "reading_id",
  "plant_id": "YOUR_PLANT_ID",
  "moisture": 65.5,
  "temperature": 24.3,
  "humidity": 58.2,
  "timestamp": "2025-01-23T10:30:00"
}
```

---

## Testing Your Setup

### Monitor Serial Output
1. Open Arduino IDE → Tools → Serial Monitor
2. Set baud rate to **115200**
3. You should see:

```
=== Smart Plant Monitor ===
Connecting to WiFi: Your_Network
..........
WiFi Connected!
IP Address: 192.168.1.XX

--- Sensor Readings ---
Moisture: 65.5%
Temperature: 24.3°C
Humidity: 58.2%

Sending data to server...
HTTP Response code: 200
✓ Data sent successfully!
```

### Verify in App
1. Open the Smart Plant Monitoring app
2. Pull down to refresh the dashboard
3. You should see updated sensor readings!

---

## Reading Intervals

Default setting: **5 minutes** (300000 milliseconds)

To adjust, modify this line in the code:
```cpp
const unsigned long readingInterval = 300000;  // Change this value
```

**Recommended intervals:**
- **Testing:** 30 seconds (30000)
- **Development:** 1-2 minutes (60000-120000)
- **Production:** 5-15 minutes (300000-900000)

**Note:** Very frequent readings (< 30 seconds) may:
- Drain power faster
- Use more WiFi bandwidth
- Accelerate sensor degradation

---

## Troubleshooting

### Problem: WiFi Connection Failed
**Solutions:**
- ✅ Verify SSID and password are correct
- ✅ Check if WiFi network is 2.4GHz (ESP doesn't support 5GHz)
- ✅ Ensure router is in range
- ✅ Try moving Arduino closer to router

### Problem: DHT Sensor Shows NaN
**Solutions:**
- ✅ Check wiring connections (VCC, GND, DATA)
- ✅ Verify sensor type (DHT11 vs DHT22) in code
- ✅ Add 10kΩ pull-up resistor on DATA line
- ✅ Wait 2 seconds after power-on before reading
- ✅ Try replacing sensor (may be faulty)

### Problem: HTTP Error 400 (Bad Request)
**Solutions:**
- ✅ Verify Plant ID is correct and exists
- ✅ Check JSON format in code
- ✅ Ensure ArduinoJson library is installed
- ✅ Verify API URL is correct

### Problem: HTTP Error 404 (Not Found)
**Solutions:**
- ✅ Check serverUrl in code
- ✅ Ensure `/api/readings` path is correct
- ✅ Verify plant exists in database

### Problem: Data Not Appearing in App
**Solutions:**
- ✅ Pull down to refresh in the app
- ✅ Check Serial Monitor for success messages
- ✅ Verify correct Plant ID is used
- ✅ Check internet connectivity on Arduino
- ✅ Try manual simulate button in app first

### Problem: Moisture Reading Always 0% or 100%
**Solutions:**
- ✅ Re-calibrate sensor (get new dry/wet values)
- ✅ Check sensor connection to A0 pin
- ✅ Ensure sensor has power (3.3V or 5V)
- ✅ Try different sensor (may be damaged)

---

## Power Options

### 1. USB Power (Development)
- Connect to computer or USB power adapter
- Simple and reliable
- Requires cable management

### 2. Battery Power (Portable)
- Use 18650 battery with regulator
- Li-Po battery (3.7V) with boost converter to 5V
- Enables outdoor deployment
- Requires periodic recharging

### 3. Solar Power (Autonomous)
- 5V solar panel + battery + charge controller
- Ideal for outdoor/remote locations
- Truly autonomous operation
- More complex setup

---

## Advanced Features

### Enable Deep Sleep (Power Saving)
Add to Arduino code for battery operation:

```cpp
#include <ESP8266WiFi.h>

// At end of loop()
ESP.deepSleep(300e6);  // Sleep for 5 minutes (in microseconds)
// Note: Connect D0 to RST pin for wake-up
```

### Multiple Sensors
To monitor multiple plants:
1. Create multiple plants in app
2. Copy their IDs
3. Clone Arduino code for each sensor setup
4. Use different plant IDs for each Arduino

### Add More Sensors
The system can be extended with:
- Light intensity sensor (LDR or BH1750)
- Soil pH sensor
- Water level sensor
- Ambient pressure (BMP280)

Just add new fields to the API request and update backend schema.

---

## Tips for Best Results

1. **Sensor Placement:**
   - Insert moisture sensor 2-3 inches into soil
   - Keep DHT sensor above soil, away from direct water
   - Avoid direct sunlight on sensors

2. **Power Management:**
   - Use quality USB cables
   - Stable power supply prevents resets
   - Consider UPS for critical monitoring

3. **Network Stability:**
   - Strong WiFi signal improves reliability
   - Consider WiFi extender if needed
   - Monitor for connection drops

4. **Maintenance:**
   - Clean moisture sensor monthly
   - Check for corrosion on contacts
   - Update firmware periodically

---

## Example Serial Output

```
=== Smart Plant Monitor ===
Connecting to WiFi: MyNetwork
...........
WiFi Connected!
IP Address: 192.168.1.105

--- Sensor Readings ---
Moisture: 45.2%
Temperature: 22.8°C
Humidity: 62.1%

Sending data to server...
HTTP Response code: 200
Server Response: {"id":"65b1e2...","plant_id":"65b0a1...","moisture":45.2,"temperature":22.8,"humidity":62.1,"timestamp":"2025-01-23T15:30:45"}
✓ Data sent successfully!

[Waiting 5 minutes for next reading...]
```

---

## Support & Resources

- **Arduino Code:** `/arduino_code/plant_monitor.ino`
- **API Documentation:** See backend `/api/docs` endpoint
- **App Setup Guide:** Tap hardware icon in app dashboard

**Need Help?**
- Check Serial Monitor for error messages
- Verify all connections
- Test sensors individually first
- Use the "Simulate" button in app to verify API works

---

**Happy Monitoring! 🌱**
