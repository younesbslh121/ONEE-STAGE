#!/usr/bin/env python3
"""
Test rapide pour valider les corrections d'URL et de suppression
"""
import requests
import json
from datetime import datetime

API_BASE = "http://localhost:5000/api"

def test_missions_loading():
    """Test du chargement des missions"""
    print("🚀 Test du chargement des missions...")
    
    try:
        response = requests.get(f"{API_BASE}/missions/noauth")
        if response.status_code == 200:
            data = response.json()
            missions = data.get('missions', [])
            print(f"   ✅ Missions chargées: {len(missions)}")
            for mission in missions:
                print(f"   📋 Mission: {mission['title']} (ID: {mission['id']})")
            return missions
        else:
            print(f"   ❌ Erreur chargement missions: {response.status_code}")
            print(f"   Détails: {response.text}")
            return []
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")
        return []

def test_vehicles_with_missions():
    """Test des véhicules avec missions assignées"""
    print("\n🚗 Test des véhicules avec missions...")
    
    try:
        response = requests.get(f"{API_BASE}/vehicles/noauth")
        if response.status_code == 200:
            data = response.json()
            vehicles = data.get('vehicles', [])
            print(f"   ✅ Véhicules trouvés: {len(vehicles)}")
            
            for vehicle in vehicles:
                print(f"   🚙 Véhicule: {vehicle['license_plate']} (ID: {vehicle['id']}, Status: {vehicle['status']})")
            
            return vehicles
        else:
            print(f"   ❌ Erreur chargement véhicules: {response.status_code}")
            return []
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")
        return []

def test_vehicle_deletion(vehicle_id):
    """Test de suppression de véhicule"""
    print(f"\n🗑️  Test suppression véhicule ID {vehicle_id}...")
    
    try:
        # Essayer suppression normale
        response = requests.delete(f"{API_BASE}/vehicles/noauth/{vehicle_id}")
        print(f"   📋 Réponse suppression normale: {response.status_code}")
        print(f"   📄 Message: {response.json().get('message', response.json().get('error', 'No message'))}")
        
        if response.status_code != 200:
            # Essayer suppression forcée
            print(f"   🔧 Tentative de suppression forcée...")
            force_response = requests.delete(f"{API_BASE}/vehicles/noauth/{vehicle_id}/force-delete")
            print(f"   📋 Réponse suppression forcée: {force_response.status_code}")
            print(f"   📄 Message: {force_response.json().get('message', force_response.json().get('error', 'No message'))}")
            
    except Exception as e:
        print(f"   ❌ Erreur lors de la suppression: {e}")

def test_create_mission():
    """Test de création de mission"""
    print("\n➕ Test création de mission...")
    
    mission_data = {
        "title": f"Mission Test {datetime.now().strftime('%H:%M:%S')}",
        "description": "Mission de test pour validation",
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
        response = requests.post(f"{API_BASE}/missions/noauth", json=mission_data)
        if response.status_code == 201:
            print("   ✅ Mission créée avec succès")
            mission_id = response.json()['mission']['id']
            print(f"   🆔 ID de la mission: {mission_id}")
            return mission_id
        else:
            print(f"   ❌ Erreur création mission: {response.status_code}")
            print(f"   Détails: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")
        return None

def test_delete_mission(mission_id):
    """Test de suppression de mission"""
    print(f"\n🗑️  Test suppression mission ID {mission_id}...")
    
    try:
        response = requests.delete(f"{API_BASE}/missions/noauth/{mission_id}")
        if response.status_code == 200:
            print("   ✅ Mission supprimée avec succès")
        else:
            print(f"   ❌ Erreur suppression mission: {response.status_code}")
            print(f"   Détails: {response.text}")
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")

def main():
    """Fonction principale"""
    print("🧪 Test des Corrections - URLs et Suppressions")
    print("=" * 60)
    
    # Test 1: Chargement des missions
    missions = test_missions_loading()
    
    # Test 2: Chargement des véhicules
    vehicles = test_vehicles_with_missions()
    
    # Test 3: Création d'une mission
    new_mission_id = test_create_mission()
    
    # Test 4: Rechargement des missions pour voir la nouvelle
    print("\n🔄 Rechargement des missions...")
    missions_after = test_missions_loading()
    
    # Test 5: Suppression de la nouvelle mission
    if new_mission_id:
        test_delete_mission(new_mission_id)
    
    # Test 6: Essayer de supprimer un véhicule avec missions
    if vehicles and len(vehicles) > 0:
        vehicle_with_missions = None
        for vehicle in vehicles:
            if any(mission.get('vehicle_id') == vehicle['id'] for mission in missions):
                vehicle_with_missions = vehicle
                break
        
        if vehicle_with_missions:
            test_vehicle_deletion(vehicle_with_missions['id'])
        else:
            print("\n   ℹ️  Aucun véhicule avec missions trouvé pour test de suppression")
    
    print("\n" + "=" * 60)
    print("✅ Tests de correction terminés")
    print("\n💡 Points vérifiés:")
    print("   - Chargement des missions avec bon port (5000)")
    print("   - Création et suppression de missions")
    print("   - Gestion des contraintes de suppression véhicules")
    print("   - Messages d'erreur informatifs")

if __name__ == "__main__":
    main()
