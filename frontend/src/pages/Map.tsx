import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, CircularProgress, Alert, Switch, FormControlLabel } from '@mui/material';
import { Refresh, LocationOn, DirectionsCar, Assignment, PlayArrow, Stop } from '@mui/icons-material';
import OnepLogo from '../components/OnepLogo';
import LeafletMap from '../components/LeafletMap';
import { missionService } from '../services/missionService';
import { vehicleService } from '../services/vehicleService';
import { Vehicle, Mission } from '../types';

// CSS pour l'animation pulse
const pulseAnimation = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

// Injecter le CSS dans le document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = pulseAnimation;
  document.head.appendChild(style);
}

const Map: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading fleet data...');
      
      // Essayer de récupérer les données du backend
      try {
        const allMissions = await missionService.getMissions();
        console.log('All missions:', allMissions);
        const activeMissionsData = allMissions.filter(
          mission => mission.status === 'in_progress' || mission.status === 'pending'
        );
        console.log('Active missions:', activeMissionsData);
        
        setMissions(allMissions);
        setActiveMissions(activeMissionsData);
        
        // Récupérer les véhicules associés aux missions actives
        const vehicleIds = activeMissionsData.map(mission => mission.vehicle_id);
        const uniqueVehicleIds = Array.from(new Set(vehicleIds));
        console.log('Unique vehicle IDs:', uniqueVehicleIds);
        
        if (uniqueVehicleIds.length > 0) {
          const vehiclePromises = uniqueVehicleIds.map(id => vehicleService.getVehicle(id));
          const fetchedVehicles = await Promise.all(vehiclePromises);
          console.log('Fetched vehicles:', fetchedVehicles);
          setVehicles(fetchedVehicles);
        } else {
          // Utiliser des données de test si aucune mission active
          throw new Error('No active missions found');
        }
      } catch (backendError) {
        console.warn('Backend not available, using test data:', backendError);
        
        // Utiliser des données de test complet
        const testMissions: Mission[] = [
          {
            id: 1,
            title: 'Mission de maintenance - Casablanca',
            description: 'Vérification des canalisations dans le quartier Maarif',
            status: 'in_progress',
            start_address: 'Siège ONEP, Rabat',
            end_address: 'Quartier Maarif, Casablanca',
            start_time: new Date().toISOString(),
            end_time: null,
            vehicle_id: 1,
            assigned_user_id: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            vehicle: {
              id: 1,
              license_plate: 'ONEP-001',
              brand: 'Toyota',
              model: 'Hilux',
              year: 2020,
              color: 'Blanc',
              fuel_type: 'diesel',
              status: 'in_use',
              current_latitude: 33.9716,
              current_longitude: -6.8498,
              last_location_update: new Date().toISOString(),
              driver_id: undefined,
              driver: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            assigned_user: {
              id: 1,
              username: 'ahmed.benali',
              email: 'ahmed.benali@onep.ma',
              first_name: 'Ahmed',
              last_name: 'Benali',
              role: 'technician',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          },
          {
            id: 2,
            title: 'Mission d\'inspection - Salé',
            description: 'Inspection des installations à Salé',
            status: 'pending',
            start_address: 'Siège ONEP, Rabat',
            end_address: 'Centre-ville, Salé',
            start_time: new Date().toISOString(),
            end_time: null,
            vehicle_id: 2,
            assigned_user_id: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            vehicle: {
              id: 2,
              license_plate: 'ONEP-002',
              brand: 'Ford',
              model: 'Ranger',
              year: 2021,
              color: 'Bleu',
              fuel_type: 'gasoline',
              status: 'available',
              current_latitude: 33.9800,
              current_longitude: -6.8600,
              last_location_update: new Date().toISOString(),
              driver_id: undefined,
              driver: undefined,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            assigned_user: {
              id: 2,
              username: 'fatima.alaoui',
              email: 'fatima.alaoui@onep.ma',
              first_name: 'Fatima',
              last_name: 'Alaoui',
              role: 'inspector',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        ];
        
        const testVehicles: Vehicle[] = [
          {
            id: 1,
            license_plate: 'ONEP-001',
            brand: 'Toyota',
            model: 'Hilux',
            year: 2020,
            color: 'Blanc',
            fuel_type: 'diesel',
            status: 'in_use',
            current_latitude: 33.9716,
            current_longitude: -6.8498,
            last_location_update: new Date().toISOString(),
            driver_id: undefined,
            driver: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            license_plate: 'ONEP-002',
            brand: 'Ford',
            model: 'Ranger',
            year: 2021,
            color: 'Bleu',
            fuel_type: 'gasoline',
            status: 'available',
            current_latitude: 33.9800,
            current_longitude: -6.8600,
            last_location_update: new Date().toISOString(),
            driver_id: undefined,
            driver: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 3,
            license_plate: 'ONEP-003',
            brand: 'Renault',
            model: 'Duster',
            year: 2022,
            color: 'Gris',
            fuel_type: 'diesel',
            status: 'in_use',
            current_latitude: 33.9900,
            current_longitude: -6.8700,
            last_location_update: new Date().toISOString(),
            driver_id: undefined,
            driver: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        const activeMissionsData = testMissions.filter(
          mission => mission.status === 'in_progress' || mission.status === 'pending'
        );
        
        setMissions(testMissions);
        setActiveMissions(activeMissionsData);
        setVehicles(testVehicles);
        
        console.log('Using test data:', { missions: testMissions, vehicles: testVehicles });
      }
      
      setLastUpdateTime(new Date());
    } catch (err: any) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour démarrer/arrêter le suivi en temps réel
  const toggleRealTimeTracking = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
  };

  // Effet pour gérer le suivi en temps réel
  useEffect(() => {
    if (isRealTimeEnabled) {
      // Démarrer l'intervalle de mise à jour
      intervalRef.current = setInterval(() => {
        loadFleetData();
      }, 10000); // Mise à jour toutes les 10 secondes
    } else {
      // Arrêter l'intervalle
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Nettoyage lors du démontage du composant
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealTimeEnabled]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#4caf50'; // Green
      case 'in_use':
        return '#2196f3'; // Blue
      case 'maintenance':
        return '#ff9800'; // Orange
      case 'out_of_service':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'in_use':
        return 'En service';
      case 'maintenance':
        return 'Maintenance';
      case 'out_of_service':
        return 'Hors service';
      default:
        return 'Inconnu';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Chargement de la carte...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={loadFleetData} variant="contained" startIcon={<Refresh />}>
          Réessayer
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <OnepLogo width={50} height={50} />
        <Typography variant="h4" sx={{ ml: 2, fontWeight: 'bold' }}>
          Carte de la Flotte ONEP
        </Typography>
      </Box>

      {/* Status Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {lastUpdateTime && `Dernière mise à jour: ${lastUpdateTime.toLocaleTimeString()}`}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isRealTimeEnabled}
                onChange={toggleRealTimeTracking}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {isRealTimeEnabled ? <Stop sx={{ mr: 0.5 }} /> : <PlayArrow sx={{ mr: 0.5 }} />}
                Suivi temps réel
              </Box>
            }
          />
        </Box>
        <Button onClick={loadFleetData} variant="outlined" startIcon={<Refresh />}>
          Actualiser
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Active Missions Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment sx={{ mr: 1 }} />
                Missions Actives ({activeMissions.length})
              </Typography>
              {activeMissions.length > 0 ? (
                activeMissions.map((mission) => (
                  <Box 
                    key={mission.id} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 2, 
                      mb: 1, 
                      border: 1, 
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%', 
                        backgroundColor: mission.status === 'in_progress' ? '#2196f3' : '#ff9800',
                        mr: 2 
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {mission.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🚗 {mission.vehicle?.license_plate || 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        👤 {mission.assigned_user?.first_name} {mission.assigned_user?.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📍 {mission.start_address} → {mission.end_address}
                      </Typography>
                      <Chip 
                        label={mission.status === 'in_progress' ? 'En cours' : 'En attente'}
                        size="small"
                        sx={{ 
                          backgroundColor: mission.status === 'in_progress' ? '#2196f3' : '#ff9800',
                          color: 'white',
                          mt: 0.5
                        }}
                      />
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  Aucune mission active en cours
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vehicles Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsCar sx={{ mr: 1 }} />
                Véhicules en Mission ({vehicles.length})
              </Typography>
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <Box 
                    key={vehicle.id} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 2, 
                      mb: 1, 
                      border: 1, 
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%', 
                        backgroundColor: getStatusColor(vehicle.status),
                        mr: 2 
                      }} 
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {vehicle.license_plate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.brand} {vehicle.model}
                      </Typography>
                      <Chip 
                        label={getStatusLabel(vehicle.status)}
                        size="small"
                        sx={{ 
                          backgroundColor: getStatusColor(vehicle.status),
                          color: 'white',
                          mb: 0.5
                        }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                        {vehicle.current_latitude ? `${vehicle.current_latitude.toFixed(4)}, ${vehicle.current_longitude?.toFixed(4)}` : 'Position non disponible'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Dernière mise à jour: {vehicle.last_location_update ? new Date(vehicle.last_location_update).toLocaleTimeString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  Aucun véhicule en mission
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Interactive Map */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Carte Interactive - Suivi des Véhicules
                </Typography>
                {isRealTimeEnabled && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: '#4caf50',
                        mr: 1,
                        animation: 'pulse 2s infinite'
                      }} 
                    />
                    <Typography variant="body2" color="success.main">
                      Suivi en temps réel actif
                    </Typography>
                  </Box>
                )}
              </Box>
              {vehicles.filter(vehicle => vehicle.current_latitude && vehicle.current_longitude).length > 0 ? (
                <LeafletMap 
                  vehicles={vehicles
                    .filter(vehicle => vehicle.current_latitude && vehicle.current_longitude)
                    .map(vehicle => ({
                      id: vehicle.id,
                      license_plate: vehicle.license_plate,
                      latitude: vehicle.current_latitude!,
                      longitude: vehicle.current_longitude!,
                      status: vehicle.status,
                      last_update: vehicle.last_location_update || new Date().toISOString(),
                      brand: vehicle.brand,
                      model: vehicle.model
                    }))}
                  center={[33.9716, -6.8498]}
                  zoom={13}
                  height={500}
                />
              ) : (
                <Box 
                  sx={{ 
                    height: 500, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: 'grey.100',
                    borderRadius: 2,
                    flexDirection: 'column'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    🗺️ Aucun véhicule à afficher
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {vehicles.length === 0 ? 
                      'Aucune mission active trouvée' : 
                      'Les véhicules n\'ont pas encore de position GPS'
                    }
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Statistics */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {activeMissions.filter(m => m.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Missions en cours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {activeMissions.filter(m => m.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Missions en attente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {vehicles.filter(v => v.status === 'in_use').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Véhicules actifs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="text.primary">
                {activeMissions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total missions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Map;
