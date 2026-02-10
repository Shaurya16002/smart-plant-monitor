#!/usr/bin/env python3
"""
Smart Plant Monitoring System Backend API Tests
Tests all backend endpoints according to the test flow specified.
"""

import requests
import json
import time
from datetime import datetime
import os
from pathlib import Path

# Load backend URL from frontend .env file
def load_backend_url():
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip().strip('"')
    return "http://localhost:8001"  # fallback

BASE_URL = load_backend_url()
API_BASE = f"{BASE_URL}/api"

print(f"Testing backend at: {API_BASE}")

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def assert_status_code(self, response, expected_code, test_name):
        if response.status_code == expected_code:
            print(f"✅ {test_name}: Status {response.status_code}")
            self.passed += 1
            return True
        else:
            error_msg = f"❌ {test_name}: Expected {expected_code}, got {response.status_code}"
            if response.text:
                error_msg += f" - Response: {response.text}"
            print(error_msg)
            self.errors.append(error_msg)
            self.failed += 1
            return False
    
    def assert_data_structure(self, data, expected_fields, test_name):
        missing_fields = [field for field in expected_fields if field not in data]
        if not missing_fields:
            print(f"✅ {test_name}: Data structure valid")
            self.passed += 1
            return True
        else:
            error_msg = f"❌ {test_name}: Missing fields {missing_fields}"
            print(error_msg)
            self.errors.append(error_msg)
            self.failed += 1
            return False
    
    def assert_value_range(self, value, min_val, max_val, field_name, test_name):
        if min_val <= value <= max_val:
            print(f"✅ {test_name}: {field_name} ({value}) in valid range [{min_val}, {max_val}]")
            self.passed += 1
            return True
        else:
            error_msg = f"❌ {test_name}: {field_name} ({value}) not in range [{min_val}, {max_val}]"
            print(error_msg)
            self.errors.append(error_msg)
            self.failed += 1
            return False
    
    def print_summary(self):
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"Total: {self.passed + self.failed}")
        
        if self.errors:
            print(f"\n{'='*60}")
            print(f"ERRORS:")
            print(f"{'='*60}")
            for error in self.errors:
                print(error)
        
        return self.failed == 0

def test_plant_monitoring_system():
    results = TestResults()
    plant_id = None
    
    print(f"{'='*60}")
    print(f"SMART PLANT MONITORING SYSTEM - BACKEND API TESTS")
    print(f"{'='*60}")
    print(f"Testing at: {API_BASE}")
    print(f"Started at: {datetime.now()}")
    print(f"{'='*60}")
    
    # Test 1: Create a new plant
    print(f"\n🌱 TEST 1: Create Plant (POST /api/plants)")
    plant_data = {
        "name": "Monstera Deliciosa",
        "plant_type": "Tropical Houseplant",
        "location": "Living Room Window",
        "image": "monstera.jpg",
        "thresholds": {
            "min_moisture": 40,
            "max_moisture": 70,
            "min_temp": 18,
            "max_temp": 26,
            "min_humidity": 50,
            "max_humidity": 80
        }
    }
    
    try:
        response = requests.post(f"{API_BASE}/plants", json=plant_data, timeout=10)
        # Accept both 200 and 201 as valid for plant creation
        if response.status_code in [200, 201]:
            print(f"✅ Create Plant: Status {response.status_code}")
            results.passed += 1
            plant_response = response.json()
            expected_fields = ["id", "name", "plant_type", "location", "image", "thresholds", "created_at"]
            if results.assert_data_structure(plant_response, expected_fields, "Create Plant Response"):
                plant_id = plant_response["id"]
                print(f"   Created plant ID: {plant_id}")
        else:
            results.assert_status_code(response, 201, "Create Plant")
    except Exception as e:
        error_msg = f"❌ Create Plant: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    # Test 2: Get all plants
    print(f"\n📋 TEST 2: Get All Plants (GET /api/plants)")
    try:
        response = requests.get(f"{API_BASE}/plants", timeout=10)
        if results.assert_status_code(response, 200, "Get All Plants"):
            plants = response.json()
            if isinstance(plants, list):
                print(f"✅ Get All Plants: Returned {len(plants)} plants")
                results.passed += 1
                if len(plants) > 0:
                    expected_fields = ["id", "name", "plant_type", "location", "thresholds"]
                    results.assert_data_structure(plants[0], expected_fields, "Plant List Item")
            else:
                error_msg = "❌ Get All Plants: Response is not a list"
                print(error_msg)
                results.errors.append(error_msg)
                results.failed += 1
    except Exception as e:
        error_msg = f"❌ Get All Plants: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    if not plant_id:
        print("❌ Cannot continue tests without a valid plant ID")
        results.print_summary()
        return False
    
    # Test 3: Get single plant by ID
    print(f"\n🔍 TEST 3: Get Single Plant (GET /api/plants/{plant_id})")
    try:
        response = requests.get(f"{API_BASE}/plants/{plant_id}", timeout=10)
        if results.assert_status_code(response, 200, "Get Single Plant"):
            plant = response.json()
            expected_fields = ["id", "name", "plant_type", "location", "thresholds"]
            results.assert_data_structure(plant, expected_fields, "Single Plant Response")
    except Exception as e:
        error_msg = f"❌ Get Single Plant: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    # Test 4: Simulate sensor readings (5-10 times)
    print(f"\n📊 TEST 4: Simulate Sensor Readings (POST /api/simulate-reading/{plant_id})")
    simulated_readings = []
    for i in range(7):  # Generate 7 readings
        try:
            response = requests.post(f"{API_BASE}/simulate-reading/{plant_id}", timeout=10)
            # Accept both 200 and 201 as valid for simulate reading
            if response.status_code in [200, 201]:
                print(f"✅ Simulate Reading #{i+1}: Status {response.status_code}")
                results.passed += 1
                reading = response.json()
                expected_fields = ["id", "plant_id", "moisture", "temperature", "humidity", "timestamp"]
                if results.assert_data_structure(reading, expected_fields, f"Simulated Reading #{i+1}"):
                    simulated_readings.append(reading)
                    
                    # Verify data ranges
                    results.assert_value_range(reading["moisture"], 20, 80, "moisture", f"Reading #{i+1} Moisture Range")
                    results.assert_value_range(reading["temperature"], 18, 28, "temperature", f"Reading #{i+1} Temperature Range")
                    results.assert_value_range(reading["humidity"], 35, 75, "humidity", f"Reading #{i+1} Humidity Range")
            else:
                results.assert_status_code(response, 200, f"Simulate Reading #{i+1}")
            
            time.sleep(0.5)  # Small delay between readings
        except Exception as e:
            error_msg = f"❌ Simulate Reading #{i+1}: Request failed - {str(e)}"
            print(error_msg)
            results.errors.append(error_msg)
            results.failed += 1
    
    # Test 5: Get latest reading
    print(f"\n🕐 TEST 5: Get Latest Reading (GET /api/readings/{plant_id}/latest)")
    try:
        response = requests.get(f"{API_BASE}/readings/{plant_id}/latest", timeout=10)
        if results.assert_status_code(response, 200, "Get Latest Reading"):
            latest_reading = response.json()
            expected_fields = ["id", "plant_id", "moisture", "temperature", "humidity", "timestamp"]
            results.assert_data_structure(latest_reading, expected_fields, "Latest Reading Response")
    except Exception as e:
        error_msg = f"❌ Get Latest Reading: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    # Test 6: Get reading history
    print(f"\n📈 TEST 6: Get Reading History (GET /api/readings/{plant_id}/history?days=7)")
    try:
        response = requests.get(f"{API_BASE}/readings/{plant_id}/history?days=7", timeout=10)
        if results.assert_status_code(response, 200, "Get Reading History"):
            history = response.json()
            if isinstance(history, list):
                print(f"✅ Get Reading History: Returned {len(history)} readings")
                results.passed += 1
                if len(history) > 0:
                    expected_fields = ["id", "plant_id", "moisture", "temperature", "humidity", "timestamp"]
                    results.assert_data_structure(history[0], expected_fields, "History Reading Item")
            else:
                error_msg = "❌ Get Reading History: Response is not a list"
                print(error_msg)
                results.errors.append(error_msg)
                results.failed += 1
    except Exception as e:
        error_msg = f"❌ Get Reading History: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    # Test 7: Get daily reports
    print(f"\n📊 TEST 7: Get Daily Reports (GET /api/readings/{plant_id}/reports?days=7)")
    try:
        response = requests.get(f"{API_BASE}/readings/{plant_id}/reports?days=7", timeout=10)
        if results.assert_status_code(response, 200, "Get Daily Reports"):
            reports = response.json()
            if isinstance(reports, list):
                print(f"✅ Get Daily Reports: Returned {len(reports)} daily reports")
                results.passed += 1
                if len(reports) > 0:
                    expected_fields = ["date", "avg_moisture", "avg_temperature", "avg_humidity", 
                                     "min_moisture", "max_moisture", "min_temperature", "max_temperature",
                                     "min_humidity", "max_humidity", "reading_count"]
                    results.assert_data_structure(reports[0], expected_fields, "Daily Report Item")
            else:
                print(f"✅ Get Daily Reports: No reports yet (empty list)")
                results.passed += 1
    except Exception as e:
        error_msg = f"❌ Get Daily Reports: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    # Test 8: Update plant
    print(f"\n✏️ TEST 8: Update Plant (PUT /api/plants/{plant_id})")
    update_data = {
        "name": "Monstera Deliciosa (Updated)",
        "location": "Bedroom Window"
    }
    
    try:
        response = requests.put(f"{API_BASE}/plants/{plant_id}", json=update_data, timeout=10)
        if results.assert_status_code(response, 200, "Update Plant"):
            updated_plant = response.json()
            expected_fields = ["id", "name", "plant_type", "location", "thresholds"]
            if results.assert_data_structure(updated_plant, expected_fields, "Updated Plant Response"):
                if updated_plant["name"] == update_data["name"]:
                    print(f"✅ Update Plant: Name updated correctly")
                    results.passed += 1
                else:
                    error_msg = f"❌ Update Plant: Name not updated correctly"
                    print(error_msg)
                    results.errors.append(error_msg)
                    results.failed += 1
    except Exception as e:
        error_msg = f"❌ Update Plant: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    # Test 9: Test manual sensor reading creation
    print(f"\n📝 TEST 9: Manual Sensor Reading (POST /api/readings)")
    manual_reading = {
        "plant_id": plant_id,
        "moisture": 65.5,
        "temperature": 22.3,
        "humidity": 58.7
    }
    
    try:
        response = requests.post(f"{API_BASE}/readings", json=manual_reading, timeout=10)
        if results.assert_status_code(response, 200, "Manual Sensor Reading"):
            reading = response.json()
            expected_fields = ["id", "plant_id", "moisture", "temperature", "humidity", "timestamp"]
            results.assert_data_structure(reading, expected_fields, "Manual Reading Response")
    except Exception as e:
        error_msg = f"❌ Manual Sensor Reading: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    # Test 10: Delete plant (last test)
    print(f"\n🗑️ TEST 10: Delete Plant (DELETE /api/plants/{plant_id})")
    try:
        response = requests.delete(f"{API_BASE}/plants/{plant_id}", timeout=10)
        if results.assert_status_code(response, 200, "Delete Plant"):
            delete_response = response.json()
            if "message" in delete_response:
                print(f"✅ Delete Plant: {delete_response['message']}")
                results.passed += 1
            else:
                error_msg = "❌ Delete Plant: No success message in response"
                print(error_msg)
                results.errors.append(error_msg)
                results.failed += 1
    except Exception as e:
        error_msg = f"❌ Delete Plant: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    # Test 11: Verify plant is deleted
    print(f"\n🔍 TEST 11: Verify Plant Deleted (GET /api/plants/{plant_id})")
    try:
        response = requests.get(f"{API_BASE}/plants/{plant_id}", timeout=10)
        if results.assert_status_code(response, 404, "Verify Plant Deleted"):
            print(f"✅ Verify Plant Deleted: Plant correctly not found")
    except Exception as e:
        error_msg = f"❌ Verify Plant Deleted: Request failed - {str(e)}"
        print(error_msg)
        results.errors.append(error_msg)
        results.failed += 1
    
    # Print final summary
    success = results.print_summary()
    return success

if __name__ == "__main__":
    success = test_plant_monitoring_system()
    exit(0 if success else 1)