#!/usr/bin/env python3
"""
Test simple pour vérifier que les corrections fonctionnent
"""
import requests
import json

def test_basic_connectivity():
    """Test de connectivité de base"""
    print("🔌 Test de connectivité...")
    
    # Test mission endpoint
    try:
        response = requests.get("http://localhost:5000/api/missions/noauth")
        print(f"✅ Missions endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   📊 Missions dans la base: {len(data.get('missions', []))}")
    except Exception as e:
        print(f"❌ Erreur missions: {e}")
    
    # Test anomalies endpoint
    try:
        response = requests.get("http://localhost:5000/api/anomalies/")
        print(f"✅ Anomalies endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   📊 Anomalies dans la base: {len(data.get('data', []))}")
    except Exception as e:
        print(f"❌ Erreur anomalies: {e}")
    
    # Test remboursements endpoint
    try:
        response = requests.get("http://localhost:5000/api/reimbursements/")
        print(f"✅ Remboursements endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   📊 Remboursements dans la base: {len(data.get('data', []))}")
    except Exception as e:
        print(f"❌ Erreur remboursements: {e}")

def test_create_mission():
    """Test création de mission"""
    print("\n🚀 Test création de mission...")
    
    mission_data = {
        "title": "Test Mission - " + str(datetime.now().timestamp()),
        "description": "Mission de test automatique",
        "start_latitude": 33.9716,
        "start_longitude": -6.8498,
        "start_address": "Rabat Test",
        "end_latitude": 33.9800,
        "end_longitude": -6.8600,
        "end_address": "Salé Test",
        "scheduled_start": "2025-07-13T10:00:00",
        "scheduled_end": "2025-07-13T14:00:00",
        "vehicle_id": 1,
        "assigned_user_id": 1
    }
    
    try:
        response = requests.post("http://localhost:5000/api/missions/noauth", json=mission_data)
        if response.status_code == 201:
            print("✅ Mission créée avec succès")
            return response.json()['mission']['id']
        else:
            print(f"❌ Erreur création mission: {response.status_code}")
            print(f"   Détails: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erreur création mission: {e}")
        return None

def test_create_anomaly():
    """Test création d'anomalie"""
    print("\n🔍 Test création d'anomalie...")
    
    anomaly_data = {
        "type": "other",
        "description": "Anomalie de test automatique",
        "severity": "medium",
        "vehicle_id": 1,
        "mission_id": 1,
        "user_id": 1
    }
    
    try:
        response = requests.post("http://localhost:5000/api/anomalies/", json=anomaly_data)
        if response.status_code == 201:
            print("✅ Anomalie créée avec succès")
            return response.json()['data']['id']
        else:
            print(f"❌ Erreur création anomalie: {response.status_code}")
            print(f"   Détails: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erreur création anomalie: {e}")
        return None

def test_create_reimbursement():
    """Test création de remboursement"""
    print("\n💰 Test création de remboursement...")
    
    reimbursement_data = {
        "mission_id": 1,
        "user_id": 1,
        "grade": "agent_execution",
        "days_count": 1
    }
    
    try:
        response = requests.post("http://localhost:5000/api/reimbursements/", json=reimbursement_data)
        if response.status_code == 201:
            print("✅ Remboursement créé avec succès")
            return response.json()['data']['id']
        else:
            print(f"❌ Erreur création remboursement: {response.status_code}")
            print(f"   Détails: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Erreur création remboursement: {e}")
        return None

if __name__ == "__main__":
    from datetime import datetime
    
    print("🧪 Test Simple - Vérification des Corrections")
    print("=" * 50)
    
    test_basic_connectivity()
    
    mission_id = test_create_mission()
    anomaly_id = test_create_anomaly()
    reimbursement_id = test_create_reimbursement()
    
    print("\n" + "=" * 50)
    print("✅ Test terminé")
    
    if mission_id and anomaly_id and reimbursement_id:
        print("🎉 Toutes les fonctionnalités fonctionnent correctement!")
    else:
        print("⚠️  Certaines fonctionnalités nécessitent des vérifications")
    
    print("\n💡 Pour tester la suppression, vous pouvez utiliser:")
    if mission_id:
        print(f"   DELETE http://localhost:5000/api/missions/noauth/{mission_id}")
    if anomaly_id:
        print(f"   DELETE http://localhost:5000/api/anomalies/{anomaly_id}")
    if reimbursement_id:
        print(f"   DELETE http://localhost:5000/api/reimbursements/{reimbursement_id}")
