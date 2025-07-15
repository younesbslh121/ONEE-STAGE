#!/usr/bin/env python3
"""
Script d'initialisation des données de test pour Fleet Management
"""

from app import create_app, db
from app.models.vehicle import Vehicle
from app.models.location import Location
from app.models.user import User
from app.models.mission import Mission
from datetime import datetime, timedelta
import random

def init_test_data():
    """Initialise toutes les données de test"""
    app = create_app()
    with app.app_context():
        print("🔄 Initialisation des données de test...")
        
        # Créer des utilisateurs de test si ils n'existent pas
        if not User.query.first():
            print("📝 Création des utilisateurs de test...")
            admin = User(
                username='admin',
                email='admin@example.com',
                role='admin',
                first_name='Admin',
                last_name='System'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            
            driver = User(
                username='driver',
                email='driver@example.com',
                role='driver',
                first_name='Pierre',
                last_name='Conducteur'
            )
            driver.set_password('driver123')
            db.session.add(driver)
            
            db.session.commit()
            print("✅ Utilisateurs créés")
        else:
            print("ℹ️  Utilisateurs déjà présents")
        
        # Ne plus créer automatiquement des véhicules pour une expérience plus propre
        print("ℹ️  Initialisation des véhicules désactivée - ajoutez manuellement vos véhicules")
        
        # Créer des locations de test seulement s'il y a des véhicules
        vehicles = Vehicle.query.all()
        if vehicles:
            location_count = Location.query.count()
            if location_count < 10:
                print("📍 Création des données de localisation...")
                
                # Coordonnées de Paris et alentours
                paris_coords = [
                    (48.8566, 2.3522),  # Centre de Paris
                    (48.8675, 2.3634),  # République
                    (48.8708, 2.3317),  # Opéra
                    (48.8799, 2.3550),  # Gare du Nord
                    (48.8529, 2.3499),  # Notre-Dame
                ]
                
                for vehicle in vehicles:
                    print(f"   📍 Création des locations pour {vehicle.license_plate}")
                    for i, coords in enumerate(paris_coords):
                        location = Location(
                            vehicle_id=vehicle.id,
                            latitude=coords[0] + random.uniform(-0.01, 0.01),
                            longitude=coords[1] + random.uniform(-0.01, 0.01),
                            speed=random.uniform(0, 50),
                            heading=random.uniform(0, 360),
                            timestamp=datetime.now() - timedelta(minutes=i*30)
                        )
                        db.session.add(location)
                
                db.session.commit()
                print("✅ Données de localisation créées")
            else:
                print("ℹ️  Données de localisation déjà présentes")
        else:
            print("ℹ️  Aucun véhicule disponible pour créer des données de localisation")
        
        # Créer des missions de test
        mission_count = Mission.query.count()
        if mission_count < 2:
            print("📋 Création des missions de test...")
            vehicles = Vehicle.query.all()
            driver = User.query.filter_by(role='driver').first()
            admin = User.query.filter_by(role='admin').first()
            
            if vehicles and driver and admin:
                missions_data = [
                    {
                        'title': 'Livraison Paris Centre',
                        'description': 'Livraison de matériel au centre ville',
                        'vehicle_id': vehicles[0].id,
                        'assigned_user_id': driver.id,
                        'created_by': admin.id,
                        'start_address': 'République, Paris',
                        'end_address': 'Châtelet, Paris',
                        'start_latitude': 48.8675,
                        'start_longitude': 2.3634,
                        'end_latitude': 48.8566,
                        'end_longitude': 2.3522,
                        'status': 'pending',
                        'scheduled_start': datetime.now() + timedelta(hours=1),
                        'scheduled_end': datetime.now() + timedelta(hours=3)
                    },
                    {
                        'title': 'Maintenance Route',
                        'description': 'Tournée de maintenance des équipements',
                        'vehicle_id': vehicles[1].id if len(vehicles) > 1 else vehicles[0].id,
                        'assigned_user_id': driver.id,
                        'created_by': admin.id,
                        'start_address': 'Opéra, Paris',
                        'end_address': 'Gare du Nord, Paris',
                        'start_latitude': 48.8708,
                        'start_longitude': 2.3317,
                        'end_latitude': 48.8799,
                        'end_longitude': 2.3550,
                        'status': 'in_progress',
                        'scheduled_start': datetime.now() - timedelta(hours=2),
                        'scheduled_end': datetime.now() + timedelta(hours=1)
                    }
                ]
                
                for mission_data in missions_data:
                    mission = Mission(**mission_data)
                    db.session.add(mission)
                
                db.session.commit()
                print("✅ Missions créées")
            else:
                print("⚠️  Impossible de créer des missions: utilisateurs ou véhicules manquants")
        else:
            print("ℹ️  Missions déjà présentes")
        
        # Afficher un résumé
        print("\n📊 Résumé des données:")
        print(f"   👥 Utilisateurs: {User.query.count()}")
        print(f"   🚗 Véhicules: {Vehicle.query.count()}")
        print(f"   📍 Locations: {Location.query.count()}")
        print(f"   📋 Missions: {Mission.query.count()}")
        
        print("\n✅ Initialisation terminée avec succès!")
        print("\n🔗 URLs utiles:")
        print("   Backend: http://localhost:5000")
        print("   API Test: http://localhost:5000/api/map/test-data")
        print("   API Fleet: http://localhost:5000/api/map/fleet")

if __name__ == "__main__":
    init_test_data()
