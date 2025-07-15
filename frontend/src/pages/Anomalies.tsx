import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationIcon,
  LocalGasStation as FuelIcon,
  DirectionsCar as CarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { Anomaly, Vehicle, User } from '../types';
import { anomalyService } from '../services/anomalyService';
import AnomalyAlerts from '../components/AnomalyAlerts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`anomaly-tabpanel-${index}`}
      aria-labelledby={`anomaly-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Anomalies: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [filteredAnomalies, setFilteredAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [filterDialog, setFilterDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtres
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    resolved: '',
    vehicleId: '',
    userId: ''
  });

  // Nouveau anomalie
  const [newAnomaly, setNewAnomaly] = useState({
    type: 'other',
    description: '',
    severity: 'medium',
    vehicle_id: '',
    mission_id: '',
    user_id: '',
    fuel_consumed: '',
    expected_fuel: '',
    location_latitude: '',
    location_longitude: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    unresolved: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  useEffect(() => {
    loadAnomalies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [anomalies, filters]);

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const fetchedAnomalies = await anomalyService.getAnomalies();
      setAnomalies(fetchedAnomalies);
      calculateStats(fetchedAnomalies);
    } catch (error) {
      console.error('Erreur lors du chargement des anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (anomaliesList: Anomaly[]) => {
    const stats = {
      total: anomaliesList.length,
      unresolved: anomaliesList.filter(a => !a.is_resolved).length,
      critical: anomaliesList.filter(a => a.severity === 'critical').length,
      high: anomaliesList.filter(a => a.severity === 'high').length,
      medium: anomaliesList.filter(a => a.severity === 'medium').length,
      low: anomaliesList.filter(a => a.severity === 'low').length
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...anomalies];

    if (filters.type) {
      filtered = filtered.filter(a => a.type === filters.type);
    }
    if (filters.severity) {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }
    if (filters.resolved !== '') {
      const isResolved = filters.resolved === 'true';
      filtered = filtered.filter(a => a.is_resolved === isResolved);
    }
    if (filters.vehicleId) {
      filtered = filtered.filter(a => a.vehicle_id === parseInt(filters.vehicleId));
    }
    if (filters.userId) {
      filtered = filtered.filter(a => a.user_id === parseInt(filters.userId));
    }

    setFilteredAnomalies(filtered);
    setPage(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

const handleCreateAnomaly = async () => {
  try {
    // Préparation des données
    const anomalyData: any = {
      ...newAnomaly,
      vehicle_id: parseInt(newAnomaly.vehicle_id),
      is_resolved: false,
      type: newAnomaly.type as
        | "other"
        | "excessive_fuel"
        | "personal_use"
        | "route_deviation"
        | "unauthorized_stop"
        | "maintenance_due",
    };

    // Conversion facultative si présente
    if (newAnomaly.mission_id) {
      anomalyData.mission_id = parseInt(newAnomaly.mission_id);
    }
    if (newAnomaly.user_id) {
      anomalyData.user_id = parseInt(newAnomaly.user_id);
    }
    if (newAnomaly.fuel_consumed) {
      anomalyData.fuel_consumed = parseFloat(newAnomaly.fuel_consumed);
    }
    if (newAnomaly.expected_fuel) {
      anomalyData.expected_fuel = parseFloat(newAnomaly.expected_fuel);
    }
    if (newAnomaly.location_latitude) {
      anomalyData.location_latitude = parseFloat(newAnomaly.location_latitude);
    }
    if (newAnomaly.location_longitude) {
      anomalyData.location_longitude = parseFloat(newAnomaly.location_longitude);
    }

    // Envoi à l’API
    await anomalyService.createAnomaly(anomalyData);

    // Réinitialisation du formulaire
    setCreateDialog(false);
    setNewAnomaly({
      type: 'other',
      description: '',
      severity: 'medium',
      vehicle_id: '',
      mission_id: '',
      user_id: '',
      fuel_consumed: '',
      expected_fuel: '',
      location_latitude: '',
      location_longitude: '',
    });

    // Rechargement des anomalies
    loadAnomalies();

  } catch (error) {
    console.error("Erreur lors de la création de l'anomalie:", error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestion des Anomalies
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialog(true)}
          >
            Filtrer
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAnomalies}
          >
            Actualiser
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialog(true)}
          >
            Nouvelle Anomalie
          </Button>
        </Box>
      </Box>

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Non Résolues
              </Typography>
              <Typography variant="h4" color="error">{stats.unresolved}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critiques
              </Typography>
              <Typography variant="h4" color="error">{stats.critical}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Élevées
              </Typography>
              <Typography variant="h4" color="warning.main">{stats.high}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Moyennes
              </Typography>
              <Typography variant="h4" color="info.main">{stats.medium}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Faibles
              </Typography>
              <Typography variant="h4" color="success.main">{stats.low}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Onglets */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Vue Liste" />
            <Tab label="Vue Alertes" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Table des anomalies */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sévérité</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Véhicule</TableCell>
                  <TableCell>Utilisateur</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAnomalies
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((anomaly) => (
                    <TableRow key={anomaly.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getSeverityIcon(anomaly.severity)}
                          <Chip
                            label={anomaly.severity}
                            size="small"
                            color={getSeverityColor(anomaly.severity) as any}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{getTypeLabel(anomaly.type)}</TableCell>
                      <TableCell>{anomaly.description}</TableCell>
                      <TableCell>#{anomaly.vehicle_id}</TableCell>
                      <TableCell>{anomaly.user_id ? `#${anomaly.user_id}` : '-'}</TableCell>
                      <TableCell>{formatDate(anomaly.detected_at)}</TableCell>
                      <TableCell>
                        {anomaly.is_resolved ? (
                          <Chip label="Résolue" color="success" size="small" />
                        ) : (
                          <Chip label="En attente" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Voir sur la carte">
                          <IconButton size="small">
                            <LocationIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredAnomalies.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AnomalyAlerts showResolved={true} />
        </TabPanel>
      </Paper>

      {/* Dialog de création d'anomalie */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Créer une Nouvelle Anomalie</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newAnomaly.type}
                  label="Type"
                  onChange={(e) => setNewAnomaly({...newAnomaly, type: e.target.value})}
                >
                  <MenuItem value="excessive_fuel">Consommation Excessive</MenuItem>
                  <MenuItem value="personal_use">Usage Personnel</MenuItem>
                  <MenuItem value="route_deviation">Déviation de Route</MenuItem>
                  <MenuItem value="unauthorized_stop">Arrêt Non Autorisé</MenuItem>
                  <MenuItem value="maintenance_due">Maintenance Requise</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sévérité</InputLabel>
                <Select
                  value={newAnomaly.severity}
                  label="Sévérité"
                  onChange={(e) => setNewAnomaly({...newAnomaly, severity: e.target.value})}
                >
                  <MenuItem value="low">Faible</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="high">Élevée</MenuItem>
                  <MenuItem value="critical">Critique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newAnomaly.description}
                onChange={(e) => setNewAnomaly({...newAnomaly, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Véhicule"
                type="number"
                value={newAnomaly.vehicle_id}
                onChange={(e) => setNewAnomaly({...newAnomaly, vehicle_id: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Utilisateur (optionnel)"
                type="number"
                value={newAnomaly.user_id}
                onChange={(e) => setNewAnomaly({...newAnomaly, user_id: e.target.value})}
              />
            </Grid>
            {newAnomaly.type === 'excessive_fuel' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Carburant Consommé (L)"
                    type="number"
                    value={newAnomaly.fuel_consumed}
                    onChange={(e) => setNewAnomaly({...newAnomaly, fuel_consumed: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Carburant Attendu (L)"
                    type="number"
                    value={newAnomaly.expected_fuel}
                    onChange={(e) => setNewAnomaly({...newAnomaly, expected_fuel: e.target.value})}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Annuler</Button>
          <Button onClick={handleCreateAnomaly} variant="contained">Créer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de filtres */}
      <Dialog open={filterDialog} onClose={() => setFilterDialog(false)}>
        <DialogTitle>Filtres</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="excessive_fuel">Consommation Excessive</MenuItem>
                  <MenuItem value="personal_use">Usage Personnel</MenuItem>
                  <MenuItem value="route_deviation">Déviation de Route</MenuItem>
                  <MenuItem value="unauthorized_stop">Arrêt Non Autorisé</MenuItem>
                  <MenuItem value="maintenance_due">Maintenance Requise</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Sévérité</InputLabel>
                <Select
                  value={filters.severity}
                  label="Sévérité"
                  onChange={(e) => setFilters({...filters, severity: e.target.value})}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value="low">Faible</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="high">Élevée</MenuItem>
                  <MenuItem value="critical">Critique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={filters.resolved}
                  label="Statut"
                  onChange={(e) => setFilters({...filters, resolved: e.target.value})}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="false">Non Résolues</MenuItem>
                  <MenuItem value="true">Résolues</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFilters({ type: '', severity: '', resolved: '', vehicleId: '', userId: '' })}>
            Réinitialiser
          </Button>
          <Button onClick={() => setFilterDialog(false)} variant="contained">
            Appliquer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Anomalies;
