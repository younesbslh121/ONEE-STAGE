import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import FleetMap from '../components/Map/FleetMap';

// Données de test pour les véhicules
const testVehicles = [
  {
    id: 1,
    license_plate: 'ABC-123',
    latitude: 48.8566,
    longitude: 2.3522,
    status: 'available' as const,
    last_update: new Date().toISOString(),
    speed: 0,
    brand: 'Peugeot',
    model: '308'
  },
  {
    id: 2,
    license_plate: 'DEF-456',
    latitude: 48.8606,
    longitude: 2.3376,
    status: 'in_use' as const,
    last_update: new Date().toISOString(),
    speed: 35,
    brand: 'Renault',
    model: 'Clio'
  },
  {
    id: 3,
    license_plate: 'GHI-789',
    latitude: 48.8529,
    longitude: 2.3499,
    status: 'maintenance' as const,
    last_update: new Date().toISOString(),
    speed: 0,
    brand: 'Citroën',
    model: 'C3'
  }
];

const MapTest: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = React.useState(null);

  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    console.log('Vehicle selected:', vehicle);
  };

  const handleMapClick = (lat: number, lng: number) => {
    console.log('Map clicked at:', lat, lng);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Test de la Carte Leaflet
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Cette page teste l'affichage de la carte Leaflet avec des véhicules de test.
      </Typography>

      {selectedVehicle && (
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="h6">Véhicule sélectionné:</Typography>
          <Typography>{JSON.stringify(selectedVehicle, null, 2)}</Typography>
        </Box>
      )}

      <Button 
        variant="outlined" 
        onClick={() => setSelectedVehicle(null)}
        sx={{ mb: 2 }}
      >
        Désélectionner véhicule
      </Button>

      <Box sx={{ height: '600px', border: '2px solid #ddd', borderRadius: 2 }}>
        <FleetMap
          vehicles={testVehicles}
          selectedVehicle={selectedVehicle}
          onVehicleSelect={handleVehicleSelect}
          onMapClick={handleMapClick}
          center={[48.8566, 2.3522]}
          zoom={13}
          height="100%"
          showRoutes={false}
        />
      </Box>
    </Box>
  );
};

export default MapTest;
