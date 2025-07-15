import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  Box,
  Alert,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as MissionIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import MissionTracker from '../components/MissionTracker';
import MissionMap from '../components/MissionMap';
import { useNavigate } from 'react-router-dom';

interface Mission {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignedVehicle: string;
  assignedDriver: string;
  startLocation: string;
  endLocation: string;
  scheduledStart: string;
  estimatedDuration: number; // in hours
  createdAt: string;
}

const Missions: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [expandedMissions, setExpandedMissions] = useState<Set<number>>(new Set());
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedMissionForMap, setSelectedMissionForMap] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedVehicle: '',
    assignedDriver: '',
    startLocation: '',
    endLocation: '',
    scheduledStart: '',
    estimatedDuration: 1
  });

// Fetch real missions from API
  const fetchMissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/missions/noauth`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        // Transformer les données pour correspondre à l'interface
        const transformedMissions = data.missions?.map((mission: any) => ({
          id: mission.id,
          title: mission.title,
          description: mission.description,
          status: mission.status,
          priority: mission.priority,
          assignedVehicle: mission.vehicle?.license_plate || `VH-${mission.vehicle_id}`,
          assignedDriver: mission.assigned_user ? 
            `${mission.assigned_user.first_name} ${mission.assigned_user.last_name}` : 
            `User-${mission.assigned_user_id}`,
          startLocation: mission.start_address || `${mission.start_latitude}, ${mission.start_longitude}`,
          endLocation: mission.end_address || `${mission.end_latitude}, ${mission.end_longitude}`,
          scheduledStart: mission.scheduled_start,
          estimatedDuration: 2, // Défaut
          createdAt: mission.created_at
        })) || [];
        
        setMissions(transformedMissions);
        setError(null);
      }
    } catch (err) {
      setError('Erreur lors du chargement des missions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const getStatusColor = (status: Mission['status']) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: Mission['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  const getPriorityColor = (priority: Mission['priority']) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority: Mission['priority']) => {
    switch (priority) {
      case 'low': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'high': return 'Élevée';
      default: return priority;
    }
  };

  const toggleMissionExpanded = (missionId: number) => {
    const newExpanded = new Set(expandedMissions);
    if (newExpanded.has(missionId)) {
      newExpanded.delete(missionId);
    } else {
      newExpanded.add(missionId);
    }
    setExpandedMissions(newExpanded);
  };

  const handleAddMission = () => {
    setEditingMission(null);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assignedVehicle: '',
      assignedDriver: '',
      startLocation: '',
      endLocation: '',
      scheduledStart: '',
      estimatedDuration: 1
    });
    setOpenDialog(true);
  };

  const handleEditMission = (mission: Mission) => {
    setEditingMission(mission);
    setFormData({
      title: mission.title,
      description: mission.description,
      priority: mission.priority,
      assignedVehicle: mission.assignedVehicle,
      assignedDriver: mission.assignedDriver,
      startLocation: mission.startLocation,
      endLocation: mission.endLocation,
      scheduledStart: mission.scheduledStart,
      estimatedDuration: mission.estimatedDuration
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingMission(null);
  };

  const handleSubmit = () => {
// Appel API pour créer/mettre à jour une mission
    const apiUrl = editingMission 
      ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/missions/${editingMission.id}` 
      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/missions/noauth`;
    const method = editingMission ? 'PUT' : 'POST';
    
    // Préparer les données pour l'API
    const missionData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      start_latitude: 48.8566, // Paris par défaut
      start_longitude: 2.3522,
      start_address: formData.startLocation,
      end_latitude: 48.8566,
      end_longitude: 2.3522,
      end_address: formData.endLocation,
      scheduled_start: formData.scheduledStart,
      scheduled_end: formData.scheduledStart, // Utiliser la même date pour simplifier
      vehicle_id: 1, // ID par défaut
      assigned_user_id: 1 // ID par défaut
    };
    
    fetch(apiUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missionData)
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          // Rafraîchir la liste des missions
          fetchMissions();
          handleCloseDialog();
        }
      })
      .catch(error => setError('Erreur lors de la soumission de la mission.'));
  };

  const handleStartMission = (missionId: number) => {
    // TODO: Implement API call to start mission
    console.log('Starting mission:', missionId);
  };

  const handleCompleteMission = (missionId: number) => {
    // TODO: Implement API call to complete mission
    console.log('Completing mission:', missionId);
  };

  const handleCancelMission = (missionId: number) => {
    // TODO: Implement API call to cancel mission
    console.log('Cancelling mission:', missionId);
  };

  const handleDeleteMission = (missionId: number) => {
// Appel API pour supprimer une mission
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/missions/noauth/${missionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          // Rafraîchir la liste des missions
          fetchMissions();
        }
      })
      .catch(error => setError('Erreur lors de la suppression de la mission.'));
  };

  const handleViewOnMap = (missionId: number) => {
    setSelectedMissionForMap(missionId);
    setMapDialogOpen(true);
  };

  const handleCloseMap = () => {
    setMapDialogOpen(false);
    setSelectedMissionForMap(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        <MissionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Gestion des Missions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {missions.map((mission) => (
          <Grid item xs={12} md={6} lg={4} key={mission.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                    {mission.title}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEditMission(mission)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteMission(mission.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box display="flex" gap={1} mb={2}>
                  <Chip
                    label={getStatusLabel(mission.status)}
                    color={getStatusColor(mission.status)}
                    size="small"
                  />
                  <Chip
                    label={getPriorityLabel(mission.priority)}
                    color={getPriorityColor(mission.priority)}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {mission.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <PersonIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">{mission.assignedDriver}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {mission.startLocation} → {mission.endLocation}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {mission.scheduledStart ? new Date(mission.scheduledStart).toLocaleString('fr-FR') : 'Non défini'} 
                      ({mission.estimatedDuration}h)
                    </Typography>
                  </Box>
                </Box>

                {/* Action buttons */}
                <Box display="flex" gap={1} mb={2}>
                  {mission.status === 'pending' && (
                    <Button
                      size="small"
                      startIcon={<StartIcon />}
                      onClick={() => handleStartMission(mission.id)}
                      color="primary"
                    >
                      Démarrer
                    </Button>
                  )}
                  {mission.status === 'in_progress' && (
                    <Button
                      size="small"
                      startIcon={<CompleteIcon />}
                      onClick={() => handleCompleteMission(mission.id)}
                      color="success"
                    >
                      Terminer
                    </Button>
                  )}
                  {(mission.status === 'pending' || mission.status === 'in_progress') && (
                    <Button
                      size="small"
                      startIcon={<CancelIcon />}
                      onClick={() => handleCancelMission(mission.id)}
                      color="error"
                      variant="outlined"
                    >
                      Annuler
                    </Button>
                  )}
                </Box>

                {/* Map view button */}
                <Box display="flex" gap={1} mb={2}>
                  <Button
                    size="small"
                    startIcon={<LocationIcon />}
                    onClick={() => handleViewOnMap(mission.id)}
                    color="info"
                    variant="outlined"
                    fullWidth
                  >
                    Voir sur la carte
                  </Button>
                </Box>

                {/* Expandable section for mission tracker */}
                {mission.status === 'in_progress' && (
                  <>
                    <Divider sx={{ mb: 1 }} />
                    <Button
                      fullWidth
                      onClick={() => toggleMissionExpanded(mission.id)}
                      endIcon={expandedMissions.has(mission.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      variant="text"
                      size="small"
                    >
                      Suivi de Mission
                    </Button>
                    <Collapse in={expandedMissions.has(mission.id)}>
                      <Box sx={{ mt: 2 }}>
                        <MissionTracker 
                          missionId={mission.id} 
                          collaboratorId={1} // ID par défaut - à remplacer par l'ID de l'utilisateur connecté
                        />
                      </Box>
                    </Collapse>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add Mission FAB */}
      <Fab
        color="primary"
        aria-label="add mission"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddMission}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Mission Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMission ? 'Modifier la Mission' : 'Nouvelle Mission'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priorité</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priorité"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                >
                  <MenuItem value="low">Faible</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="high">Élevée</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Durée estimée (heures)"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: Number(e.target.value) })}
                inputProps={{ min: 0.5, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Véhicule assigné"
                value={formData.assignedVehicle}
                onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Conducteur assigné"
                value={formData.assignedDriver}
                onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lieu de départ"
                value={formData.startLocation}
                onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Destination"
                value={formData.endLocation}
                onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Heure de départ prévue"
                type="datetime-local"
                value={formData.scheduledStart}
                onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingMission ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mission Map Dialog */}
      {selectedMissionForMap && (
        <MissionMap
          missionId={selectedMissionForMap}
          open={mapDialogOpen}
          onClose={handleCloseMap}
        />
      )}
    </Box>
  );
};

export default Missions;
