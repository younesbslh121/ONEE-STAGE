import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Chip } from '@mui/material';

// Fix for default icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface VehicleMapData {
  id: number;
  license_plate: string;
  latitude: number;
  longitude: number;
  status: string;
  last_update: string;
  brand?: string;
  model?: string;
}

interface LeafletMapProps {
  vehicles: VehicleMapData[];
  center?: [number, number];
  zoom?: number;
  height?: number;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  vehicles, 
  center = [33.9716, -6.8498], // Rabat, Morocco
  zoom = 13,
  height = 400 
}) => {
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        console.log('Initializing Leaflet map...');
        console.log('Vehicles data:', vehicles);
        
        // Vérifier si les véhicules ont des coordonnées valides
        const validVehicles = vehicles.filter(vehicle => 
          vehicle.latitude && 
          vehicle.longitude && 
          !isNaN(vehicle.latitude) && 
          !isNaN(vehicle.longitude) &&
          vehicle.latitude >= -90 && vehicle.latitude <= 90 &&
          vehicle.longitude >= -180 && vehicle.longitude <= 180
        );
        
        console.log('Valid vehicles for map:', validVehicles);
        
        if (validVehicles.length === 0) {
          console.warn('No valid vehicles found for map display');
        }
        
        setMapReady(true);
        setError(null);
      } catch (err) {
        console.error('Map loading error:', err);
        setError('Erreur lors du chargement de la carte: ' + (err as Error).message);
      }
    };
    
    loadMap();
  }, [vehicles]);

  const getMarkerIcon = (status: string) => {
    const getColor = () => {
      switch (status) {
        case 'available': return 'green';
        case 'in_use': return 'blue';
        case 'maintenance': return 'orange';
        case 'out_of_service': return 'red';
        default: return 'gray';
      }
    };

    try {
      return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${getColor()}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    } catch (error) {
      console.warn('Error creating custom marker icon, using default:', error);
      // Utiliser l'icône par défaut si l'icône personnalisée échoue
      return new L.Icon.Default();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'in_use': return 'En service';
      case 'maintenance': return 'Maintenance';
      case 'out_of_service': return 'Hors service';
      default: return 'Inconnu';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'in_use': return 'primary';
      case 'maintenance': return 'warning';
      case 'out_of_service': return 'error';
      default: return 'default';
    }
  };

  if (error) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'error.light',
          borderRadius: 2,
          color: 'error.contrastText'
        }}
      >
        <Typography>{error}</Typography>
      </Box>
    );
  }

  if (!mapReady) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          borderRadius: 2
        }}
      >
        <Typography>Chargement de la carte...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehicles
          .filter(vehicle => 
            vehicle.latitude && 
            vehicle.longitude && 
            !isNaN(vehicle.latitude) && 
            !isNaN(vehicle.longitude) &&
            vehicle.latitude >= -90 && vehicle.latitude <= 90 &&
            vehicle.longitude >= -180 && vehicle.longitude <= 180
          )
          .map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={getMarkerIcon(vehicle.status)}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="h6" gutterBottom>
                  {vehicle.license_plate}
                </Typography>
                {vehicle.brand && vehicle.model && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {vehicle.brand} {vehicle.model}
                  </Typography>
                )}
                <Chip 
                  label={getStatusLabel(vehicle.status)}
                  color={getStatusColor(vehicle.status) as any}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  <strong>Position:</strong><br />
                  Lat: {vehicle.latitude.toFixed(6)}<br />
                  Lng: {vehicle.longitude.toFixed(6)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Dernière mise à jour:</strong><br />
                  {new Date(vehicle.last_update).toLocaleString('fr-FR')}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default LeafletMap;
