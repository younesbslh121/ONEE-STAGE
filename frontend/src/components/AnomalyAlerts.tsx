import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  AlertTitle,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  LocalGasStation as FuelIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Anomaly } from '../types';
import { anomalyService } from '../services/anomalyService';

interface AnomalyAlertsProps {
  vehicleId?: number;
  userId?: number;
  showResolved?: boolean;
  onAnomalyClick?: (anomaly: Anomaly) => void;
}

const AnomalyAlerts: React.FC<AnomalyAlertsProps> = ({ 
  vehicleId, 
  userId, 
  showResolved = false, 
  onAnomalyClick 
}) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveDialog, setResolveDialog] = useState<{open: boolean, anomaly: Anomaly | null}>({
    open: false,
    anomaly: null
  });
  const [resolveNotes, setResolveNotes] = useState('');

  useEffect(() => {
    loadAnomalies();
  }, [vehicleId, userId, showResolved]);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      let fetchedAnomalies: Anomaly[];
      
      if (vehicleId) {
        fetchedAnomalies = await anomalyService.getAnomaliesByVehicle(vehicleId);
      } else if (userId) {
        fetchedAnomalies = await anomalyService.getAnomaliesByUser(userId);
      } else {
        fetchedAnomalies = showResolved 
          ? await anomalyService.getAnomalies()
          : await anomalyService.getUnresolvedAnomalies();
      }
      
      setAnomalies(fetchedAnomalies);
    } catch (error) {
      console.error('Erreur lors du chargement des anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon color="error" />;
      case 'high': return <WarningIcon color="warning" />;
      case 'medium': return <InfoIcon color="info" />;
      case 'low': return <CheckCircleIcon color="success" />;
      default: return <InfoIcon />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'excessive_fuel': return <FuelIcon />;
      case 'personal_use': return <PersonIcon />;
      case 'route_deviation': return <LocationIcon />;
      case 'unauthorized_stop': return <LocationIcon />;
      case 'maintenance_due': return <CarIcon />;
      default: return <WarningIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'excessive_fuel': return 'Consommation Excessive';
      case 'personal_use': return 'Usage Personnel';
      case 'route_deviation': return 'Déviation de Route';
      case 'unauthorized_stop': return 'Arrêt Non Autorisé';
      case 'maintenance_due': return 'Maintenance Requise';
      default: return 'Autre';
    }
  };

  const handleResolveClick = (anomaly: Anomaly) => {
    setResolveDialog({ open: true, anomaly });
    setResolveNotes('');
  };

  const handleResolveConfirm = async () => {
    if (!resolveDialog.anomaly) return;

    try {
      await anomalyService.resolveAnomaly(resolveDialog.anomaly.id, resolveNotes);
      setResolveDialog({ open: false, anomaly: null });
      setResolveNotes('');
      loadAnomalies(); // Recharger les anomalies
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'anomalie:', error);
    }
  };

  const handleResolveCancel = () => {
    setResolveDialog({ open: false, anomaly: null });
    setResolveNotes('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (anomalies.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography color="textSecondary" align="center">
            {showResolved ? 'Aucune anomalie trouvée' : 'Aucune anomalie en attente'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Anomalies Détectées ({anomalies.length})
      </Typography>
      
      <List>
        {anomalies.map((anomaly, index) => (
          <React.Fragment key={anomaly.id}>
            <ListItem alignItems="flex-start">
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                {getSeverityIcon(anomaly.severity)}
                {getTypeIcon(anomaly.type)}
              </Box>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" component="span">
                      {getTypeLabel(anomaly.type)}
                    </Typography>
                    <Chip
                      label={anomaly.severity}
                      size="small"
                      color={getSeverityColor(anomaly.severity) as any}
                    />
                    {anomaly.is_resolved && (
                      <Chip
                        label="Résolue"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.primary">
                      {anomaly.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Détectée le: {formatDate(anomaly.detected_at)}
                    </Typography>
                    {anomaly.fuel_consumed && anomaly.expected_fuel && (
                      <Typography variant="caption" display="block" color="error">
                        Carburant: {anomaly.fuel_consumed}L (attendu: {anomaly.expected_fuel}L)
                      </Typography>
                    )}
                  </Box>
                }
              />
              
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {onAnomalyClick && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LocationIcon />}
                      onClick={() => onAnomalyClick(anomaly)}
                    >
                      Localiser
                    </Button>
                  )}
                  {!anomaly.is_resolved && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleResolveClick(anomaly)}
                    >
                      Résoudre
                    </Button>
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
            {index < anomalies.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>

      {/* Dialog de résolution d'anomalie */}
      <Dialog open={resolveDialog.open} onClose={handleResolveCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          Résoudre l'Anomalie
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous êtes sur le point de marquer cette anomalie comme résolue. 
            Voulez-vous ajouter des notes explicatives ?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Notes (optionnel)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            placeholder="Décrivez la solution appliquée..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResolveCancel} color="primary">
            Annuler
          </Button>
          <Button onClick={handleResolveConfirm} color="success" variant="contained">
            Résoudre
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnomalyAlerts;
