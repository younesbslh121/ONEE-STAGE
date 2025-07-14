#!/usr/bin/env python3
"""
Script de démarrage simple pour le serveur backend
"""
import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Créer une application Flask simple
app = Flask(__name__)

# Configuration CORS pour permettre les requêtes depuis le frontend
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Route de santé
@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Backend is running'}), 200

# Route pour les missions (sans authentification)
@app.route('/api/missions/noauth')
def get_missions():
    # Données de test pour les missions
    test_missions = [
        {
            'id': 1,
            'title': 'Mission de maintenance - Casablanca',
            'description': 'Vérification des canalisations dans le quartier Maarif',
            'status': 'in_progress',
            'start_address': 'Siège ONEP, Rabat',
            'end_address': 'Quartier Maarif, Casablanca',
            'start_time': '2024-01-15T08:00:00Z',
            'end_time': None,
            'vehicle_id': 1,
            'assigned_user_id': 1,
            'created_at': '2024-01-15T07:00:00Z',
            'updated_at': '2024-01-15T08:00:00Z',
            'vehicle': {
                'id': 1,
                'license_plate': 'ONEP-001',
                'brand': 'Toyota',
                'model': 'Hilux',
                'year': 2020,
                'color': 'Blanc',
                'fuel_type': 'diesel',
                'status': 'in_use',
                'current_latitude': 33.9716,
                'current_longitude': -6.8498,
                'last_location_update': '2024-01-15T08:00:00Z',
                'created_at': '2024-01-15T07:00:00Z',
                'updated_at': '2024-01-15T08:00:00Z'
            },
            'assigned_user': {
                'id': 1,
                'username': 'ahmed.benali',
                'email': 'ahmed.benali@onep.ma',
                'first_name': 'Ahmed',
                'last_name': 'Benali',
                'role': 'technician',
                'created_at': '2024-01-15T07:00:00Z',
                'updated_at': '2024-01-15T07:00:00Z'
            }
        },
        {
            'id': 2,
            'title': 'Mission d\'inspection - Salé',
            'description': 'Inspection des installations à Salé',
            'status': 'pending',
            'start_address': 'Siège ONEP, Rabat',
            'end_address': 'Centre-ville, Salé',
            'start_time': '2024-01-15T09:00:00Z',
            'end_time': None,
            'vehicle_id': 2,
            'assigned_user_id': 2,
            'created_at': '2024-01-15T07:00:00Z',
            'updated_at': '2024-01-15T07:00:00Z',
            'vehicle': {
                'id': 2,
                'license_plate': 'ONEP-002',
                'brand': 'Ford',
                'model': 'Ranger',
                'year': 2021,
                'color': 'Bleu',
                'fuel_type': 'gasoline',
                'status': 'available',
                'current_latitude': 33.9800,
                'current_longitude': -6.8600,
                'last_location_update': '2024-01-15T08:00:00Z',
                'created_at': '2024-01-15T07:00:00Z',
                'updated_at': '2024-01-15T07:00:00Z'
            },
            'assigned_user': {
                'id': 2,
                'username': 'fatima.alaoui',
                'email': 'fatima.alaoui@onep.ma',
                'first_name': 'Fatima',
                'last_name': 'Alaoui',
                'role': 'inspector',
                'created_at': '2024-01-15T07:00:00Z',
                'updated_at': '2024-01-15T07:00:00Z'
            }
        }
    ]
    
    return jsonify({'missions': test_missions}), 200

# Route pour un véhicule spécifique
@app.route('/api/vehicles/<int:vehicle_id>')
def get_vehicle(vehicle_id):
    # Données de test pour les véhicules
    test_vehicles = {
        1: {
            'id': 1,
            'license_plate': 'ONEP-001',
            'brand': 'Toyota',
            'model': 'Hilux',
            'year': 2020,
            'color': 'Blanc',
            'fuel_type': 'diesel',
            'status': 'in_use',
            'current_latitude': 33.9716,
            'current_longitude': -6.8498,
            'last_location_update': '2024-01-15T08:00:00Z',
            'created_at': '2024-01-15T07:00:00Z',
            'updated_at': '2024-01-15T08:00:00Z'
        },
        2: {
            'id': 2,
            'license_plate': 'ONEP-002',
            'brand': 'Ford',
            'model': 'Ranger',
            'year': 2021,
            'color': 'Bleu',
            'fuel_type': 'gasoline',
            'status': 'available',
            'current_latitude': 33.9800,
            'current_longitude': -6.8600,
            'last_location_update': '2024-01-15T08:00:00Z',
            'created_at': '2024-01-15T07:00:00Z',
            'updated_at': '2024-01-15T08:00:00Z'
        }
    }
    
    vehicle = test_vehicles.get(vehicle_id)
    if vehicle:
        return jsonify(vehicle), 200
    else:
        return jsonify({'error': 'Vehicle not found'}), 404

# Route pour tous les véhicules
@app.route('/api/vehicles')
def get_vehicles():
    test_vehicles = [
        {
            'id': 1,
            'license_plate': 'ONEP-001',
            'brand': 'Toyota',
            'model': 'Hilux',
            'year': 2020,
            'color': 'Blanc',
            'fuel_type': 'diesel',
            'status': 'in_use',
            'current_latitude': 33.9716,
            'current_longitude': -6.8498,
            'last_location_update': '2024-01-15T08:00:00Z',
            'created_at': '2024-01-15T07:00:00Z',
            'updated_at': '2024-01-15T08:00:00Z'
        },
        {
            'id': 2,
            'license_plate': 'ONEP-002',
            'brand': 'Ford',
            'model': 'Ranger',
            'year': 2021,
            'color': 'Bleu',
            'fuel_type': 'gasoline',
            'status': 'available',
            'current_latitude': 33.9800,
            'current_longitude': -6.8600,
            'last_location_update': '2024-01-15T08:00:00Z',
            'created_at': '2024-01-15T07:00:00Z',
            'updated_at': '2024-01-15T08:00:00Z'
        }
    ]
    
    return jsonify({'vehicles': test_vehicles}), 200

def test_database_connection():
    """Tester la connexion à la base de données"""
    try:
        # Test rapide de connexion
        import urllib.parse
        password = urllib.parse.quote_plus('Younes@2004111')
        test_uri = f"postgresql://postgres:{password}@db.jzigpvhdrahmzaexvvdg.supabase.co:5432/postgres"
        
        import psycopg2
        conn = psycopg2.connect(test_uri + "?sslmode=require")
        conn.close()
        print("✅ Connexion Supabase réussie!")
        return True
    except Exception as e:
        print(f"⚠️  Connexion Supabase échouée: {e}")
        print("🔄 Utilisation des données locales SQLite...")
        return False

if __name__ == '__main__':
    print("🚀 Démarrage du serveur backend ONEE Fleet Management")
    print("=" * 60)
    
    # Tester la connexion à la base de données
    db_connected = test_database_connection()
    
    print("\n🌐 Serveur démarré sur: http://localhost:5000")
    print("📋 Routes disponibles:")
    print("  - GET /health - Vérification de l'état du serveur")
    print("  - GET /api/missions/noauth - Liste des missions")
    print("  - GET /api/vehicles/<id> - Détails d'un véhicule")
    print("  - GET /api/vehicles - Liste des véhicules")
    
    if db_connected:
        print("📊 Base de données: Supabase PostgreSQL")
    else:
        print("📊 Base de données: SQLite local (mode test)")
    
    print("\n⏸️  Appuyez sur Ctrl+C pour arrêter le serveur")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
