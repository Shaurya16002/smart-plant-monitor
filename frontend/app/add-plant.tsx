import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AddPlant() {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [plantType, setPlantType] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleAddPlant = async () => {
    if (!name.trim() || !plantType.trim()) {
      Alert.alert('Error', 'Please enter plant name and type');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/plants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          plant_type: plantType.trim(),
          location: location.trim(),
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Plant added successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to add plant');
      }
    } catch (error) {
      console.error('Error adding plant:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Plant</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.form}>
            <View style={styles.iconContainer}>
              <Ionicons name="leaf" size={64} color="#10b981" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plant Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="flower-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., My Tomato Plant"
                  placeholderTextColor="#6b7280"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plant Type *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="leaf-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Tomato, Rose, Fern"
                  placeholderTextColor="#6b7280"
                  value={plantType}
                  onChangeText={setPlantType}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location (Optional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Living Room, Balcony"
                  placeholderTextColor="#6b7280"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                After adding your plant, you can start monitoring its health with real-time sensor data.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.addButton, loading && styles.addButtonDisabled]}
              onPress={handleAddPlant}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.addButtonText}>Adding...</Text>
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.addButtonText}>Add Plant</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
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
  form: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
