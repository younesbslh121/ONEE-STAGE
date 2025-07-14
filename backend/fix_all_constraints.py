#!/usr/bin/env python3
"""
Script de diagnostic et correction complet pour tous les problèmes de contraintes NOT NULL
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.mission import Mission
from app.models.vehicle import Vehicle
from app.models.user import User
from app.models.reimbursement import Reimbursement
from app.models.anomaly import Anomaly
from datetime import datetime

def diagnose_and_fix_all():
    """Diagnostiquer et corriger tous les problèmes de base de données."""
    app = create_app()
    
    with app.app_context():
        print("=== DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES ===")
        
        # 1. Diagnostiquer les missions
        print("\n1. DIAGNOSTIC DES MISSIONS")
        missions = Mission.query.all()
        print(f"Nombre de missions: {len(missions)}")
        
        missions_with_null_vehicle = []
        missions_with_null_user = []
        
        for mission in missions:
            if mission.vehicle_id is None:
                missions_with_null_vehicle.append(mission)
                print(f"⚠️  Mission {mission.id} a vehicle_id = None")
            
            if mission.assigned_user_id is None:
                missions_with_null_user.append(mission)
                print(f"⚠️  Mission {mission.id} a assigned_user_id = None")
        
        # 2. Diagnostiquer les remboursements
        print("\n2. DIAGNOSTIC DES REMBOURSEMENTS")
        reimbursements = Reimbursement.query.all()
        print(f"Nombre de remboursements: {len(reimbursements)}")
        
        reimbursements_with_null_mission = []
        reimbursements_with_null_user = []
        
        for reimbursement in reimbursements:
            if reimbursement.mission_id is None:
                reimbursements_with_null_mission.append(reimbursement)
                print(f"⚠️  Remboursement {reimbursement.id} a mission_id = None")
            
            if reimbursement.user_id is None:
                reimbursements_with_null_user.append(reimbursement)
                print(f"⚠️  Remboursement {reimbursement.id} a user_id = None")
        
        # 3. Diagnostiquer les anomalies
        print("\n3. DIAGNOSTIC DES ANOMALIES")
        anomalies = Anomaly.query.all()
        print(f"Nombre d'anomalies: {len(anomalies)}")
        
        anomalies_with_null_vehicle = []
        
        for anomaly in anomalies:
            if anomaly.vehicle_id is None:
                anomalies_with_null_vehicle.append(anomaly)
                print(f"⚠️  Anomalie {anomaly.id} a vehicle_id = None")
        
        # 4. Vérifier les données de référence
        print("\n4. VÉRIFICATION DES DONNÉES DE RÉFÉRENCE")
        vehicles = Vehicle.query.all()
        users = User.query.all()
        
        print(f"Nombre de véhicules: {len(vehicles)}")
        print(f"Nombre d'utilisateurs: {len(users)}")
        
        if len(vehicles) == 0:
            print("⚠️  Aucun véhicule trouvé - création nécessaire")
        if len(users) == 0:
            print("⚠️  Aucun utilisateur trouvé - création nécessaire")
        
        # 5. CORRECTION DES PROBLÈMES
        print("\n=== CORRECTION DES PROBLÈMES ===")
        
        # Créer des utilisateurs et véhicules par défaut si nécessaire
        if len(users) == 0:
            print("Création d'utilisateurs par défaut...")
            admin_user = User(
                username='admin',
                email='admin@onep.ma',
                first_name='Admin',
                last_name='System',
                role='admin'
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            
            driver_user = User(
                username='driver1',
                email='driver1@onep.ma', 
                first_name='Mohamed',
                last_name='Alami',
                role='driver'
            )
            driver_user.set_password('driver123')
            db.session.add(driver_user)
            
            db.session.commit()
            users = User.query.all()
            print(f"✓ {len(users)} utilisateurs créés")
        
        if len(vehicles) == 0:
            print("Création de véhicules par défaut...")
            vehicles_data = [
                {
                    'license_plate': 'ONEP-001',
                    'brand': 'Renault',
                    'model': 'Master',
                    'year': 2022,
                    'color': 'Blanc',
                    'fuel_type': 'diesel',
                    'status': 'available'
                },
                {
                    'license_plate': 'ONEP-002',
                    'brand': 'Peugeot',
                    'model': 'Expert',
                    'year': 2021,
                    'color': 'Bleu',
                    'fuel_type': 'diesel',
                    'status': 'available'
                }
            ]
            
            for vehicle_data in vehicles_data:
                vehicle = Vehicle(**vehicle_data)
                db.session.add(vehicle)
            
            db.session.commit()
            vehicles = Vehicle.query.all()
            print(f"✓ {len(vehicles)} véhicules créés")
        
        # Récupérer les premiers utilisateurs et véhicules pour les assignations par défaut
        default_user = users[0]
        default_vehicle = vehicles[0] if vehicles else None
        
        # Corriger les missions avec vehicle_id ou assigned_user_id NULL
        if missions_with_null_vehicle or missions_with_null_user:
            print(f"\nCorrection de {len(missions_with_null_vehicle)} missions avec vehicle_id NULL...")
            print(f"Correction de {len(missions_with_null_user)} missions avec assigned_user_id NULL...")
            
            for mission in missions_with_null_vehicle:
                if default_vehicle:
                    mission.vehicle_id = default_vehicle.id
                    print(f"✓ Mission {mission.id}: vehicle_id = {default_vehicle.id}")
            
            for mission in missions_with_null_user:
                mission.assigned_user_id = default_user.id
                if mission.created_by is None:
                    mission.created_by = default_user.id
                print(f"✓ Mission {mission.id}: assigned_user_id = {default_user.id}")
            
            db.session.commit()
        
        # Corriger les remboursements avec mission_id ou user_id NULL
        if reimbursements_with_null_mission or reimbursements_with_null_user:
            print(f"\nCorrection de {len(reimbursements_with_null_mission)} remboursements avec mission_id NULL...")
            print(f"Correction de {len(reimbursements_with_null_user)} remboursements avec user_id NULL...")
            
            # Pour les remboursements sans mission, on peut soit les supprimer soit leur assigner une mission par défaut
            if missions:
                default_mission = missions[0]
                
                for reimbursement in reimbursements_with_null_mission:
                    reimbursement.mission_id = default_mission.id
                    print(f"✓ Remboursement {reimbursement.id}: mission_id = {default_mission.id}")
                
                for reimbursement in reimbursements_with_null_user:
                    reimbursement.user_id = default_user.id
                    print(f"✓ Remboursement {reimbursement.id}: user_id = {default_user.id}")
                
                db.session.commit()
            else:
                print("⚠️  Aucune mission disponible pour corriger les remboursements")
        
        # Corriger les anomalies avec vehicle_id NULL
        if anomalies_with_null_vehicle:
            print(f"\nCorrection de {len(anomalies_with_null_vehicle)} anomalies avec vehicle_id NULL...")
            
            for anomaly in anomalies_with_null_vehicle:
                if default_vehicle:
                    anomaly.vehicle_id = default_vehicle.id
                    print(f"✓ Anomalie {anomaly.id}: vehicle_id = {default_vehicle.id}")
            
            db.session.commit()
        
        # 6. VÉRIFICATION FINALE
        print("\n=== VÉRIFICATION FINALE ===")
        
        # Revérifier toutes les contraintes
        print("\nVérification des missions...")
        problematic_missions = Mission.query.filter(
            (Mission.vehicle_id == None) | 
            (Mission.assigned_user_id == None) |
            (Mission.created_by == None)
        ).all()
        
        if problematic_missions:
            print(f"⚠️  {len(problematic_missions)} missions ont encore des problèmes")
            for mission in problematic_missions:
                print(f"  Mission {mission.id}: vehicle_id={mission.vehicle_id}, assigned_user_id={mission.assigned_user_id}, created_by={mission.created_by}")
        else:
            print("✓ Toutes les missions sont correctes")
        
        print("\nVérification des remboursements...")
        problematic_reimbursements = Reimbursement.query.filter(
            (Reimbursement.mission_id == None) | 
            (Reimbursement.user_id == None)
        ).all()
        
        if problematic_reimbursements:
            print(f"⚠️  {len(problematic_reimbursements)} remboursements ont encore des problèmes")
        else:
            print("✓ Tous les remboursements sont corrects")
        
        print("\nVérification des anomalies...")
        problematic_anomalies = Anomaly.query.filter(Anomaly.vehicle_id == None).all()
        
        if problematic_anomalies:
            print(f"⚠️  {len(problematic_anomalies)} anomalies ont encore des problèmes")
        else:
            print("✓ Toutes les anomalies sont correctes")
        
        print("\n=== CORRECTION TERMINÉE ===")
        print("La base de données a été corrigée. Vous pouvez maintenant utiliser l'application normalement.")

if __name__ == "__main__":
    diagnose_and_fix_all()
