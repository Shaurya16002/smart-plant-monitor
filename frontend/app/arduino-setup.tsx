import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ArduinoSetup() {
  const router = useRouter();
  const apiUrl = `${EXPO_PUBLIC_BACKEND_URL}/api/readings`;

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Arduino Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Introduction */}
        <View style={styles.card}>
          <View style={styles.iconHeader}>
            <Ionicons name="hardware-chip" size={32} color="#10b981" />
            <Text style={styles.cardTitle}>Connect Your Hardware</Text>
          </View>
          <Text style={styles.description}>
            Follow these steps to connect your Arduino sensors and send real-time data to the app.
          </Text>
        </View>

        {/* Step 1: Hardware Requirements */}
        <View style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Hardware Requirements</Text>
          </View>
          
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.requirementText}>ESP8266 or ESP32 (with WiFi)</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.requirementText}>Soil Moisture Sensor (Analog)</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.requirementText}>DHT11 or DHT22 Sensor</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.requirementText}>Jumper wires & Breadboard</Text>
          </View>
        </View>

        {/* Step 2: Wiring Diagram */}
        <View style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Sensor Connections</Text>
          </View>
          
          <View style={styles.wiringSection}>
            <Text style={styles.wiringTitle}>Moisture Sensor:</Text>
            <Text style={styles.wiringText}>VCC → 3.3V</Text>
            <Text style={styles.wiringText}>GND → GND</Text>
            <Text style={styles.wiringText}>A0 → Analog Pin (A0)</Text>
          </View>

          <View style={styles.wiringSection}>
            <Text style={styles.wiringTitle}>DHT Sensor:</Text>
            <Text style={styles.wiringText}>VCC → 5V</Text>
            <Text style={styles.wiringText}>GND → GND</Text>
            <Text style={styles.wiringText}>DATA → Digital Pin (D4)</Text>
          </View>
        </View>

        {/* Step 3: API Endpoint */}
        <View style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>API Configuration</Text>
          </View>
          
          <Text style={styles.label}>API Endpoint:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText} selectable>{apiUrl}</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard(apiUrl, 'API URL')}
              style={styles.copyButton}
            >
              <Ionicons name="copy-outline" size={20} color="#10b981" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Request Method:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>POST</Text>
          </View>

          <Text style={styles.label}>JSON Payload Format:</Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText} selectable>{`{
  "plant_id": "YOUR_PLANT_ID",
  "moisture": 65.5,
  "temperature": 24.3,
  "humidity": 58.2
}`}</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#3b82f6" />
            <Text style={styles.infoText}>
              Get your plant_id by creating a plant in the app first, then check the URL in the plant details screen.
            </Text>
          </View>
        </View>

        {/* Step 4: Arduino Code */}
        <View style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepTitle}>Upload Arduino Code</Text>
          </View>
          
          <Text style={styles.description}>
            Download the complete Arduino code from the GitHub repository or VS Code view:
          </Text>
          
          <View style={styles.filePathBox}>
            <Ionicons name="document-text" size={20} color="#10b981" />
            <Text style={styles.filePathText}>/arduino_code/plant_monitor.ino</Text>
          </View>

          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>Before uploading:</Text>
            <Text style={styles.instructionText}>• Update WiFi credentials</Text>
            <Text style={styles.instructionText}>• Add your Plant ID</Text>
            <Text style={styles.instructionText}>• Calibrate moisture sensor</Text>
            <Text style={styles.instructionText}>• Install required libraries</Text>
          </View>
        </View>

        {/* Step 5: Required Libraries */}
        <View style={styles.card}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <Text style={styles.stepTitle}>Arduino Libraries</Text>
          </View>
          
          <Text style={styles.description}>
            Install these libraries from Arduino IDE Library Manager:
          </Text>

          <View style={styles.libraryItem}>
            <Text style={styles.libraryName}>DHT sensor library</Text>
            <Text style={styles.libraryAuthor}>by Adafruit</Text>
          </View>
          <View style={styles.libraryItem}>
            <Text style={styles.libraryName}>ArduinoJson</Text>
            <Text style={styles.libraryAuthor}>by Benoit Blanchon</Text>
          </View>
          <View style={styles.libraryItem}>
            <Text style={styles.libraryName}>ESP8266WiFi / WiFi</Text>
            <Text style={styles.libraryAuthor}>Built-in for ESP boards</Text>
          </View>
        </View>

        {/* Testing Section */}
        <View style={styles.card}>
          <View style={styles.iconHeader}>
            <Ionicons name="flask" size={28} color="#f59e0b" />
            <Text style={styles.cardTitle}>Testing Your Setup</Text>
          </View>
          
          <Text style={styles.description}>
            After uploading the code to your Arduino:
          </Text>

          <View style={styles.testStep}>
            <Text style={styles.testNumber}>1.</Text>
            <Text style={styles.testText}>Open Arduino Serial Monitor (115200 baud)</Text>
          </View>
          <View style={styles.testStep}>
            <Text style={styles.testNumber}>2.</Text>
            <Text style={styles.testText}>Check WiFi connection status</Text>
          </View>
          <View style={styles.testStep}>
            <Text style={styles.testNumber}>3.</Text>
            <Text style={styles.testText}>Verify sensor readings appear</Text>
          </View>
          <View style={styles.testStep}>
            <Text style={styles.testNumber}>4.</Text>
            <Text style={styles.testText}>Confirm "Data sent successfully" message</Text>
          </View>
          <View style={styles.testStep}>
            <Text style={styles.testNumber}>5.</Text>
            <Text style={styles.testText}>Pull to refresh in the app to see new data!</Text>
          </View>
        </View>

        {/* Troubleshooting */}
        <View style={styles.card}>
          <View style={styles.iconHeader}>
            <Ionicons name="warning" size={28} color="#ef4444" />
            <Text style={styles.cardTitle}>Troubleshooting</Text>
          </View>
          
          <View style={styles.troubleItem}>
            <Text style={styles.troubleTitle}>WiFi Connection Failed:</Text>
            <Text style={styles.troubleText}>Check SSID and password in code</Text>
          </View>

          <View style={styles.troubleItem}>
            <Text style={styles.troubleTitle}>Sensor Reading NaN:</Text>
            <Text style={styles.troubleText}>Check DHT sensor wiring and power</Text>
          </View>

          <View style={styles.troubleItem}>
            <Text style={styles.troubleTitle}>HTTP Error 400/404:</Text>
            <Text style={styles.troubleText}>Verify Plant ID is correct</Text>
          </View>

          <View style={styles.troubleItem}>
            <Text style={styles.troubleTitle}>Data Not Updating:</Text>
            <Text style={styles.troubleText}>Check API URL and internet connectivity</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Happy Monitoring! 🌱</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#1e293b',
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  requirementText: {
    fontSize: 15,
    color: '#e2e8f0',
  },
  wiringSection: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  wiringTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  wiringText: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'monospace',
    paddingVertical: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginTop: 12,
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeText: {
    flex: 1,
    fontSize: 13,
    color: '#10b981',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a20',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  filePathBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  filePathText: {
    fontSize: 14,
    color: '#10b981',
    fontFamily: 'monospace',
  },
  instructionBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#94a3b8',
    paddingVertical: 4,
  },
  libraryItem: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  libraryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  libraryAuthor: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  testStep: {
    flexDirection: 'row',
    paddingVertical: 6,
    gap: 8,
  },
  testNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
    width: 24,
  },
  testText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  troubleItem: {
    marginBottom: 12,
  },
  troubleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  troubleText: {
    fontSize: 13,
    color: '#94a3b8',
    paddingLeft: 12,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 16,
  },
});
