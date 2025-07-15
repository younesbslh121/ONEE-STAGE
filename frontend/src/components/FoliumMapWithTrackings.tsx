import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { Vehicle, Mission, Location, Anomaly } from '../types';
import { vehicleService } from '../services/vehicleService';
import { missionService } from '../services/missionService';
import { anomalyService } from '../services/anomalyService';

// Fonction pour obtenir le label du type d'anomalie
const getAnomalyTypeLabel = (type: string): string => {
  switch (type) {
    case 'fuel_consumption':
      return 'Consommation de carburant';
    case 'speed_violation':
      return 'Excès de vitesse';
    case 'route_deviation':
      return 'Déviation de route';
    case 'maintenance_required':
      return 'Maintenance requise';
    case 'breakdown':
      return 'Panne';
    case 'unauthorized_use':
      return 'Utilisation non autorisée';
    default:
      return type;
  }
};

interface FoliumMapWithTrackingsProps {
  height?: string;
  showAnomalies?: boolean;
  selectedVehicleId?: number;
  selectedMissionId?: number;
}

const FoliumMapWithTrackings: React.FC<FoliumMapWithTrackingsProps> = ({
  height = '600px',
  showAnomalies = true,
  selectedVehicleId,
  selectedMissionId
}) => {
  const mapRef = useRef<HTMLIFrameElement>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapHtml, setMapHtml] = useState<string>('');
  
  // Filtres et options d'affichage
  const [filters, setFilters] = useState({
    vehicleId: selectedVehicleId || '',
    missionId: selectedMissionId || '',
    timeRange: '24h' // 1h, 6h, 24h, 7d, 30d
  });
  
  const [displayOptions, setDisplayOptions] = useState({
    showVehicles: true,
    showRoutes: true,
    showAnomalies: showAnomalies,
    showRealTime: true,
    showMissions: true
  });

  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    activeMissions: 0,
    criticalAnomalies: 0
  });

  useEffect(() => {
    loadMapData();
  }, [filters]);

  useEffect(() => {
    if (vehicles.length > 0 || missions.length > 0 || anomalies.length > 0) {
      generateFoliumMap();
    }
  }, [vehicles, missions, anomalies, locations, displayOptions]);

  const loadMapData = async () => {
    setLoading(true);
    try {
      // Charger les véhicules
      const vehiclesData = await vehicleService.getVehicles();
      setVehicles(vehiclesData);

      // Charger les missions
      const missionsData = await missionService.getMissions();
      setMissions(missionsData);

      // Charger les anomalies
      if (displayOptions.showAnomalies) {
        const anomaliesData = await anomalyService.getUnresolvedAnomalies();
        setAnomalies(anomaliesData);
      }

      // Charger les localisations récentes
      await loadLocations();

      // Calculer les statistiques
      calculateStats(vehiclesData, missionsData, anomalies);
    } catch (error) {
      console.error('Erreur lors du chargement des données de la carte:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      // Simuler un appel API pour récupérer les localisations
      // En réalité, vous devriez avoir un service pour ça
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/locations/?time_range=${filters.timeRange}&vehicle_id=${filters.vehicleId}&mission_id=${filters.missionId}`);
      if (response.ok) {
        const locationsData = await response.json();
        setLocations(locationsData.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des localisations:', error);
      // Données de démonstration
      setLocations([]);
    }
  };

  const calculateStats = (vehiclesData: Vehicle[], missionsData: Mission[], anomaliesData: Anomaly[]) => {
    setStats({
      totalVehicles: vehiclesData.length,
      activeVehicles: vehiclesData.filter(v => v.status === 'in_use').length,
      activeMissions: missionsData.filter(m => m.status === 'in_progress').length,
      criticalAnomalies: anomaliesData.filter(a => a.severity === 'critical' && !a.is_resolved).length
    });
  };

  const generateFoliumMap = () => {
    // Générer le HTML de la carte Folium
    let mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Carte de Suivi Flotte ONEEP</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100%; }
        .anomaly-marker { 
            background-color: #ff4444; 
            border: 2px solid #fff; 
            border-radius: 50%; 
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }
        .vehicle-active { background-color: #4CAF50; }
        .vehicle-maintenance { background-color: #FF9800; }
        .vehicle-available { background-color: #2196F3; }
        .mission-route { color: #9C27B0; weight: 3; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Initialiser la carte centrée sur le Maroc
        var map = L.map('map').setView([33.9716, -6.8498], 6);
        
        // Ajouter la couche de tuiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Créer des groupes de couches
        var vehicleLayer = L.layerGroup().addTo(map);
        var missionLayer = L.layerGroup().addTo(map);
        var anomalyLayer = L.layerGroup().addTo(map);
        var routeLayer = L.layerGroup().addTo(map);

        // Fonction pour obtenir l'icône selon le statut du véhicule
        function getVehicleIcon(status) {
            var color = '#2196F3'; // available par défaut
            if (status === 'in_use') color = '#4CAF50';
            else if (status === 'maintenance') color = '#FF9800';
            else if (status === 'out_of_service') color = '#f44336';
            
            return L.divIcon({
                html: '<div style="background-color:' + color + '; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [20, 20],
                className: 'vehicle-marker'
            });
        }

        // Fonction pour obtenir l'icône d'anomalie
        function getAnomalyIcon(severity) {
            var color = '#ff4444';
            if (severity === 'critical') color = '#d32f2f';
            else if (severity === 'high') color = '#f57c00';
            else if (severity === 'medium') color = '#fbc02d';
            else if (severity === 'low') color = '#689f38';
            
            return L.divIcon({
                html: '<div class="anomaly-marker" style="background-color:' + color + '; width: 15px; height: 15px;"></div>',
                iconSize: [15, 15],
                className: 'anomaly-icon'
            });
        }
    `;

    // Ajouter les véhicules si l'option est activée
    if (displayOptions.showVehicles) {
      vehicles.forEach(vehicle => {
        if (vehicle.current_latitude && vehicle.current_longitude) {
          mapHtml += `
        // Véhicule ${vehicle.license_plate}
        var vehicleMarker${vehicle.id} = L.marker([${vehicle.current_latitude}, ${vehicle.current_longitude}], {
            icon: getVehicleIcon('${vehicle.status}')
        }).addTo(vehicleLayer);
        
        vehicleMarker${vehicle.id}.bindPopup(\`
            <div>
                <h4>🚗 ${vehicle.license_plate}</h4>
                <p><strong>Marque:</strong> ${vehicle.brand} ${vehicle.model}</p>
                <p><strong>Statut:</strong> <span style="color: ${vehicle.status === 'in_use' ? 'green' : vehicle.status === 'maintenance' ? 'orange' : 'blue'}">${vehicle.status}</span></p>
                ${vehicle.driver ? `<p><strong>Conducteur:</strong> ${vehicle.driver.first_name} ${vehicle.driver.last_name}</p>` : ''}
                <p><strong>Dernière mise à jour:</strong> ${vehicle.last_location_update ? new Date(vehicle.last_location_update).toLocaleString('fr-FR') : 'N/A'}</p>
            </div>
        \`);
          `;
        }
      });
    }

    // Ajouter les missions si l'option est activée
    if (displayOptions.showMissions) {
      missions.forEach(mission => {
        if (mission.start_latitude && mission.start_longitude && mission.end_latitude && mission.end_longitude) {
          mapHtml += `
        // Mission ${mission.title}
        var missionStart${mission.id} = L.marker([${mission.start_latitude}, ${mission.start_longitude}], {
            icon: L.divIcon({
                html: '<div style="background-color: #9C27B0; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">START</div>',
                className: 'mission-start'
            })
        }).addTo(missionLayer);
        
        var missionEnd${mission.id} = L.marker([${mission.end_latitude}, ${mission.end_longitude}], {
            icon: L.divIcon({
                html: '<div style="background-color: #E91E63; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">END</div>',
                className: 'mission-end'
            })
        }).addTo(missionLayer);
        
        missionStart${mission.id}.bindPopup(\`
            <div>
                <h4>🎯 ${mission.title}</h4>
                <p><strong>Description:</strong> ${mission.description || 'N/A'}</p>
                <p><strong>Statut:</strong> <span style="color: ${mission.status === 'in_progress' ? 'green' : mission.status === 'completed' ? 'blue' : 'orange'}">${mission.status}</span></p>
                <p><strong>Priorité:</strong> ${mission.priority}</p>
                <p><strong>Départ prévu:</strong> ${new Date(mission.scheduled_start).toLocaleString('fr-FR')}</p>
                <p><strong>Adresse de départ:</strong> ${mission.start_address || 'N/A'}</p>
            </div>
        \`);
        
        missionEnd${mission.id}.bindPopup(\`
            <div>
                <h4>🏁 Destination - ${mission.title}</h4>
                <p><strong>Arrivée prévue:</strong> ${new Date(mission.scheduled_end).toLocaleString('fr-FR')}</p>
                <p><strong>Adresse de destination:</strong> ${mission.end_address || 'N/A'}</p>
            </div>
        \`);
          `;

          // Ajouter une ligne entre le départ et la destination si l'option routes est activée
          if (displayOptions.showRoutes) {
            mapHtml += `
        var missionRoute${mission.id} = L.polyline([
            [${mission.start_latitude}, ${mission.start_longitude}],
            [${mission.end_latitude}, ${mission.end_longitude}]
        ], {
            color: '#9C27B0',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10'
        }).addTo(routeLayer);
            `;
          }
        }
      });
    }

    // Ajouter les anomalies si l'option est activée
    if (displayOptions.showAnomalies) {
      anomalies.forEach(anomaly => {
        if (anomaly.location_latitude && anomaly.location_longitude) {
          mapHtml += `
        // Anomalie ${anomaly.id}
        var anomalyMarker${anomaly.id} = L.marker([${anomaly.location_latitude}, ${anomaly.location_longitude}], {
            icon: getAnomalyIcon('${anomaly.severity}')
        }).addTo(anomalyLayer);
        
        anomalyMarker${anomaly.id}.bindPopup(\`
            <div style="min-width: 200px;">
                <h4 style="color: #d32f2f;">⚠️ Anomalie ${anomaly.severity.toUpperCase()}</h4>
                <p><strong>Type:</strong> ${getAnomalyTypeLabel('${anomaly.type}')}</p>
                <p><strong>Description:</strong> ${anomaly.description}</p>
                <p><strong>Véhicule:</strong> #${anomaly.vehicle_id}</p>
                ${anomaly.user_id ? `<p><strong>Utilisateur:</strong> #${anomaly.user_id}</p>` : ''}
                <p><strong>Détectée le:</strong> ${new Date(anomaly.detected_at).toLocaleString('fr-FR')}</p>
                ${anomaly.fuel_consumed && anomaly.expected_fuel ? 
                  `<p><strong>Carburant:</strong> ${anomaly.fuel_consumed}L (attendu: ${anomaly.expected_fuel}L)</p>` : ''
                }
            </div>
        \`);
          `;
        }
      });
    }

    // Ajouter la fonction pour les labels des types d'anomalies
    mapHtml += `
        function getAnomalyTypeLabel(type) {
            switch(type) {
                case 'excessive_fuel': return 'Consommation Excessive';
                case 'personal_use': return 'Usage Personnel';
                case 'route_deviation': return 'Déviation de Route';
                case 'unauthorized_stop': return 'Arrêt Non Autorisé';
                case 'maintenance_due': return 'Maintenance Requise';
                default: return 'Autre';
            }
        }

        // Contrôles de couches
        var overlayMaps = {
            "Véhicules": vehicleLayer,
            "Missions": missionLayer,
            "Anomalies": anomalyLayer,
            "Routes": routeLayer
        };
        
        L.control.layers(null, overlayMaps).addTo(map);

        // Ajuster la vue pour afficher tous les marqueurs
        var group = new L.featureGroup([vehicleLayer, missionLayer, anomalyLayer]);
        if (group.getLayers().length > 0) {
            map.fitBounds(group.getBounds().pad(0.1));
        }
    </script>
</body>
</html>`;

    setMapHtml(mapHtml);
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDisplayOptionChange = (field: string, value: boolean) => {
    setDisplayOptions(prev => ({ ...prev, [field]: value }));
  };

  const getTimeRangeLabel = (range: string) => {
    switch(range) {
      case '1h': return 'Dernière heure';
      case '6h': return '6 dernières heures';
      case '24h': return '24 dernières heures';
      case '7d': return '7 derniers jours';
      case '30d': return '30 derniers jours';
      default: return range;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {/* Panneau de contrôle */}
      <Grid item xs={12} md={3}>
        <Paper sx={{ p: 2, height: 'fit-content' }}>
          <Typography variant="h6" gutterBottom>
            Contrôles de la Carte
          </Typography>
          
          {/* Statistiques rapides */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Statistiques</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip label={`${stats.totalVehicles} Véhicules`} size="small" />
              <Chip label={`${stats.activeVehicles} Actifs`} color="success" size="small" />
              <Chip label={`${stats.activeMissions} Missions`} color="primary" size="small" />
              {stats.criticalAnomalies > 0 && (
                <Chip label={`${stats.criticalAnomalies} Anomalies Critiques`} color="error" size="small" />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Filtres */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Filtres</Typography>
            
            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel size="small">Période</InputLabel>
              <Select
                size="small"
                value={filters.timeRange}
                label="Période"
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              >
                <MenuItem value="1h">Dernière heure</MenuItem>
                <MenuItem value="6h">6 dernières heures</MenuItem>
                <MenuItem value="24h">24 dernières heures</MenuItem>
                <MenuItem value="7d">7 derniers jours</MenuItem>
                <MenuItem value="30d">30 derniers jours</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 1 }}>
              <InputLabel size="small">Véhicule</InputLabel>
              <Select
                size="small"
                value={filters.vehicleId}
                label="Véhicule"
                onChange={(e) => handleFilterChange('vehicleId', e.target.value)}
              >
                <MenuItem value="">Tous les véhicules</MenuItem>
                {vehicles.map(vehicle => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.license_plate} - {vehicle.brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Options d'affichage */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Affichage</Typography>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={displayOptions.showVehicles}
                      onChange={(e) => handleDisplayOptionChange('showVehicles', e.target.checked)}
                    />
                  }
                  label="Véhicules"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={displayOptions.showMissions}
                      onChange={(e) => handleDisplayOptionChange('showMissions', e.target.checked)}
                    />
                  }
                  label="Missions"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={displayOptions.showRoutes}
                      onChange={(e) => handleDisplayOptionChange('showRoutes', e.target.checked)}
                    />
                  }
                  label="Routes"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={displayOptions.showAnomalies}
                      onChange={(e) => handleDisplayOptionChange('showAnomalies', e.target.checked)}
                    />
                  }
                  label="Anomalies"
                />
              </ListItem>
            </List>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadMapData}
            size="small"
          >
            Actualiser
          </Button>
        </Paper>
      </Grid>

      {/* Carte */}
      <Grid item xs={12} md={9}>
        <Paper sx={{ height: height, overflow: 'hidden' }}>
          {mapHtml ? (
            <iframe
              ref={mapRef}
              srcDoc={mapHtml}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="Carte de suivi des véhicules"
            />
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <Typography>Chargement de la carte...</Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default FoliumMapWithTrackings;
