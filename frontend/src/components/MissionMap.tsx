import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
  Map as MapIcon
} from '@mui/icons-material';
import { missionService } from '../services/missionService';
import LeafletMissionMap from './LeafletMissionMap';
import { useMapData } from '../contexts/MapContext';

interface MissionMapProps {
  missionId: number;
  open: boolean;
  onClose: () => void;
}

interface MissionMapData {
  mission: {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    start_location: {
      latitude: number;
      longitude: number;
      address: string;
    };
    end_location: {
      latitude: number;
      longitude: number;
      address: string;
    };
    assigned_user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
    vehicle: {
      id: number;
      license_plate: string;
      brand: string;
      model: string;
      status: string;
    };
  };
  current_location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
  };
  route: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
    heading: number;
  }>;
  other_collaborators: Array<{
    mission_id: number;
    mission_title: string;
    collaborator: {
      id: number;
      name: string;
      role: string;
    };
    vehicle: {
      id: number;
      license_plate: string;
    };
    location: {
      latitude: number;
      longitude: number;
      timestamp: string;
      speed: number;
    };
  }>;
  center: {
    latitude: number;
    longitude: number;
  };
  zoom: number;
}

const MissionMap: React.FC<MissionMapProps> = ({ missionId, open, onClose }) => {
  const [mapData, setMapData] = useState<MissionMapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getMissionMap, vehicles, missions, subscribeToUpdates, refreshData } = useMapData();

  useEffect(() => {
    if (open && missionId) {
      loadMissionMap();
    }
  }, [open, missionId]);

  // S'abonner aux mises à jour du contexte
  useEffect(() => {
    if (!open) return;
    
    const unsubscribe = subscribeToUpdates((contextData) => {
      // Recharger les données de la mission quand le contexte est mis à jour
      if (missionId) {
        loadMissionMap();
      }
    });
    
    return unsubscribe;
  }, [open, missionId, subscribeToUpdates]);

  const loadMissionMap = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMissionMap(missionId);
      setMapData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de la carte');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const generateMapData = () => {
    if (!mapData) return null;
    
    const vehicles = [];
    
    // Ajouter le véhicule de la mission principale
    if (mapData.current_location && mapData.mission.vehicle) {
      vehicles.push({
        id: mapData.mission.vehicle.id,
        license_plate: mapData.mission.vehicle.license_plate,
        latitude: mapData.current_location.latitude,
        longitude: mapData.current_location.longitude,
        status: 'in_use',
        last_update: mapData.current_location.timestamp,
        mission: mapData.mission,
        is_main_mission: true
      });
    }
    
    // Ajouter les autres collaborateurs
    mapData.other_collaborators.forEach(collab => {
      vehicles.push({
        id: collab.vehicle.id,
        license_plate: collab.vehicle.license_plate,
        latitude: collab.location.latitude,
        longitude: collab.location.longitude,
        status: 'in_use',
        last_update: collab.location.timestamp,
        collaborator: collab.collaborator,
        mission_title: collab.mission_title,
        is_main_mission: false
      });
    });
    
    return {
      vehicles,
      center: mapData.center,
      mission_route: {
        start: mapData.mission.start_location,
        end: mapData.mission.end_location,
        actual_path: mapData.route
      }
    };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <MapIcon />
          Carte de Mission
          {mapData && (
            <Chip
              label={mapData.mission.status}
              color={getStatusColor(mapData.mission.status) as any}
              size="small"
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {mapData && (
          <Grid container spacing={3}>
            {/* Mission Details */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {mapData.mission.title}
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      label={mapData.mission.status}
                      color={getStatusColor(mapData.mission.status) as any}
                      size="small"
                    />
                    <Chip
                      label={mapData.mission.priority}
                      color={getPriorityColor(mapData.mission.priority) as any}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {mapData.mission.description}
                  </Typography>
                  
                  {/* Assigned User */}
                  {mapData.mission.assigned_user && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {mapData.mission.assigned_user.name} ({mapData.mission.assigned_user.role})
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Vehicle */}
                  {mapData.mission.vehicle && (
                    <Box display="flex" alignItems="center" mb={1}>
                      <CarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {mapData.mission.vehicle.license_plate} - {mapData.mission.vehicle.brand} {mapData.mission.vehicle.model}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Locations */}
                  <Box display="flex" alignItems="center">
                    <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {mapData.mission.start_location.address} → {mapData.mission.end_location.address}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Current Position & Route */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Position Actuelle
                  </Typography>
                  
                  {mapData.current_location ? (
                    <>
                      <Box display="flex" alignItems="center" mb={1}>
                        <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {mapData.current_location.latitude.toFixed(6)}, {mapData.current_location.longitude.toFixed(6)}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" mb={1}>
                        <SpeedIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {mapData.current_location.speed.toFixed(1)} km/h
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center">
                        <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatTimestamp(mapData.current_location.timestamp)}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune position actuelle disponible
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Parcours récent: {mapData.route.length} points
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Interactive Map */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Carte Interactive - Localisation des Collaborateurs
                  </Typography>
                  
                  {mapData && (
                    <Box sx={{ height: '500px', width: '100%', border: '1px solid #ddd', borderRadius: 1 }}>
                      <LeafletMissionMap
                        center={mapData.center}
                        zoom={mapData.zoom}
                        height="500px"
                        missionData={mapData}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Other Collaborators */}
            {mapData.other_collaborators.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Autres Collaborateurs en Mission ({mapData.other_collaborators.length})
                    </Typography>
                    
                    <List dense>
                      {mapData.other_collaborators.map((collab, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <PersonIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={collab.collaborator.name}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  Mission: {collab.mission_title}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Véhicule: {collab.vehicle.license_plate}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Position: {collab.location.latitude.toFixed(4)}, {collab.location.longitude.toFixed(4)}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Vitesse: {collab.location.speed.toFixed(1)} km/h
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Fermer
        </Button>
        <Button onClick={refreshData} variant="outlined" disabled={loading}>
          {loading ? 'Actualisation...' : 'Actualiser Tout'}
        </Button>
        {mapData && (
          <Button onClick={loadMissionMap} variant="outlined">
            Actualiser Mission
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MissionMap;
