import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './FleetMap.css';

// Types pour TypeScript
interface LeafletMap extends L.Map {}
interface LeafletEvent extends L.LeafletEvent {
  latlng: L.LatLng;
}

// Configuration des icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icônes personnalisées pour les véhicules
const vehicleIcons = {
  available: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#28a745">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    `),
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  in_use: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#007bff">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    `),
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  maintenance: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64=' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc3545">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    `),
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  }),
  offline: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64=' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#6c757d">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
      </svg>
    `),
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  })
};

interface Vehicle {
  id: number;
  license_plate: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  last_update: string;
  speed?: number;
  heading?: number;
  brand?: string;
  model?: string;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
}

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedVehicle?: Vehicle | null;
  showRoutes?: boolean;
  routes?: { [vehicleId: number]: RoutePoint[] };
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onMapClick?: (lat: number, lng: number) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
}

// Composant pour contrôler la carte
function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  return null;
}

// Composant pour afficher les statistiques en temps réel
function MapStats({ vehicles }: { vehicles: Vehicle[] }) {
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    in_use: vehicles.filter(v => v.status === 'in_use').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    offline: vehicles.filter(v => v.status === 'offline').length,
  };

  return (
    <div className="map-stats">
      <div className="stat-item">
        <span className="stat-label">Total</span>
        <span className="stat-value">{stats.total}</span>
      </div>
      <div className="stat-item available">
        <span className="stat-label">Disponibles</span>
        <span className="stat-value">{stats.available}</span>
      </div>
      <div className="stat-item in-use">
        <span className="stat-label">En cours</span>
        <span className="stat-value">{stats.in_use}</span>
      </div>
      <div className="stat-item maintenance">
        <span className="stat-label">Maintenance</span>
        <span className="stat-value">{stats.maintenance}</span>
      </div>
      <div className="stat-item offline">
        <span className="stat-label">Hors ligne</span>
        <span className="stat-value">{stats.offline}</span>
      </div>
    </div>
  );
}

// Composant principal de la carte
const FleetMap: React.FC<FleetMapProps> = ({
  vehicles = [],
  selectedVehicle = null,
  showRoutes = false,
  routes = {},
  onVehicleSelect,
  onMapClick,
  center = [48.8566, 2.3522], // Paris par défaut
  zoom = 12,
  height = '600px',
  className = ''
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Recalculer le centre si les véhicules changent
  useEffect(() => {
    if (vehicles.length > 0) {
      const avgLat = vehicles.reduce((sum, v) => sum + v.latitude, 0) / vehicles.length;
      const avgLng = vehicles.reduce((sum, v) => sum + v.longitude, 0) / vehicles.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [vehicles]);

  // Centrer sur le véhicule sélectionné
  useEffect(() => {
    if (selectedVehicle) {
      setMapCenter([selectedVehicle.latitude, selectedVehicle.longitude]);
      setMapZoom(15);
    }
  }, [selectedVehicle]);

  const handleVehicleClick = (vehicle: Vehicle) => {
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
  };

  const formatLastUpdate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      available: 'Disponible',
      in_use: 'En cours',
      maintenance: 'Maintenance',
      offline: 'Hors ligne'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: '#28a745',
      in_use: '#007bff',
      maintenance: '#dc3545',
      offline: '#6c757d'
    };
    return colors[status as keyof typeof colors] || '#6c757d';
  };

  return (
    <div className={`fleet-map-container ${className}`}>
      {/* Statistiques */}
      <MapStats vehicles={vehicles} />
      
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <span>Mise à jour en cours...</span>
        </div>
      )}

      {/* Carte */}
      <div className="map-wrapper" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          ref={(mapInstance) => {
            if (mapInstance) {
              mapRef.current = mapInstance;
              if (onMapClick) {
                mapInstance.on('click', (e: LeafletEvent) => {
                  onMapClick(e.latlng.lat, e.latlng.lng);
                });
              }
            }
          }}
        >
          {/* Couches de tuiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Contrôleur de carte */}
          <MapController center={mapCenter} zoom={mapZoom} />

          {/* Marqueurs des véhicules */}
          {vehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={[vehicle.latitude, vehicle.longitude]}
              icon={vehicleIcons[vehicle.status] || vehicleIcons.offline}
              eventHandlers={{
                click: () => handleVehicleClick(vehicle),
              }}
            >
              <Popup className="vehicle-popup">
                <div className="vehicle-info">
                  <div className="vehicle-header">
                    <h4>🚗 {vehicle.license_plate}</h4>
                    <span 
                      className={`status-badge status-${vehicle.status}`}
                      style={{ backgroundColor: getStatusColor(vehicle.status) }}
                    >
                      {getStatusLabel(vehicle.status)}
                    </span>
                  </div>
                  
                  <div className="vehicle-details">
                    <div className="detail-row">
                      <span className="label">ID:</span>
                      <span className="value">{vehicle.id}</span>
                    </div>
                    
                    {vehicle.brand && vehicle.model && (
                      <div className="detail-row">
                        <span className="label">Véhicule:</span>
                        <span className="value">{vehicle.brand} {vehicle.model}</span>
                      </div>
                    )}
                    
                    <div className="detail-row">
                      <span className="label">Position:</span>
                      <span className="value">
                        {vehicle.latitude.toFixed(6)}, {vehicle.longitude.toFixed(6)}
                      </span>
                    </div>
                    
                    {vehicle.speed !== undefined && (
                      <div className="detail-row">
                        <span className="label">Vitesse:</span>
                        <span className="value">{Math.round(vehicle.speed)} km/h</span>
                      </div>
                    )}
                    
                    <div className="detail-row">
                      <span className="label">Dernière MAJ:</span>
                      <span className="value">{formatLastUpdate(vehicle.last_update)}</span>
                    </div>
                  </div>
                  
                  <div className="vehicle-actions">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleVehicleClick(vehicle)}
                    >
                      📍 Suivre
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Routes des véhicules */}
          {showRoutes && Object.entries(routes).map(([vehicleId, routePoints]) => {
            if (routePoints.length < 2) return null;
            
            const positions: [number, number][] = routePoints.map(point => [
              point.latitude,
              point.longitude
            ]);

            return (
              <Polyline
                key={`route-${vehicleId}`}
                positions={positions}
                color="#007bff"
                weight={3}
                opacity={0.7}
                dashArray="5, 10"
              />
            );
          })}

          {/* Marqueur pour le véhicule sélectionné */}
          {selectedVehicle && (
            <Marker
              position={[selectedVehicle.latitude, selectedVehicle.longitude]}
              icon={new L.Icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffc107">
                    <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2"/>
                    <circle cx="12" cy="12" r="6"/>
                  </svg>
                `),
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                className: 'selected-vehicle-marker'
              })}
            />
          )}
        </MapContainer>
      </div>

      {/* Légende */}
      <div className="map-legend">
        <h4>Légende</h4>
        <div className="legend-items">
          {Object.entries(vehicleIcons).map(([status, icon]) => (
            <div key={status} className="legend-item">
              <div 
                className="legend-icon"
                style={{ 
                  backgroundColor: getStatusColor(status),
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px'
                }}
              ></div>
              <span>{getStatusLabel(status)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FleetMap;
