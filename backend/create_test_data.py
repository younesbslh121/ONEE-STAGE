#!/usr/bin/env python3
"""
Script pour créer des données de test pour l'application Fleet Management
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.vehicle import Vehicle
from app.models.mission import Mission
from app.models.location import Location
from app.models.user import User
from datetime import datetime, timedelta
import random

def create_test_data():
    """Crée des données de test pour l'application."""
    app = create_app()
    
    with app.app_context():
        # Créer les tables si elles n'existent pas
        db.create_all()
        
        # Créer des utilisateurs de test
        if not User.query.first():
            admin = User(
                username='admin',
                email='admin@example.com',
                role='admin',
                first_name='Admin',
                last_name='System'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            
            manager = User(
                username='manager',
                email='manager@example.com',
                role='manager',
                first_name='Jean',
                last_name='Manager'
            )
            manager.set_password('manager123')
            db.session.add(manager)
            
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
            print("Utilisateurs de test créés")
        
        # Créer des véhicules de test
        if not Vehicle.query.first():
            vehicles_data = [
                {
                    'license_plate': 'ABC-123',
                    'brand': 'Renault',
                    'model': 'Clio',
                    'year': 2020,
                    'color': 'Bleu',
                    'fuel_type': 'gasoline',
                    'status': 'available'
                },
                {
                    'license_plate': 'DEF-456',
                    'brand': 'Peugeot',
                    'model': '308',
                    'year': 2019,
                    'color': 'Blanc',
                    'fuel_type': 'diesel',
                    'status': 'available'
                },
                {
                    'license_plate': 'GHI-789',
                    'brand': 'Citroën',
                    'model': 'C4',
                    'year': 2021,
                    'color': 'Rouge',
                    'fuel_type': 'electric',
                    'status': 'in_use'
                }
            ]
            
            for vehicle_data in vehicles_data:
                vehicle = Vehicle(**vehicle_data)
                db.session.add(vehicle)
            
            db.session.commit()
            print("Véhicules de test créés")
        
        # Créer des missions de test
        if not Mission.query.first():
            vehicles = Vehicle.query.all()
            driver = User.query.filter_by(role='driver').first()
            admin = User.query.filter_by(role='admin').first()
            
            missions_data = [
                {
                    'title': 'Livraison Paris Centre',
                    'description': 'Livraison de matériel au centre ville',
                    'vehicle_id': vehicles[0].id if vehicles else 1,
                    'assigned_user_id': driver.id if driver else 1,
                    'created_by': admin.id if admin else 1,
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
                    'title': 'Transport Gare du Nord',
                    'description': 'Transport vers la gare du Nord',
                    'vehicle_id': vehicles[1].id if len(vehicles) > 1 else 1,
                    'assigned_user_id': driver.id if driver else 1,
                    'created_by': admin.id if admin else 1,
                    'start_address': 'Opéra, Paris',
                    'end_address': 'Gare du Nord, Paris',
                    'start_latitude': 48.8708,
                    'start_longitude': 2.3317,
                    'end_latitude': 48.8799,
                    'end_longitude': 2.3550,
                    'status': 'in_progress',
                    'scheduled_start': datetime.now() - timedelta(hours=1),
                    'scheduled_end': datetime.now() + timedelta(hours=1)
                }
            ]
            
            for mission_data in missions_data:
                mission = Mission(**mission_data)
                db.session.add(mission)
            
            db.session.commit()
            print("Missions de test créées")
        
        # Créer des locations de test
        if not Location.query.first():
            vehicles = Vehicle.query.all()
            
            # Coordonnées de Paris et alentours
            paris_coords = [
                (48.8566, 2.3522),  # Centre de Paris
                (48.8675, 2.3634),  # République
                (48.8708, 2.3317),  # Opéra
                (48.8799, 2.3550),  # Gare du Nord
                (48.8448, 2.3750),  # Bastille
                (48.8738, 2.2950),  # Arc de Triomphe
            ]
            
            for vehicle in vehicles:
                for i, coords in enumerate(paris_coords):
                    location = Location(
                        vehicle_id=vehicle.id,
                        latitude=coords[0] + random.uniform(-0.01, 0.01),
                        longitude=coords[1] + random.uniform(-0.01, 0.01),
                        speed=random.uniform(0, 50),
                        heading=random.uniform(0, 360),
                        timestamp=datetime.now() - timedelta(hours=i)
                    )
                    db.session.add(location)
            
            db.session.commit()
            print("Locations de test créées")
        
        print("Toutes les données de test ont été créées avec succès!")

if __name__ == '__main__':
    create_test_data()
