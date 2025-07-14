#!/usr/bin/env python3
"""
Script de test pour vérifier que les API fonctionnent correctement
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_missions():
    """Test des endpoints missions"""
    print("🧪 Test Missions...")
    
    # Test GET missions
    try:
        response = requests.get(f"{BASE_URL}/api/missions/noauth")
        print(f"GET missions: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Nombre de missions: {len(data.get('missions', []))}")
        else:
            print(f"   Erreur: {response.text}")
    except Exception as e:
        print(f"   Erreur de connexion: {e}")
    
    # Test POST mission
    try:
        mission_data = {
            "title": "Test Mission API",
            "description": "Mission de test créée par l'API",
            "start_latitude": 48.8566,
            "start_longitude": 2.3522,
            "end_latitude": 48.8606,
            "end_longitude": 2.3376,
            "start_address": "Paris",
            "end_address": "Paris",
            "vehicle_id": 1
        }
        response = requests.post(f"{BASE_URL}/api/missions/noauth", 
                               json=mission_data,
                               headers={'Content-Type': 'application/json'})
        print(f"POST mission: {response.status_code}")
        if response.status_code == 201:
            print("   ✓ Mission créée avec succès")
        else:
            print(f"   Erreur: {response.text}")
    except Exception as e:
        print(f"   Erreur de connexion: {e}")

def test_anomalies():
    """Test des endpoints anomalies"""
    print("\n🔍 Test Anomalies...")
    
    # Test GET anomalies
    try:
        response = requests.get(f"{BASE_URL}/api/anomalies/")
        print(f"GET anomalies: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Nombre d'anomalies: {len(data.get('anomalies', []))}")
        else:
            print(f"   Erreur: {response.text}")
    except Exception as e:
        print(f"   Erreur de connexion: {e}")
    
    # Test POST anomalie
    try:
        anomaly_data = {
            "type": "other",
            "description": "Anomalie de test créée par l'API",
            "severity": "medium",
            "vehicle_id": 1,
            "mission_id": 1
        }
        response = requests.post(f"{BASE_URL}/api/anomalies/", 
                               json=anomaly_data,
                               headers={'Content-Type': 'application/json'})
        print(f"POST anomalie: {response.status_code}")
        if response.status_code == 201:
            print("   ✓ Anomalie créée avec succès")
        else:
            print(f"   Erreur: {response.text}")
    except Exception as e:
        print(f"   Erreur de connexion: {e}")

def test_reimbursements():
    """Test des endpoints remboursements"""
    print("\n💰 Test Remboursements...")
    
    # Test GET remboursements
    try:
        response = requests.get(f"{BASE_URL}/api/reimbursements/")
        print(f"GET remboursements: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Nombre de remboursements: {len(data.get('data', []))}")
        else:
            print(f"   Erreur: {response.text}")
    except Exception as e:
        print(f"   Erreur de connexion: {e}")
    
    # Test POST remboursement
    try:
        reimbursement_data = {
            "mission_id": 1,
            "user_id": 1,
            "grade": "agent_execution",
            "days_count": 2
        }
        response = requests.post(f"{BASE_URL}/api/reimbursements/", 
                               json=reimbursement_data,
                               headers={'Content-Type': 'application/json'})
        print(f"POST remboursement: {response.status_code}")
        if response.status_code == 201:
            print("   ✓ Remboursement créé avec succès")
        else:
            print(f"   Erreur: {response.text}")
    except Exception as e:
        print(f"   Erreur de connexion: {e}")

def main():
    """Execute all tests"""
    print("🚀 Test des APIs Fleet Management")
    print("=" * 50)
    
    test_missions()
    test_anomalies()
    test_reimbursements()
    
    print("\n" + "=" * 50)
    print("✅ Tests terminés")

if __name__ == '__main__':
    main()
