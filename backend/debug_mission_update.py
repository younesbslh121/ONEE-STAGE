#!/usr/bin/env python3
"""
Script de débogage pour identifier le problème de vehicle_id dans les missions.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.mission import Mission
from app.models.vehicle import Vehicle
from app.models.user import User
from datetime import datetime

def debug_mission_update():
    """Déboguer le problème de mise à jour des missions."""
    app = create_app()
    
    with app.app_context():
        print("=== Débogage de la mise à jour des missions ===")
        
        # Vérifier l'état actuel des missions
        missions = Mission.query.all()
        print(f"Nombre de missions: {len(missions)}")
        
        for mission in missions:
            print(f"\nMission ID: {mission.id}")
            print(f"Title: {mission.title}")
            print(f"Vehicle ID: {mission.vehicle_id}")
            print(f"Assigned User ID: {mission.assigned_user_id}")
            print(f"Status: {mission.status}")
            
            # Vérifier si le véhicule existe
            if mission.vehicle_id:
                vehicle = Vehicle.query.get(mission.vehicle_id)
                print(f"Vehicle exists: {vehicle is not None}")
                if vehicle:
                    print(f"Vehicle license plate: {vehicle.license_plate}")
            else:
                print("WARNING: Vehicle ID is None!")
        
        # Vérifier les véhicules disponibles
        print("\n=== Véhicules disponibles ===")
        vehicles = Vehicle.query.all()
        print(f"Nombre de véhicules: {len(vehicles)}")
        
        for vehicle in vehicles:
            print(f"Vehicle ID: {vehicle.id}, License: {vehicle.license_plate}, Status: {vehicle.status}")
        
        # Vérifier les utilisateurs
        print("\n=== Utilisateurs ===")
        users = User.query.all()
        print(f"Nombre d'utilisateurs: {len(users)}")
        
        for user in users:
            print(f"User ID: {user.id}, Username: {user.username}, Role: {user.role}")
        
        # Tester une mise à jour safe
        if missions:
            mission = missions[0]
            print(f"\n=== Test de mise à jour de la mission {mission.id} ===")
            
            # Vérifier la valeur actuelle
            print(f"Vehicle ID avant: {mission.vehicle_id}")
            
            # Essayer de mettre à jour sans changer vehicle_id
            try:
                mission.description = "Test description update"
                db.session.commit()
                print("✓ Mise à jour réussie sans toucher vehicle_id")
            except Exception as e:
                print(f"✗ Erreur lors de la mise à jour: {str(e)}")
                db.session.rollback()
            
            # Vérifier si le problème vient de la mise à jour automatique
            print(f"Vehicle ID après: {mission.vehicle_id}")

if __name__ == "__main__":
    debug_mission_update()
