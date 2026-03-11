import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Plant {
  id: string;
  name: string;
  plant_type: string;
  location: string;
}

interface SensorData {
  moisture: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

export default function Index() {
  const router = useRouter();
  const [plants, setPlants] = React.useState<Plant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [sensorData, setSensorData] = React.useState<{ [key: string]: SensorData }>({});

  const fetchPlants = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/plants`);
      const data = await response.json();
      setPlants(data);
      
      // Fetch latest sensor data for each plant
      for (const plant of data) {
        fetchLatestReading(plant.id);
      }
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchLatestReading = async (plantId: string) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/readings/${plantId}/latest`);
      if (response.ok) {
        const data = await response.json();
        setSensorData(prev => ({ ...prev, [plantId]: data }));
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  const simulateReading = async (plantId: string) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/simulate-reading/${plantId}`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchLatestReading(plantId);
      }
    } catch (error) {
      console.error('Error simulating reading:', error);
    }
  };

  React.useEffect(() => {
    fetchPlants();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlants();
  };

  const getStatusColor = (value: number, min: number, max: number) => {
    if (value < min || value > max) return '#ef4444';
    return '#10b981';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading plants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Plant Monitor</Text>
          <Text style={styles.headerSubtitle}>Real-time plant health tracking</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.setupButton}
            onPress={() => router.push('/arduino-setup')}
          >
            <Ionicons name="hardware-chip-outline" size={22} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/add-plant')}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {plants.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={64} color="#4b5563" />
            <Text style={styles.emptyTitle}>No Plants Yet</Text>
            <Text style={styles.emptyText}>Add your first plant to start monitoring</Text>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/add-plant')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Add Plant</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plants.map((plant) => {
            const data = sensorData[plant.id];
            return (
              <View key={plant.id} style={styles.plantCard}>
                <View style={styles.plantHeader}>
                  <View style={styles.plantIcon}>
                    <Ionicons name="leaf" size={24} color="#10b981" />
                  </View>
                  <View style={styles.plantInfo}>
                    <Text style={styles.plantName}>{plant.name}</Text>
                    <Text style={styles.plantType}>{plant.plant_type}</Text>
                    {plant.location && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#6b7280" />
                        <Text style={styles.plantLocation}>{plant.location}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {data ? (
                  <View style={styles.sensorData}>
                    <View style={styles.sensorRow}>
                      <View style={styles.sensorItem}>
                        <Ionicons name="water" size={20} color="#3b82f6" />
                        <Text style={styles.sensorLabel}>Moisture</Text>
                        <Text style={[
                          styles.sensorValue,
                          { color: getStatusColor(data.moisture, 30, 70) }
                        ]}>
                          {data.moisture.toFixed(1)}%
                        </Text>
                      </View>

                      <View style={styles.sensorItem}>
                        <Ionicons name="thermometer" size={20} color="#f59e0b" />
                        <Text style={styles.sensorLabel}>Temperature</Text>
                        <Text style={[
                          styles.sensorValue,
                          { color: getStatusColor(data.temperature, 15, 30) }
                        ]}>
                          {data.temperature.toFixed(1)}°C
                        </Text>
                      </View>

                      <View style={styles.sensorItem}>
                        <Ionicons name="cloud" size={20} color="#8b5cf6" />
                        <Text style={styles.sensorLabel}>Humidity</Text>
                        <Text style={[
                          styles.sensorValue,
                          { color: getStatusColor(data.humidity, 40, 80) }
                        ]}>
                          {data.humidity.toFixed(1)}%
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.timestamp}>
                      Updated: {new Date(data.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No sensor data available</Text>
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => simulateReading(plant.id)}
                  >
                    <Ionicons name="refresh" size={18} color="#10b981" />
                    <Text style={styles.actionButtonText}>Simulate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/plant-details?id=${plant.id}`)}
                  >
                    <Ionicons name="stats-chart" size={18} color="#3b82f6" />
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>🌱 Keep your plants healthy</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  plantCard: {
    backgroundColor: '#1e293b',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  plantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  plantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b98120',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  plantType: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  plantLocation: {
    fontSize: 12,
    color: '#6b7280',
  },
  sensorData: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sensorItem: {
    alignItems: 'center',
    flex: 1,
  },
  sensorLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  sensorValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  noDataContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noDataText: {
    color: '#6b7280',
    fontSize: 14,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
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
