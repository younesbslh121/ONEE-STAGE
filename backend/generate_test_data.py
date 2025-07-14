#!/usr/bin/env python3
"""
Script pour générer des données de test pour la carte
"""
import requests
import json
import random
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5000/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def login():
    """Connexion et récupération du token"""
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(url, json=data)
    if response.status_code == 200:
        token = response.json()["access_token"]
        print(f"✅ Connexion réussie! Token récupéré.")
        return token
    else:
        print(f"❌ Erreur de connexion: {response.status_code}")
        print(response.text)
        return None

def get_headers(token):
    """Retourne les headers avec le token d'authentification"""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

def get_vehicles(token):
    """Récupère la liste des véhicules"""
    url = f"{BASE_URL}/vehicles"
    headers = get_headers(token)
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        vehicles = response.json()["vehicles"]
        print(f"✅ {len(vehicles)} véhicules trouvés")
        return vehicles
    else:
        print(f"❌ Erreur récupération véhicules: {response.status_code}")
        return []

def generate_location_data(token, vehicles):
    """Génère des données de localisation pour les véhicules"""
    url = f"{BASE_URL}/locations"
    headers = get_headers(token)
    
    # Coordonnées de base (Paris)
    base_lat = 48.8566
    base_lon = 2.3522
    
    for vehicle in vehicles:
        # Génère 5 positions aléatoires pour chaque véhicule
        for i in range(5):
            # Variation aléatoire autour de Paris
            lat = base_lat + (random.random() - 0.5) * 0.1
            lon = base_lon + (random.random() - 0.5) * 0.1
            
            # Timestamp avec décalage
            timestamp = datetime.utcnow() - timedelta(hours=random.randint(0, 24))
            
            location_data = {
                "vehicle_id": vehicle["id"],
                "latitude": lat,
                "longitude": lon,
                "timestamp": timestamp.isoformat(),
                "speed": random.uniform(0, 80),
                "heading": random.uniform(0, 360)
            }
            
            response = requests.post(url, json=location_data, headers=headers)
            if response.status_code == 201:
                print(f"✅ Location ajoutée pour le véhicule {vehicle['license_plate']}")
            else:
                print(f"❌ Erreur ajout location: {response.status_code}")

def test_map_api(token):
    """Test l'API de carte"""
    url = f"{BASE_URL}/map/fleet"
    headers = get_headers(token)
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"✅ API carte fonctionne! {len(data['vehicles'])} véhicules sur la carte")
        return data
    else:
        print(f"❌ Erreur API carte: {response.status_code}")
        print(response.text)
        return None

def main():
    print("🚀 Génération des données de test pour la carte...")
    
    # Connexion
    token = login()
    if not token:
        return
    
    # Récupération des véhicules
    vehicles = get_vehicles(token)
    if not vehicles:
        return
    
    # Génération des données de localisation
    print("\n📍 Génération des données de localisation...")
    generate_location_data(token, vehicles)
    
    # Test de l'API carte
    print("\n🗺️ Test de l'API carte...")
    map_data = test_map_api(token)
    
    if map_data:
        print(f"\n✅ Données de carte générées avec succès!")
        print(f"   - Centre: {map_data['center']}")
        print(f"   - Véhicules: {len(map_data['vehicles'])}")
        for vehicle in map_data['vehicles']:
            print(f"     • {vehicle['license_plate']}: ({vehicle['latitude']:.4f}, {vehicle['longitude']:.4f})")

if __name__ == "__main__":
    main()
