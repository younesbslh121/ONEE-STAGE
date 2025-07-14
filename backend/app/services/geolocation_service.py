import folium
# import geopandas as gpd  # Temporairement désactivé
# import pandas as pd  # Temporairement désactivé  
# from shapely.geometry import Point, LineString  # Temporairement désactivé
try:
    from folium.plugins import MarkerCluster, HeatMap, TimestampedGeoJson, AntPath
except ImportError:
    # Versions de base sans plugins avancés
    MarkerCluster = None
    HeatMap = None
    TimestampedGeoJson = None
    AntPath = None
from app.models.vehicle import Vehicle
from app.models.location import Location
from app.models.mission import Mission
from app import db
from datetime import datetime, timedelta
import json
import base64
from io import StringIO
import random
import math

class GeolocationService:
    
    @staticmethod
    def create_interactive_fleet_map(center_lat = 34.0209, center_lon = -6.8416, zoom=12):
        """Créer une carte interactive avec Folium pour la flotte."""
        
        # Créer la carte de base avec un style professionnel
        m = folium.Map(
            location=[center_lat, center_lon],
            zoom_start=zoom,
            tiles='CartoDB positron',  # Style professionnel épuré
            control_scale=True
        )
        
        # Ajouter différents types de tuiles
        folium.TileLayer('openstreetmap').add_to(m)
        folium.TileLayer('CartoDB dark_matter').add_to(m)
        folium.TileLayer('CartoDB Voyager').add_to(m)
        folium.TileLayer('Stamen Terrain').add_to(m)
        
        # Contrôleur de couches
        folium.LayerControl().add_to(m)
        
        return m
    
    @staticmethod
    def add_vehicle_markers(map_obj, vehicles_data):
        """Ajouter des marqueurs de véhicules avec clustering."""
        
        # Créer un cluster de marqueurs si disponible
        if MarkerCluster:
            marker_cluster = MarkerCluster(
                name="Véhicules",
                options={
                    'disableClusteringAtZoom': 15,
                    'maxClusterRadius': 50
                }
            ).add_to(map_obj)
        else:
            marker_cluster = map_obj
        
        # Couleurs par statut
        status_colors = {
            'available': 'green',
            'in_use': 'blue',
            'maintenance': 'red',
            'offline': 'gray'
        }
        
        # Icônes par statut
        status_icons = {
            'available': 'ok-sign',
            'in_use': 'road',
            'maintenance': 'wrench',
            'offline': 'remove-sign'
        }
        
        for vehicle in vehicles_data:
            color = status_colors.get(vehicle.get('status', 'offline'), 'gray')
            icon = status_icons.get(vehicle.get('status', 'offline'), 'remove-sign')
            
            # Popup avec informations détaillées
            popup_html = f"""
            <div style="font-family: Arial, sans-serif; width: 250px;">
                <h4 style="color: {color}; margin: 0 0 10px 0;">
                    🚗 {vehicle.get('license_plate', 'N/A')}
                </h4>
                <table style="width: 100%; font-size: 12px;">
                    <tr><td><b>ID:</b></td><td>{vehicle.get('id', 'N/A')}</td></tr>
                    <tr><td><b>Statut:</b></td><td><span style="color: {color};">{vehicle.get('status', 'N/A')}</span></td></tr>
                    <tr><td><b>Position:</b></td><td>{vehicle.get('latitude', 0):.6f}, {vehicle.get('longitude', 0):.6f}</td></tr>
                    <tr><td><b>Dernière MAJ:</b></td><td>{vehicle.get('last_update', 'N/A')}</td></tr>
                </table>
                <div style="margin-top: 10px; text-align: center;">
                    <button onclick="trackVehicle({vehicle.get('id')})" 
                            style="background: {color}; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                        Suivre
                    </button>
                </div>
            </div>
            """
            
            folium.Marker(
                location=[vehicle.get('latitude', 0), vehicle.get('longitude', 0)],
                popup=folium.Popup(popup_html, max_width=300),
                tooltip=f"Véhicule {vehicle.get('license_plate', 'N/A')} - {vehicle.get('status', 'N/A')}",
                icon=folium.Icon(
                    color=color,
                    icon=icon,
                    prefix='glyphicon'
                )
            ).add_to(marker_cluster)
        
        return map_obj
    
    @staticmethod
    def add_vehicle_route(map_obj, vehicle_id, route_data):
        """Ajouter une route de véhicule avec animation."""
        
        if not route_data:
            return map_obj
        
        # Extraire les coordonnées
        coordinates = [[point['latitude'], point['longitude']] for point in route_data]
        
        if len(coordinates) < 2:
            return map_obj
        
        # Ajouter la route avec animation (AntPath) si disponible
        if AntPath:
            AntPath(
                locations=coordinates,
                options={
                    'delay': 1000,
                    'dashArray': [10, 20],
                    'weight': 4,
                    'color': '#0066cc',
                    'pulseColor': '#ffffff'
                }
            ).add_to(map_obj)
        else:
            # Fallback avec une simple polyline
            folium.PolyLine(
                locations=coordinates,
                color='#0066cc',
                weight=4,
                opacity=0.8
            ).add_to(map_obj)
        
        # Ajouter des marqueurs de début et fin
        if coordinates:
            # Début
            folium.Marker(
                location=coordinates[0],
                popup="Début du trajet",
                icon=folium.Icon(color='green', icon='play', prefix='glyphicon')
            ).add_to(map_obj)
            
            # Fin
            folium.Marker(
                location=coordinates[-1],
                popup="Fin du trajet",
                icon=folium.Icon(color='red', icon='stop', prefix='glyphicon')
            ).add_to(map_obj)
        
        return map_obj
    
    @staticmethod
    def create_heatmap(map_obj, location_data):
        """Créer une carte de chaleur des activités."""
        
        if not location_data:
            return map_obj
        
        # Préparer les données pour la heatmap
        heat_data = []
        for location in location_data:
            heat_data.append([
                location.get('latitude', 0),
                location.get('longitude', 0),
                location.get('intensity', 1)
            ])
        
        # Ajouter la heatmap si disponible
        if HeatMap:
            HeatMap(
                heat_data,
                name="Activité des véhicules",
                min_opacity=0.2,
                max_zoom=18,
                radius=15,
                blur=15,
                gradient={
                    0.2: 'blue',
                    0.4: 'cyan',
                    0.6: 'lime',
                    0.8: 'yellow',
                    1.0: 'red'
                }
            ).add_to(map_obj)
        else:
            # Fallback avec des marqueurs simples
            for point in heat_data:
                folium.CircleMarker(
                    location=[point[0], point[1]],
                    radius=5,
                    popup=f"Activité: {point[2] if len(point) > 2 else 1}",
                    color='red',
                    fill=True,
                    opacity=0.6
                ).add_to(map_obj)
        
        return map_obj
    
    @staticmethod
    def analyze_fleet_with_geopandas():
        """Analyser la flotte - Version simplifiée sans GeoPandas."""
        
        try:
            # Récupérer toutes les locations récentes
            locations = db.session.query(Location).join(Vehicle).filter(
                Location.timestamp >= datetime.utcnow() - timedelta(hours=24)
            ).all()
            
            if not locations:
                return {'error': 'Aucune donnée de localisation trouvée'}
            
            # Analyse basique sans pandas/geopandas
            speeds = [loc.speed or 0 for loc in locations]
            vehicle_ids = list(set(loc.vehicle_id for loc in locations))
            
            # Calculs de base
            analysis = {
                'total_vehicles': len(vehicle_ids),
                'total_locations': len(locations),
                'average_speed': sum(speeds) / len(speeds) if speeds else 0,
                'max_speed': max(speeds) if speeds else 0,
                'min_speed': min(speeds) if speeds else 0,
                'bbox': {
                    'north': max(loc.latitude for loc in locations),
                    'south': min(loc.latitude for loc in locations),
                    'east': max(loc.longitude for loc in locations),
                    'west': min(loc.longitude for loc in locations)
                }
            }
            
            # Calcul basique de distance par véhicule
            vehicle_distances = {}
            for vehicle_id in vehicle_ids:
                vehicle_locations = [loc for loc in locations if loc.vehicle_id == vehicle_id]
                vehicle_locations.sort(key=lambda x: x.timestamp)
                
                distance = 0
                for i in range(1, len(vehicle_locations)):
                    # Distance euclidienne approximative
                    lat1, lon1 = vehicle_locations[i-1].latitude, vehicle_locations[i-1].longitude
                    lat2, lon2 = vehicle_locations[i].latitude, vehicle_locations[i].longitude
                    
                    # Approximation simple de distance
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    distance += math.sqrt(dlat*dlat + dlon*dlon) * 111000  # Approximation en mètres
                
                vehicle_distances[vehicle_id] = distance
            
            analysis['vehicle_distances'] = vehicle_distances
            analysis['total_distance'] = sum(vehicle_distances.values())
            
            return analysis
            
        except Exception as e:
            return {'error': f'Erreur lors de l\'analyse: {str(e)}'}
    
    @staticmethod
    def generate_folium_map_html(vehicles_data=None, route_data=None, heatmap_data=None):
        """Générer le HTML complet de la carte Folium."""
        
        try:
            # Déterminer le centre de la carte
            if vehicles_data:
                center_lat = sum(v.get('latitude', 48.8566) for v in vehicles_data) / len(vehicles_data)
                center_lon = sum(v.get('longitude', 2.3522) for v in vehicles_data) / len(vehicles_data)
            else:
                center_lat, center_lon = 48.8566, 2.3522  # Paris par défaut
            
            # Créer la carte
            m = GeolocationService.create_interactive_fleet_map(center_lat, center_lon)
            
            # Ajouter les véhicules
            if vehicles_data:
                m = GeolocationService.add_vehicle_markers(m, vehicles_data)
            
            # Ajouter la heatmap
            if heatmap_data:
                m = GeolocationService.create_heatmap(m, heatmap_data)
            
            # Ajouter du JavaScript personnalisé
            custom_js = """
            <script>
                function trackVehicle(vehicleId) {
                    alert('Suivi du véhicule ID: ' + vehicleId);
                    // Ici on peut ajouter la logique pour suivre le véhicule en temps réel
                }
                
                // Mise à jour automatique toutes les 30 secondes
                setInterval(function() {
                    console.log('Mise à jour de la carte...');
                    // Logique de mise à jour
                }, 30000);
            </script>
            """
            
            # Convertir en HTML
            map_html = m._repr_html_()
            map_html = map_html.replace('</body>', custom_js + '</body>')
            
            return {
                'html': map_html,
                'center': {'lat': center_lat, 'lon': center_lon},
                'vehicles_count': len(vehicles_data) if vehicles_data else 0
            }
            
        except Exception as e:
            return {'error': f'Erreur lors de la génération de la carte: {str(e)}'}
    
    @staticmethod
    def get_real_time_tracking_data():
        """Obtenir les données de suivi en temps réel."""
        
        try:
            # Récupérer les dernières positions de tous les véhicules
            subquery = db.session.query(
                Location.vehicle_id,
                db.func.max(Location.timestamp).label('latest_timestamp')
            ).group_by(Location.vehicle_id).subquery()
            
            latest_locations = db.session.query(Location).join(
                subquery,
                (Location.vehicle_id == subquery.c.vehicle_id) &
                (Location.timestamp == subquery.c.latest_timestamp)
            ).join(Vehicle).all()
            
            vehicles_data = []
            for location in latest_locations:
                vehicles_data.append({
                    'id': location.vehicle.id,
                    'license_plate': location.vehicle.license_plate,
                    'latitude': location.latitude,
                    'longitude': location.longitude,
                    'speed': location.speed or 0,
                    'heading': location.heading or 0,
                    'status': location.vehicle.status,
                    'last_update': location.timestamp.isoformat(),
                    'brand': location.vehicle.brand,
                    'model': location.vehicle.model
                })
            
            return vehicles_data
            
        except Exception as e:
            return []
    
    @staticmethod
    def simulate_real_time_movement():
        """Simuler des mouvements en temps réel pour la démonstration."""
        
        try:
            vehicles = Vehicle.query.all()
            movements = []
            
            for vehicle in vehicles:
                # Obtenir la dernière position
                last_location = Location.query.filter_by(
                    vehicle_id=vehicle.id
                ).order_by(Location.timestamp.desc()).first()
                
                if last_location:
                    # Simuler un petit déplacement
                    lat_change = random.uniform(-0.001, 0.001)
                    lon_change = random.uniform(-0.001, 0.001)
                    
                    new_lat = last_location.latitude + lat_change
                    new_lon = last_location.longitude + lon_change
                    speed = random.uniform(0, 60)
                    heading = random.uniform(0, 360)
                else:
                    # Position initiale aléatoire dans Paris
                    new_lat = 48.8566 + random.uniform(-0.05, 0.05)
                    new_lon = 2.3522 + random.uniform(-0.05, 0.05)
                    speed = random.uniform(10, 50)
                    heading = random.uniform(0, 360)
                
                # Créer nouvelle location
                new_location = Location(
                    vehicle_id=vehicle.id,
                    latitude=new_lat,
                    longitude=new_lon,
                    speed=speed,
                    heading=heading,
                    timestamp=datetime.utcnow()
                )
                
                db.session.add(new_location)
                
                movements.append({
                    'vehicle_id': vehicle.id,
                    'license_plate': vehicle.license_plate,
                    'latitude': new_lat,
                    'longitude': new_lon,
                    'speed': speed,
                    'heading': heading
                })
            
            db.session.commit()
            return movements
            
        except Exception as e:
            db.session.rollback()
            return []
