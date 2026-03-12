import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const screenWidth = Dimensions.get('window').width;

interface Plant {
  id: string;
  name: string;
  plant_type: string;
  location: string;
  thresholds: {
    min_moisture: number;
    max_moisture: number;
    min_temp: number;
    max_temp: number;
    min_humidity: number;
    max_humidity: number;
  };
}

interface Reading {
  moisture: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

interface DailyReport {
  date: string;
  avg_moisture: number;
  avg_temperature: number;
  avg_humidity: number;
  reading_count: number;
}

export default function PlantDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const plantId = params.id as string;

  const [plant, setPlant] = React.useState<Plant | null>(null);
  const [latestReading, setLatestReading] = React.useState<Reading | null>(null);
  const [history, setHistory] = React.useState<Reading[]>([]);
  const [reports, setReports] = React.useState<DailyReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchData = async () => {
    try {
      // Fetch plant details
      const plantResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/plants/${plantId}`);
      const plantData = await plantResponse.json();
      setPlant(plantData);

      // Fetch latest reading
      const latestResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/readings/${plantId}/latest`);
      if (latestResponse.ok) {
        const latestData = await latestResponse.json();
        setLatestReading(latestData);
      }

      // Fetch history
      const historyResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/readings/${plantId}/history?days=7`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData);
      }

      // Fetch reports
      const reportsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/readings/${plantId}/reports?days=7`);
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [plantId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (value: number, min: number, max: number) => {
    if (value < min || value > max) return '#ef4444';
    return '#10b981';
  };

  const getStatusText = (value: number, min: number, max: number) => {
    if (value < min) return 'Low';
    if (value > max) return 'High';
    return 'Good';
  };

  if (loading || !plant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{plant.name}</Text>
          <Text style={styles.headerSubtitle}>{plant.plant_type}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* Plant ID Card for Arduino */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="code-outline" size={24} color="#3b82f6" />
            <Text style={styles.cardTitle}>Arduino Plant ID</Text>
          </View>
          <Text style={styles.plantIdLabel}>Use this ID in your Arduino code:</Text>
          <TouchableOpacity 
            style={styles.plantIdBox}
            onPress={() => {
              Clipboard.setStringAsync(plantId);
              Alert.alert('Copied!', 'Plant ID copied to clipboard');
            }}
          >
            <Text style={styles.plantIdText} selectable>{plantId}</Text>
            <Ionicons name="copy-outline" size={20} color="#10b981" />
          </TouchableOpacity>
          <Text style={styles.plantIdHint}>Tap to copy • Paste in Arduino code line 16</Text>
        </View>

        {/* Current Status Card */}
        {latestReading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Status</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="water" size={24} color="#3b82f6" />
                  <Text style={styles.metricLabel}>Moisture</Text>
                </View>
                <Text style={[
                  styles.metricValue,
                  { color: getStatusColor(latestReading.moisture, plant.thresholds.min_moisture, plant.thresholds.max_moisture) }
                ]}>
                  {latestReading.moisture.toFixed(1)}%
                </Text>
                <Text style={styles.metricStatus}>
                  {getStatusText(latestReading.moisture, plant.thresholds.min_moisture, plant.thresholds.max_moisture)}
                </Text>
                <Text style={styles.metricRange}>
                  Ideal: {plant.thresholds.min_moisture}-{plant.thresholds.max_moisture}%
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="thermometer" size={24} color="#f59e0b" />
                  <Text style={styles.metricLabel}>Temperature</Text>
                </View>
                <Text style={[
                  styles.metricValue,
                  { color: getStatusColor(latestReading.temperature, plant.thresholds.min_temp, plant.thresholds.max_temp) }
                ]}>
                  {latestReading.temperature.toFixed(1)}°C
                </Text>
                <Text style={styles.metricStatus}>
                  {getStatusText(latestReading.temperature, plant.thresholds.min_temp, plant.thresholds.max_temp)}
                </Text>
                <Text style={styles.metricRange}>
                  Ideal: {plant.thresholds.min_temp}-{plant.thresholds.max_temp}°C
                </Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="cloud" size={24} color="#8b5cf6" />
                  <Text style={styles.metricLabel}>Humidity</Text>
                </View>
                <Text style={[
                  styles.metricValue,
                  { color: getStatusColor(latestReading.humidity, plant.thresholds.min_humidity, plant.thresholds.max_humidity) }
                ]}>
                  {latestReading.humidity.toFixed(1)}%
                </Text>
                <Text style={styles.metricStatus}>
                  {getStatusText(latestReading.humidity, plant.thresholds.min_humidity, plant.thresholds.max_humidity)}
                </Text>
                <Text style={styles.metricRange}>
                  Ideal: {plant.thresholds.min_humidity}-{plant.thresholds.max_humidity}%
                </Text>
              </View>
            </View>

            <Text style={styles.updateTime}>
              Last updated: {new Date(latestReading.timestamp).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Weekly Reports */}
        {reports.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Reports</Text>
            {reports.map((report, index) => (
              <View key={index} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Ionicons name="calendar" size={18} color="#10b981" />
                  <Text style={styles.reportDate}>
                    {new Date(report.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.reportCount}>{report.reading_count} readings</Text>
                </View>
                <View style={styles.reportMetrics}>
                  <View style={styles.reportMetric}>
                    <Text style={styles.reportMetricLabel}>Moisture</Text>
                    <Text style={styles.reportMetricValue}>{report.avg_moisture.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.reportMetric}>
                    <Text style={styles.reportMetricLabel}>Temp</Text>
                    <Text style={styles.reportMetricValue}>{report.avg_temperature.toFixed(1)}°C</Text>
                  </View>
                  <View style={styles.reportMetric}>
                    <Text style={styles.reportMetricLabel}>Humidity</Text>
                    <Text style={styles.reportMetricValue}>{report.avg_humidity.toFixed(1)}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent History</Text>
            {history.slice(-10).reverse().map((reading, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyTime}>
                  <Ionicons name="time" size={16} color="#6b7280" />
                  <Text style={styles.historyTimeText}>
                    {new Date(reading.timestamp).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.historyMetrics}>
                  <Text style={styles.historyMetric}>💧 {reading.moisture.toFixed(1)}%</Text>
                  <Text style={styles.historyMetric}>🌡️ {reading.temperature.toFixed(1)}°C</Text>
                  <Text style={styles.historyMetric}>☁️ {reading.humidity.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Monitoring {plant.name}</Text>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
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
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#1e293b',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  plantIdLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  plantIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    marginBottom: 8,
  },
  plantIdText: {
    flex: 1,
    fontSize: 13,
    color: '#10b981',
    fontFamily: 'monospace',
  },
  plantIdHint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: (screenWidth - 80) / 2,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricStatus: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 4,
  },
  metricRange: {
    fontSize: 12,
    color: '#6b7280',
  },
  updateTime: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  reportDate: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  reportCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  reportMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  reportMetric: {
    alignItems: 'center',
  },
  reportMetricLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  reportMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  historyItem: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  historyTimeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  historyMetric: {
    fontSize: 14,
    color: '#94a3b8',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
