import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  DirectionsCar,
  Assignment,
  CheckCircle,
  AddCircle,
  Map,
  Assessment,
  Schedule,
  Build,
  PlayArrow,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Véhicules',
      value: '12',
      icon: <DirectionsCar />,
      color: '#1976d2',
      change: '+2 ce mois',
    },
    {
      title: 'Missions Actives',
      value: '8',
      icon: <Assignment />,
      color: '#ed6c02',
      change: '+3 aujourd\'hui',
    },
    {
      title: 'Véhicules Disponibles',
      value: '4',
      icon: <CheckCircle />,
      color: '#2e7d32',
      change: 'En temps réel',
    },
    {
      title: 'Missions Terminées',
      value: '156',
      icon: <Assessment />,
      color: '#9c27b0',
      change: '+12 cette semaine',
    },
  ];

  const recentActivities = [
    {
      time: 'Il y a 2 heures',
      text: 'Véhicule VEH-001 a terminé la mission M-123',
      type: 'completed',
      icon: <CheckCircle />,
    },
    {
      time: 'Il y a 4 heures',
      text: 'Nouvelle mission M-124 assignée à Jean Dupont',
      type: 'assigned',
      icon: <Assignment />,
    },
    {
      time: 'Il y a 6 heures',
      text: 'Véhicule VEH-002 en maintenance',
      type: 'maintenance',
      icon: <Build />,
    },
    {
      time: 'Il y a 8 heures',
      text: 'Mission M-122 démarrée',
      type: 'started',
      icon: <PlayArrow />,
    },
  ];

  const quickActions = [
    {
      title: 'Créer une Mission',
      description: 'Ajouter une nouvelle mission',
      icon: <AddCircle />,
      action: () => navigate('/missions'),
      color: 'primary',
    },
    {
      title: 'Ajouter un Véhicule',
      description: 'Enregistrer un nouveau véhicule',
      icon: <DirectionsCar />,
      action: () => navigate('/vehicles'),
      color: 'secondary',
    },
    {
      title: 'Voir la Carte',
      description: 'Suivre les véhicules en temps réel',
      icon: <Map />,
      action: () => navigate('/map'),
      color: 'success',
    },
    {
      title: 'Générer un Rapport',
      description: 'Créer un rapport détaillé',
      icon: <Assessment />,
      action: () => console.log('Generate report'),
      color: 'warning',
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'completed':
        return 'success';
      case 'assigned':
        return 'primary';
      case 'maintenance':
        return 'warning';
      case 'started':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Tableau de Bord
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Bienvenue dans votre système de gestion de flotte
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={stat.change}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activities */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Activités Récentes
            </Typography>
            <List>
              {recentActivities.map((activity, index) => (
                <ListItem key={index} alignItems="flex-start">
                  <Avatar
                    sx={{
                      bgcolor: `${getActivityColor(activity.type)}.main`,
                      mr: 2,
                      width: 32,
                      height: 32,
                    }}
                  >
                    {activity.icon}
                  </Avatar>
                  <ListItemText
                    primary={activity.text}
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        <Schedule sx={{ fontSize: 14, mr: 0.5 }} />
                        {activity.time}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Actions Rapides
            </Typography>
            <Grid container spacing={2}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={action.action}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: `${action.color}.main`, mr: 2 }}>
                          {action.icon}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {action.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {action.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
