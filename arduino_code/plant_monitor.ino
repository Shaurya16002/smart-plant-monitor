/*
 * Smart Plant Monitoring System - Arduino Code
 * 
 * Hardware Requirements:
 * - ESP8266 or ESP32 (for WiFi connectivity)
 * - Soil Moisture Sensor (Analog)
 * - DHT11 or DHT22 (Temperature & Humidity)
 * 
 * Connections:
 * - Soil Moisture Sensor -> Analog Pin (A0)
 * - DHT Sensor -> Digital Pin (D4)
 */

#include <ESP8266WiFi.h>        // For ESP8266. Use <WiFi.h> for ESP32
#include <ESP8266HTTPClient.h>   // For ESP8266. Use <HTTPClient.h> for ESP32
#include <WiFiClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// WiFi Credentials
const char* ssid = "plant_monitoring";         // Your WiFi network name
const char* password = "hardware_software";    // Your WiFi password

// API Configuration
const char* serverUrl = "https://plant-guardian-21.preview.emergentagent.com/api/readings";
String plantId = "YOUR_PLANT_ID";  // Get this from the app after creating a plant

// Sensor Pins
#define MOISTURE_PIN A0  // Soil moisture sensor (analog)
#define DHT_PIN D4       // DHT sensor (digital)
#define DHT_TYPE DHT11   // Change to DHT22 if using DHT22

// Initialize DHT sensor
DHT dht(DHT_PIN, DHT_TYPE);

// Timing Configuration
unsigned long lastReadingTime = 0;
const unsigned long readingInterval = 300000;  // 5 minutes (300000ms). Adjust as needed

void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n=== Smart Plant Monitor ===");
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  connectToWiFi();
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }
  
  // Read and send sensor data at specified interval
  unsigned long currentTime = millis();
  if (currentTime - lastReadingTime >= readingInterval) {
    lastReadingTime = currentTime;
    
    // Read sensors
    float moisture = readMoisture();
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    
    // Check if readings are valid
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }
    
    // Display readings
    Serial.println("\n--- Sensor Readings ---");
    Serial.print("Moisture: "); Serial.print(moisture); Serial.println("%");
    Serial.print("Temperature: "); Serial.print(temperature); Serial.println("°C");
    Serial.print("Humidity: "); Serial.print(humidity); Serial.println("%");
    
    // Send data to server
    sendSensorData(moisture, temperature, humidity);
  }
  
  delay(1000);  // Small delay to prevent overwhelming the loop
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi Connection Failed!");
  }
}

float readMoisture() {
  // Read analog value from moisture sensor
  int sensorValue = analogRead(MOISTURE_PIN);
  
  // Convert to percentage (adjust these values based on your sensor calibration)
  // Dry soil: ~850-1023 (0% moisture)
  // Wet soil: ~300-400 (100% moisture)
  int dryValue = 850;    // Adjust based on your sensor in dry soil
  int wetValue = 400;    // Adjust based on your sensor in wet soil
  
  float moisture = map(sensorValue, wetValue, dryValue, 100, 0);
  moisture = constrain(moisture, 0, 100);  // Keep between 0-100%
  
  return moisture;
}

void sendSensorData(float moisture, float temperature, float humidity) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    
    Serial.println("\nSending data to server...");
    
    // Prepare JSON payload
    StaticJsonDocument<200> doc;
    doc["plant_id"] = plantId;
    doc["moisture"] = round(moisture * 100) / 100.0;      // Round to 2 decimals
    doc["temperature"] = round(temperature * 100) / 100.0;
    doc["humidity"] = round(humidity * 100) / 100.0;
    
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    // Send HTTP POST request
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
      
      String response = http.getString();
      Serial.println("Server Response: " + response);
      
      if (httpResponseCode == 200) {
        Serial.println("✓ Data sent successfully!");
      }
    } else {
      Serial.print("Error sending data. Error code: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected. Cannot send data.");
  }
}

/*
 * CALIBRATION INSTRUCTIONS:
 * 
 * 1. Moisture Sensor Calibration:
 *    - Place sensor in dry soil and note the analogRead value
 *    - Place sensor in wet soil and note the analogRead value
 *    - Update dryValue and wetValue in readMoisture() function
 * 
 * 2. Getting Plant ID:
 *    - Open the app and create a new plant
 *    - Go to VS Code view or check the database
 *    - Copy the plant's ID and paste it in the plantId variable above
 * 
 * 3. Adjust Reading Interval:
 *    - Default is 5 minutes (300000ms)
 *    - For testing: 30 seconds (30000ms)
 *    - For production: 15-30 minutes (900000-1800000ms)
 * 
 * 4. Libraries Required:
 *    - ESP8266WiFi / WiFi (built-in)
 *    - ESP8266HTTPClient / HTTPClient (built-in)
 *    - DHT sensor library (Install from Library Manager)
 *    - ArduinoJson (Install from Library Manager)
 */
