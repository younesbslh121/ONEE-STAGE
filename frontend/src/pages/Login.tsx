import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Avatar,
  InputAdornment,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
  DirectionsCar,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(formData.username, formData.password);
      
      if (success) {
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      }
    } catch (err: any) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <Avatar
            sx={{
              m: 'auto',
              mb: 2,
              bgcolor: 'primary.main',
              width: 64,
              height: 64,
            }}
          >
            <DirectionsCar sx={{ fontSize: 32 }} />
          </Avatar>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            ONEEManager
          </Typography>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Gestion de Flotte
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Connectez-vous pour accéder à votre tableau de bord
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              fullWidth
              name="username"
              label="Nom d'utilisateur"
              value={formData.username}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              fullWidth
              name="password"
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              <strong>Compte de test:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Utilisateur: <strong>admin</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mot de passe: <strong>password</strong>
            </Typography>
          </Paper>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
