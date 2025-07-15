import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Fab,
  Avatar,
  Divider,
  Stack,
} from '@mui/material';
import {
  DirectionsCar,
  Add,
  Edit,
  Delete,
  LocalGasStation,
  ElectricCar,
  Build,
  CheckCircle,
  Cancel,
  Warning,
} from '@mui/icons-material';
import { vehicleAPI } from '../services/api';
import { Vehicle } from '../types';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    model: '',
    year: '',
    color: '',
    fuel_type: 'gasoline',
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleAPI.getAll();
      setVehicles(response.vehicles);
    } catch (err: any) {
      setError('Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await vehicleAPI.update(editingVehicle.id, formData);
      } else {
        await vehicleAPI.create(formData);
      }
      
      setShowForm(false);
      setEditingVehicle(null);
      setFormData({
        license_plate: '',
        brand: '',
        model: '',
        year: '',
        color: '',
        fuel_type: 'gasoline',
      });
      loadVehicles();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      license_plate: vehicle.license_plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year?.toString() || '',
      color: vehicle.color || '',
      fuel_type: vehicle.fuel_type || 'gasoline',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      try {
        await vehicleAPI.delete(id);
        loadVehicles();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'in_use':
        return 'primary';
      case 'maintenance':
        return 'warning';
      case 'out_of_service':
        return 'error';
      default:
        return 'default';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle />;
      case 'in_use':
        return <DirectionsCar />;
      case 'maintenance':
        return <Build />;
      case 'out_of_service':
        return <Cancel />;
      default:
        return <Warning />;
    }
  };

  const getFuelTypeLabel = (fuelType: string) => {
    switch (fuelType) {
      case 'gasoline':
        return 'Essence';
      case 'diesel':
        return 'Diesel';
      case 'electric':
        return 'Électrique';
      case 'hybrid':
        return 'Hybride';
      default:
        return 'Inconnu';
    }
  };

  const getFuelTypeIcon = (fuelType: string) => {
    switch (fuelType) {
      case 'electric':
        return <ElectricCar />;
      default:
        return <LocalGasStation />;
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setFormData({
      license_plate: '',
      brand: '',
      model: '',
      year: '',
      color: '',
      fuel_type: 'gasoline',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Chargement des véhicules...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Gestion des Véhicules
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez votre flotte de véhicules
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowForm(true)}
          size="large"
        >
          Ajouter un véhicule
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {vehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    {vehicle.license_plate}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(vehicle)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(vehicle.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
                
                <Stack spacing={2}>
                  <Box display="flex" alignItems="center">
                    <DirectionsCar sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                  </Box>
                  
                  {vehicle.year && (
                    <Typography variant="body2" color="text.secondary">
                      Année: {vehicle.year}
                    </Typography>
                  )}
                  
                  {vehicle.color && (
                    <Typography variant="body2" color="text.secondary">
                      Couleur: {vehicle.color}
                    </Typography>
                  )}
                  
                  <Box display="flex" alignItems="center">
                    {getFuelTypeIcon(vehicle.fuel_type || 'gasoline')}
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {getFuelTypeLabel(vehicle.fuel_type || 'gasoline')}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center">
                    <Chip
                      icon={getStatusIcon(vehicle.status)}
                      label={getStatusLabel(vehicle.status)}
                      color={getStatusColor(vehicle.status) as any}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {vehicles.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.300', width: 64, height: 64 }}>
            <DirectionsCar sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" gutterBottom>
            Aucun véhicule trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Commencez par ajouter votre premier véhicule
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowForm(true)}
            sx={{ mt: 2 }}
          >
            Ajouter un véhicule
          </Button>
        </Box>
      )}

      {/* Vehicle Form Dialog */}
      <Dialog open={showForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVehicle ? 'Modifier' : 'Ajouter'} un véhicule
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Plaque d'immatriculation"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Marque"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Modèle"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Année"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  InputProps={{ inputProps: { min: 1990, max: 2030 } }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Couleur"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type de carburant</InputLabel>
                  <Select
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                    label="Type de carburant"
                  >
                    <MenuItem value="gasoline">Essence</MenuItem>
                    <MenuItem value="diesel">Diesel</MenuItem>
                    <MenuItem value="electric">Électrique</MenuItem>
                    <MenuItem value="hybrid">Hybride</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseForm}>
              Annuler
            </Button>
            <Button type="submit" variant="contained">
              {editingVehicle ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setShowForm(true)}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Vehicles;
