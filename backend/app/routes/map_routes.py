from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from app.services.location_service import LocationService
from app.services.map_service import MapService
from app.services.geolocation_service import GeolocationService
from app.models.vehicle import Vehicle
from app.models.mission import Mission
from app.models.location import Location

map_bp = Blueprint('map', __name__)

@map_bp.route('/fleet', methods=['GET'])
def get_fleet_map():
    """Get fleet map with all vehicle locations and active missions."""
    try:
        from app.models.user import User
        from app import db
        
        # Get all current vehicle locations (public access)
        result, status_code = LocationService.get_all_current_locations_public()
        
        if status_code != 200:
            return jsonify(result), status_code
        
        locations = result['locations']
        
        # Create map centered on first location or default
        if locations:
            center_lat = locations[0]['latitude']
            center_lon = locations[0]['longitude']
        else:
            center_lat = 48.8566  # Default to Paris
            center_lon = 2.3522
        
        map_data = {
            'center': {'lat': center_lat, 'lon': center_lon},
            'zoom': 12,
            'vehicles': [],
            'active_missions': []
        }
        
        # Add vehicle markers with mission info
        for location in locations:
            # Get active mission for this vehicle
            active_mission = Mission.query.filter(
                Mission.vehicle_id == location['vehicle']['id'],
                Mission.status == 'in_progress'
            ).first()
            
            # Get assigned user info if there's an active mission
            assigned_user = None
            if active_mission:
                assigned_user = User.query.filter(
                    User.id == active_mission.assigned_user_id
                ).first()
            
            vehicle_info = {
                'id': location['vehicle']['id'],
                'license_plate': location['vehicle']['license_plate'],
                'latitude': location['latitude'],
                'longitude': location['longitude'],
                'status': location['vehicle']['status'],
                'last_update': location['timestamp'],
                'active_mission': {
                    'id': active_mission.id,
                    'title': active_mission.title,
                    'priority': active_mission.priority,
                    'start_address': active_mission.start_address,
                    'end_address': active_mission.end_address,
                    'assigned_user': {
                        'id': assigned_user.id,
                        'name': f"{assigned_user.first_name} {assigned_user.last_name}",
                        'email': assigned_user.email
                    } if assigned_user else None
                } if active_mission else None
            }
            map_data['vehicles'].append(vehicle_info)
        
        # Get all active missions for separate display
        active_missions = Mission.query.filter(
            Mission.status == 'in_progress'
        ).all()
        
        for mission in active_missions:
            assigned_user = User.query.filter(
                User.id == mission.assigned_user_id
            ).first()
            
            vehicle = Vehicle.query.filter(
                Vehicle.id == mission.vehicle_id
            ).first()
            
            mission_info = {
                'id': mission.id,
                'title': mission.title,
                'priority': mission.priority,
                'start_latitude': mission.start_latitude,
                'start_longitude': mission.start_longitude,
                'end_latitude': mission.end_latitude,
                'end_longitude': mission.end_longitude,
                'start_address': mission.start_address,
                'end_address': mission.end_address,
                'vehicle': {
                    'id': vehicle.id,
                    'license_plate': vehicle.license_plate
                } if vehicle else None,
                'assigned_user': {
                    'id': assigned_user.id,
                    'name': f"{assigned_user.first_name} {assigned_user.last_name}",
                    'email': assigned_user.email
                } if assigned_user else None
            }
            map_data['active_missions'].append(mission_info)
        
        return jsonify(map_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/vehicle/<int:vehicle_id>/route', methods=['GET'])
@jwt_required()
def get_vehicle_route(vehicle_id):
    """Get route for a specific vehicle."""
    try:
        hours = request.args.get('hours', 24, type=int)
        
        result, status_code = LocationService.get_vehicle_locations(vehicle_id, hours)
        
        if status_code != 200:
            return jsonify(result), status_code
        
        locations = result['locations']
        vehicle = result['vehicle']
        
        if not locations:
            return jsonify({'error': 'No location data found for this vehicle'}), 404
        
        # Create route data
        route_data = {
            'vehicle': vehicle,
            'route': [
                {
                    'latitude': loc['latitude'],
                    'longitude': loc['longitude'],
                    'timestamp': loc['timestamp'],
                    'speed': loc.get('speed')
                }
                for loc in locations
            ]
        }
        
        return jsonify(route_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/mission/<int:mission_id>/route', methods=['GET'])
@jwt_required()
def get_mission_route(mission_id):
    """Get route for a specific mission."""
    try:
        # Get mission details
        mission = Mission.query.get(mission_id)
        if not mission:
            return jsonify({'error': 'Mission not found'}), 404
        
        # Get mission locations
        result, status_code = LocationService.get_mission_locations(mission_id)
        
        if status_code != 200:
            return jsonify(result), status_code
        
        locations = result['locations']
        
        # Create mission route data
        route_data = {
            'mission': mission.to_dict(),
            'planned_route': {
                'start': {
                    'latitude': mission.start_latitude,
                    'longitude': mission.start_longitude,
                    'address': mission.start_address
                },
                'end': {
                    'latitude': mission.end_latitude,
                    'longitude': mission.end_longitude,
                    'address': mission.end_address
                }
            },
            'actual_route': [
                {
                    'latitude': loc['latitude'],
                    'longitude': loc['longitude'],
                    'timestamp': loc['timestamp'],
                    'speed': loc.get('speed')
                }
                for loc in locations
            ]
        }
        
        return jsonify(route_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/heatmap', methods=['GET'])
@jwt_required()
def get_heatmap_data():
    """Get heatmap data for vehicle activity."""
    try:
        hours = request.args.get('hours', 24, type=int)
        
        # Get all recent locations
        from datetime import datetime, timedelta
        time_threshold = datetime.utcnow() - timedelta(hours=hours)
        
        locations = Location.query.filter(
            Location.timestamp >= time_threshold
        ).all()
        
        heatmap_data = []
        for location in locations:
            heatmap_data.append({
                'latitude': location.latitude,
                'longitude': location.longitude,
                'intensity': 1
            })
        
        return jsonify({'heatmap_data': heatmap_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/simulate-movement', methods=['POST'])
@jwt_required()
def simulate_movement():
    """Simulate vehicle movement for real-time testing."""
    try:
        result = MapService.simulate_vehicle_movement()
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/generate-sample-data', methods=['POST'])
def generate_sample_data():
    """Generate initial sample location data."""
    try:
        result = MapService.generate_sample_locations()
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/init-data', methods=['POST'])
def init_test_data():
    """Initialize all test data for development."""
    try:
        from app.models.user import User
        from app.models.vehicle import Vehicle
        from app.models.mission import Mission
        from app.models.location import Location
        from app import db
        from datetime import datetime, timedelta
        import random
        
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
        
        # Créer des missions de test
        if not Mission.query.first():
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
                    }
                ]
                
                for mission_data in missions_data:
                    mission = Mission(**mission_data)
                    db.session.add(mission)
                
                db.session.commit()
        
        # Créer des locations de test
        if not Location.query.first():
            vehicles = Vehicle.query.all()
            
            # Coordonnées de Paris et alentours
            paris_coords = [
                (48.8566, 2.3522),  # Centre de Paris
                (48.8675, 2.3634),  # République
                (48.8708, 2.3317),  # Opéra
                (48.8799, 2.3550),  # Gare du Nord
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
        
        return jsonify({'message': 'Données de test initialisées avec succès'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@map_bp.route('/test-data', methods=['GET'])
def get_test_data():
    """Get test data for debugging."""
    try:
        # Retourner directement des données de test sans base de données
        vehicles = [
            {
                'id': 1,
                'license_plate': 'ABC-123',
                'latitude': 48.8566 + (0.01 * 1),
                'longitude': 2.3522 + (0.01 * 1),
                'status': 'available',
                'last_update': '2025-01-10T12:00:00Z'
            },
            {
                'id': 2,
                'license_plate': 'DEF-456',
                'latitude': 48.8566 + (0.01 * 2),
                'longitude': 2.3522 + (0.01 * 2),
                'status': 'in_use',
                'last_update': '2025-01-10T12:00:00Z'
            },
            {
                'id': 3,
                'license_plate': 'GHI-789',
                'latitude': 48.8566 + (0.01 * 3),
                'longitude': 2.3522 + (0.01 * 3),
                'status': 'maintenance',
                'last_update': '2025-01-10T12:00:00Z'
            }
        ]
        
        # Créer les données de carte
        center_lat = 48.8566  # Paris center
        center_lon = 2.3522
        
        map_data = {
            'center': {'lat': center_lat, 'lon': center_lon},
            'zoom': 12,
            'vehicles': vehicles
        }
        
        return jsonify(map_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/folium-map', methods=['GET'])
def get_folium_map():
    """Générer une carte Folium interactive pour la flotte."""
    try:
        # Récupérer les données des véhicules
        vehicles_data = GeolocationService.get_real_time_tracking_data()
        
        # Générer la carte HTML
        map_result = GeolocationService.generate_folium_map_html(
            vehicles_data=vehicles_data
        )
        
        if 'error' in map_result:
            return jsonify(map_result), 500
        
        return jsonify({
            'success': True,
            'map_html': map_result['html'],
            'center': map_result['center'],
            'vehicles_count': map_result['vehicles_count']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/folium-map-with-route/<int:vehicle_id>', methods=['GET'])
def get_folium_map_with_route(vehicle_id):
    """Générer une carte Folium avec la route d'un véhicule spécifique."""
    try:
        hours = request.args.get('hours', 6, type=int)
        
        # Récupérer les données du véhicule et sa route (public access)
        result, status_code = LocationService.get_vehicle_locations_public(vehicle_id, hours)
        
        if status_code != 200:
            return jsonify(result), status_code
        
        route_data = result['locations']
        vehicle_data = [{
            'id': result['vehicle']['id'],
            'license_plate': result['vehicle']['license_plate'],
            'latitude': route_data[0]['latitude'] if route_data else 48.8566,
            'longitude': route_data[0]['longitude'] if route_data else 2.3522,
            'status': result['vehicle']['status']
        }] if route_data else []
        
        # Générer la carte avec la route
        map_result = GeolocationService.generate_folium_map_html(
            vehicles_data=vehicle_data
        )
        
        if 'error' in map_result:
            return jsonify(map_result), 500
        
        # Ajouter la route à la carte
        if route_data:
            # Ici on pourrait améliorer en ajoutant la route directement
            pass
        
        return jsonify({
            'success': True,
            'map_html': map_result['html'],
            'route_data': route_data,
            'vehicle': result['vehicle']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/fleet-analysis', methods=['GET'])
@jwt_required()
def get_fleet_analysis():
    """Analyser la flotte avec GeoPandas."""
    try:
        analysis = GeolocationService.analyze_fleet_with_geopandas()
        return jsonify(analysis), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/real-time-tracking', methods=['GET'])
def get_real_time_tracking():
    """Obtenir les données de suivi en temps réel."""
    try:
        vehicles_data = GeolocationService.get_real_time_tracking_data()
        return jsonify({
            'vehicles': vehicles_data,
            'timestamp': datetime.utcnow().isoformat(),
            'count': len(vehicles_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/simulate-real-time', methods=['POST'])
@jwt_required()
def simulate_real_time():
    """Simuler des mouvements en temps réel."""
    try:
        movements = GeolocationService.simulate_real_time_movement()
        return jsonify({
            'success': True,
            'movements': movements,
            'count': len(movements)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/folium-embed', methods=['GET'])
def get_folium_embed():
    """Renvoie la carte Folium en HTML pour l'intégration dans le frontend."""
    try:
        # Récupérer les données des véhicules
        vehicles_data = GeolocationService.get_real_time_tracking_data()
        
        # Générer la carte HTML
        map_result = GeolocationService.generate_folium_map_html(
            vehicles_data=vehicles_data
        )
        
        if 'error' in map_result:
            return f"<div style='padding: 20px; color: red;'>Erreur: {map_result['error']}</div>", 500
        
        # Retourner directement le HTML
        return map_result['html'], 200, {'Content-Type': 'text/html'}
        
    except Exception as e:
        return f"<div style='padding: 20px; color: red;'>Erreur: {str(e)}</div>", 500, {'Content-Type': 'text/html'}

@map_bp.route('/test-folium', methods=['GET'])
def test_folium():
    """Route de test pour vérifier que Folium fonctionne."""
    try:
        import folium
        
        # Créer une carte simple centrée sur Paris
        m = folium.Map(
            location=[48.8566, 2.3522],
            zoom_start=12,
            tiles='CartoDB positron'
        )
        
        # Ajouter quelques marqueurs de test
        test_vehicles = [
            {'lat': 48.8566, 'lng': 2.3522, 'name': 'Véhicule 1', 'status': 'available'},
            {'lat': 48.8606, 'lng': 2.3376, 'name': 'Véhicule 2', 'status': 'in_use'},
            {'lat': 48.8529, 'lng': 2.3499, 'name': 'Véhicule 3', 'status': 'maintenance'}
        ]
        
        colors = {
            'available': 'green',
            'in_use': 'blue', 
            'maintenance': 'red'
        }
        
        for vehicle in test_vehicles:
            folium.Marker(
                location=[vehicle['lat'], vehicle['lng']],
                popup=f"<b>{vehicle['name']}</b><br>Status: {vehicle['status']}",
                tooltip=vehicle['name'],
                icon=folium.Icon(color=colors.get(vehicle['status'], 'gray'), icon='car', prefix='fa')
            ).add_to(m)
        
        # Convertir en HTML
        map_html = m._repr_html_()
        
        return map_html, 200, {'Content-Type': 'text/html'}
        
    except Exception as e:
        return f"<div style='padding: 20px; color: red;'>Erreur Folium: {str(e)}</div>", 500, {'Content-Type': 'text/html'}

@map_bp.route('/active-missions', methods=['GET'])
def get_active_missions():
    """Get all active missions with real-time locations."""
    try:
        from app.models.user import User
        from app import db
        
        # Get all active missions
        active_missions = Mission.query.filter(
            Mission.status == 'in_progress'
        ).all()
        
        missions_data = []
        
        for mission in active_missions:
            # Get assigned user info
            assigned_user = User.query.get(mission.assigned_user_id)
            
            # Get vehicle info
            vehicle = Vehicle.query.get(mission.vehicle_id)
            
            # Get current location
            current_location = Location.query.filter_by(
                vehicle_id=mission.vehicle_id
            ).order_by(Location.timestamp.desc()).first()
            
            mission_info = {
                'id': mission.id,
                'title': mission.title,
                'priority': mission.priority,
                'start_latitude': mission.start_latitude,
                'start_longitude': mission.start_longitude,
                'end_latitude': mission.end_latitude,
                'end_longitude': mission.end_longitude,
                'start_address': mission.start_address,
                'end_address': mission.end_address,
                'status': mission.status,
                'assigned_user': {
                    'id': assigned_user.id,
                    'name': f"{assigned_user.first_name} {assigned_user.last_name}",
                    'email': assigned_user.email
                } if assigned_user else None,
                'vehicle': {
                    'id': vehicle.id,
                    'license_plate': vehicle.license_plate,
                    'brand': vehicle.brand,
                    'model': vehicle.model
                } if vehicle else None,
                'current_location': {
                    'latitude': current_location.latitude,
                    'longitude': current_location.longitude,
                    'timestamp': current_location.timestamp.isoformat() if current_location.timestamp else None,
                    'speed': current_location.speed
                } if current_location else None
            }
            missions_data.append(mission_info)
        
        return jsonify({
            'active_missions': missions_data,
            'count': len(missions_data),
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/mission/<int:mission_id>/update-position', methods=['POST'])
@jwt_required()
def update_mission_position(mission_id):
    """Update position for a mission in progress."""
    try:
        from app.services.mission_service import MissionService
        
        # Check if mission exists and is in progress
        mission = Mission.query.get(mission_id)
        if not mission:
            return jsonify({'error': 'Mission not found'}), 404
        
        if mission.status != 'in_progress':
            return jsonify({'error': 'Mission is not in progress'}), 400
        
        # Update mission tracking
        MissionService._start_mission_tracking(mission_id)
        
        # Get updated location
        current_location = Location.query.filter_by(
            vehicle_id=mission.vehicle_id
        ).order_by(Location.timestamp.desc()).first()
        
        return jsonify({
            'message': 'Position updated successfully',
            'mission_id': mission_id,
            'current_location': {
                'latitude': current_location.latitude,
                'longitude': current_location.longitude,
                'timestamp': current_location.timestamp.isoformat(),
                'speed': current_location.speed,
                'heading': current_location.heading
            } if current_location else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@map_bp.route('/simulate-all-missions', methods=['POST'])
@jwt_required()
def simulate_all_missions():
    """Simulate movement for all active missions."""
    try:
        from app.services.mission_service import MissionService
        
        # Get all active missions
        active_missions = Mission.query.filter(
            Mission.status == 'in_progress'
        ).all()
        
        updated_missions = []
        
        for mission in active_missions:
            try:
                # Update tracking for each mission
                MissionService._start_mission_tracking(mission.id)
                
                # Get updated location
                current_location = Location.query.filter_by(
                    vehicle_id=mission.vehicle_id
                ).order_by(Location.timestamp.desc()).first()
                
                updated_missions.append({
                    'mission_id': mission.id,
                    'title': mission.title,
                    'current_location': {
                        'latitude': current_location.latitude,
                        'longitude': current_location.longitude,
                        'timestamp': current_location.timestamp.isoformat(),
                        'speed': current_location.speed
                    } if current_location else None
                })
            except Exception as e:
                print(f"Error updating mission {mission.id}: {str(e)}")
                continue
        
        return jsonify({
            'message': 'All active missions updated',
            'updated_missions': updated_missions,
            'count': len(updated_missions)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
