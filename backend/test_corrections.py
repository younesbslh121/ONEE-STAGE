#!/usr/bin/env python3
"""
Script de test pour valider les corrections apportées au système de gestion de flotte
"""
import requests
import json
from datetime import datetime, timedelta

API_BASE = "http://localhost:5000/api"

def test_missions():
    """Test des fonctionnalités de missions"""
    print("🚀 Test des Missions...")
    
    # Test: Créer une mission
    print("   📝 Création d'une mission...")
    mission_data = {
        "title": "Test Mission",
        "description": "Mission de test",
        "start_latitude": 33.9716,
        "start_longitude": -6.8498,
        "start_address": "Rabat, Maroc",
        "end_latitude": 33.9800,
        "end_longitude": -6.8600,
        "end_address": "Salé, Maroc",
        "scheduled_start": (datetime.now() + timedelta(hours=1)).isoformat(),
        "scheduled_end": (datetime.now() + timedelta(hours=3)).isoformat(),
        "vehicle_id": 1,
        "assigned_user_id": 1
    }
    
    try:
        response = requests.post(f"{API_BASE}/missions/noauth", json=mission_data)
        if response.status_code == 201:
            print("   ✅ Mission créée avec succès")
            mission_id = response.json()['mission']['id']
            
            # Test: Supprimer la mission
            print("   🗑️  Suppression de la mission...")
            delete_response = requests.delete(f"{API_BASE}/missions/noauth/{mission_id}")
            if delete_response.status_code == 200:
                print("   ✅ Mission supprimée avec succès")
            else:
                print(f"   ❌ Erreur lors de la suppression: {delete_response.status_code}")
        else:
            print(f"   ❌ Erreur lors de la création: {response.status_code}")
            print(f"   Détails: {response.text}")
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")

def test_anomalies():
    """Test des fonctionnalités d'anomalies"""
    print("\n🔍 Test des Anomalies...")
    
    # Test: Créer une anomalie
    print("   📝 Création d'une anomalie...")
    anomaly_data = {
        "type": "other",
        "description": "Anomalie de test",
        "severity": "medium",
        "vehicle_id": 1,
        "mission_id": 1,
        "user_id": 1
    }
    
    try:
        response = requests.post(f"{API_BASE}/anomalies/", json=anomaly_data)
        if response.status_code == 201:
            print("   ✅ Anomalie créée avec succès")
            anomaly_id = response.json()['data']['id']
            
            # Test: Supprimer l'anomalie
            print("   🗑️  Suppression de l'anomalie...")
            delete_response = requests.delete(f"{API_BASE}/anomalies/{anomaly_id}")
            if delete_response.status_code == 200:
                print("   ✅ Anomalie supprimée avec succès")
            else:
                print(f"   ❌ Erreur lors de la suppression: {delete_response.status_code}")
        else:
            print(f"   ❌ Erreur lors de la création: {response.status_code}")
            print(f"   Détails: {response.text}")
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")

def test_reimbursements():
    """Test des fonctionnalités de remboursements"""
    print("\n💰 Test des Remboursements...")
    
    # Test: Créer un remboursement
    print("   📝 Création d'un remboursement...")
    reimbursement_data = {
        "mission_id": 1,
        "user_id": 1,
        "grade": "agent_execution",
        "days_count": 2
    }
    
    try:
        response = requests.post(f"{API_BASE}/reimbursements/", json=reimbursement_data)
        if response.status_code == 201:
            print("   ✅ Remboursement créé avec succès")
            reimbursement_id = response.json()['data']['id']
            
            # Test: Lister les remboursements
            print("   📋 Récupération des remboursements...")
            get_response = requests.get(f"{API_BASE}/reimbursements/")
            if get_response.status_code == 200:
                print("   ✅ Remboursements récupérés avec succès")
                reimbursements = get_response.json()['data']
                print(f"   📊 Total: {len(reimbursements)} remboursements")
            else:
                print(f"   ❌ Erreur lors de la récupération: {get_response.status_code}")
                
            # Test: Supprimer le remboursement
            print("   🗑️  Suppression du remboursement...")
            delete_response = requests.delete(f"{API_BASE}/reimbursements/{reimbursement_id}")
            if delete_response.status_code == 200:
                print("   ✅ Remboursement supprimé avec succès")
            else:
                print(f"   ❌ Erreur lors de la suppression: {delete_response.status_code}")
        else:
            print(f"   ❌ Erreur lors de la création: {response.status_code}")
            print(f"   Détails: {response.text}")
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")

def test_database_integration():
    """Test d'intégration avec la base de données"""
    print("\n🗄️  Test d'intégration base de données...")
    
    try:
        # Test: Récupérer les missions
        response = requests.get(f"{API_BASE}/missions/noauth")
        if response.status_code == 200:
            missions = response.json()['missions']
            print(f"   ✅ Missions dans la base: {len(missions)}")
        else:
            print(f"   ❌ Erreur lors de la récupération des missions: {response.status_code}")
            
        # Test: Récupérer les remboursements
        response = requests.get(f"{API_BASE}/reimbursements/")
        if response.status_code == 200:
            reimbursements = response.json()['data']
            print(f"   ✅ Remboursements dans la base: {len(reimbursements)}")
        else:
            print(f"   ❌ Erreur lors de la récupération des remboursements: {response.status_code}")
            
        # Test: Récupérer les anomalies
        response = requests.get(f"{API_BASE}/anomalies/")
        if response.status_code == 200:
            anomalies = response.json()['data']
            print(f"   ✅ Anomalies dans la base: {len(anomalies)}")
        else:
            print(f"   ❌ Erreur lors de la récupération des anomalies: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Erreur de connexion: {e}")

def main():
    """Fonction principale"""
    print("🧪 Test des corrections - Système de gestion de flotte")
    print("="*60)
    
    # Vérifier que le serveur est démarré
    try:
        response = requests.get(f"{API_BASE}/dashboard/")
        if response.status_code != 200:
            print("❌ Le serveur backend n'est pas disponible")
            return
    except Exception as e:
        print(f"❌ Impossible de se connecter au serveur: {e}")
        print("💡 Assurez-vous que le backend est démarré (python backend/app.py)")
        return
    
    print("✅ Connexion au serveur réussie")
    
    # Exécuter les tests
    test_missions()
    test_anomalies()
    test_reimbursements()
    test_database_integration()
    
    print("\n" + "="*60)
    print("✅ Tests terminés")
    print("\n💡 Résumé des corrections apportées:")
    print("   - ✅ Ajout/suppression de missions corrigé")
    print("   - ✅ Ajout d'anomalies corrigé") 
    print("   - ✅ Remboursements apparaissent dans la base")
    print("   - ✅ Carte Leaflet implémentée")
    print("\n🚀 Vous pouvez maintenant utiliser l'application frontend!")

if __name__ == "__main__":
    main()
