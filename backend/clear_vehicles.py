#!/usr/bin/env python3
"""
Script pour supprimer tous les véhicules de la base de données
"""

from app import create_app, db
from app.models.vehicle import Vehicle
from app.models.mission import Mission

def clear_vehicles():
    """Supprime tous les véhicules de la base de données"""
    app = create_app()
    with app.app_context():
        print("🧹 Suppression de tous les véhicules...")
        
        # Vérifier s'il y a des véhicules
        vehicle_count = Vehicle.query.count()
        print(f"📊 Nombre de véhicules trouvés: {vehicle_count}")
        
        if vehicle_count == 0:
            print("✅ Aucun véhicule à supprimer")
            return
        
        # Vérifier s'il y a des missions actives
        active_missions = Mission.query.filter(
            Mission.status.in_(['pending', 'in_progress'])
        ).count()
        
        if active_missions > 0:
            print(f"⚠️  {active_missions} mission(s) active(s) trouvée(s)")
            print("🔄 Annulation des missions actives...")
            
            # Annuler toutes les missions actives
            Mission.query.filter(
                Mission.status.in_(['pending', 'in_progress'])
            ).update({'status': 'cancelled'})
            
            db.session.commit()
            print("✅ Missions annulées")
        
        # Supprimer tous les véhicules
        Vehicle.query.delete()
        db.session.commit()
        
        print(f"✅ {vehicle_count} véhicule(s) supprimé(s) avec succès!")
        print("🎉 Base de données nettoyée - prête pour un nouveau départ!")

if __name__ == "__main__":
    clear_vehicles()
