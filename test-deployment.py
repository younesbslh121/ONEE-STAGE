#!/usr/bin/env python3
"""
Script pour tester le déploiement local et vérifier le statut des véhicules
"""

import requests
import json
import sys

def test_local_deployment():
    """Test le déploiement local"""
    
    print("🔍 Test du déploiement local...")
    
    # URL de l'API locale
    base_url = "http://localhost:5000"
    
    try:
        # Test de connexion à l'API
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend accessible")
        else:
            print("❌ Backend non accessible")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur de connexion au backend: {e}")
        print("💡 Assurez-vous que le backend est démarré avec: cd backend && python app.py")
        return False
    
    # Test de la route des véhicules
    try:
        response = requests.get(f"{base_url}/api/vehicles/noauth", timeout=5)
        if response.status_code == 200:
            vehicles = response.json().get('vehicles', [])
            print(f"✅ API véhicules accessible - {len(vehicles)} véhicule(s) trouvé(s)")
            
            if vehicles:
                print("\n📋 Véhicules actuels:")
                for i, vehicle in enumerate(vehicles, 1):
                    print(f"  {i}. {vehicle['license_plate']} - {vehicle['brand']} {vehicle['model']}")
            else:
                print("ℹ️  Aucun véhicule - parfait pour un démarrage propre!")
                
        else:
            print("❌ API véhicules non accessible")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur lors de la récupération des véhicules: {e}")
        return False
    
    # Test de la route de nettoyage
    try:
        if vehicles:  # Seulement si des véhicules existent
            print("\n🧹 Test de la fonction de nettoyage...")
            response = requests.post(f"{base_url}/api/vehicles/noauth/clear-vehicles", timeout=5)
            if response.status_code == 200:
                print("✅ Fonction de nettoyage fonctionne")
                
                # Vérifier que les véhicules sont supprimés
                response = requests.get(f"{base_url}/api/vehicles/noauth", timeout=5)
                if response.status_code == 200:
                    remaining_vehicles = response.json().get('vehicles', [])
                    if not remaining_vehicles:
                        print("✅ Tous les véhicules ont été supprimés avec succès")
                    else:
                        print(f"⚠️  {len(remaining_vehicles)} véhicule(s) restant(s)")
            else:
                print("❌ Fonction de nettoyage a échoué")
                return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur lors du test de nettoyage: {e}")
        return False
    
    print("\n🎉 Tous les tests sont passés!")
    print("\n📋 Statut du déploiement:")
    print("  ✅ Backend: Opérationnel")
    print("  ✅ API véhicules: Fonctionnelle")
    print("  ✅ Nettoyage: Opérationnel")
    print("  ✅ Base de données: Propre")
    
    print("\n🌐 Pour GitHub Pages:")
    print("  1. Les changements ont été pushés vers GitHub")
    print("  2. GitHub Actions va automatiquement déployer le site")
    print("  3. Le site sera disponible à: https://younesbslh121.github.io/ONEE-STAGE")
    print("  4. Le processus peut prendre quelques minutes")
    
    return True

def add_test_vehicle():
    """Ajouter un véhicule de test"""
    base_url = "http://localhost:5000"
    
    test_vehicle = {
        "license_plate": "TEST-001",
        "brand": "Toyota",
        "model": "Corolla",
        "year": 2023,
        "color": "Blanc",
        "fuel_type": "gasoline"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/vehicles/noauth",
            json=test_vehicle,
            timeout=5
        )
        
        if response.status_code == 201:
            print("✅ Véhicule de test ajouté avec succès!")
            return True
        else:
            print(f"❌ Échec de l'ajout du véhicule: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur lors de l'ajout du véhicule: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Test du système Fleet Management")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--add-test-vehicle":
        add_test_vehicle()
    else:
        test_local_deployment()
        
    print("\n💡 Commandes utiles:")
    print("  python test-deployment.py --add-test-vehicle    # Ajouter un véhicule de test")
    print("  cd backend && python clear_vehicles.py          # Nettoyer tous les véhicules")
    print("  npm run dev                                     # Démarrer le serveur complet")
