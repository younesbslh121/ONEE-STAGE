import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { frFR } from '@mui/material/locale';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import MapTest from './pages/MapTest';
import MapSimple from './pages/MapSimple';
import MapDebug from './pages/MapDebug';
import FoliumMapPage from './pages/FoliumMapPage';
import TestConnection from './pages/TestConnection';
import Home from './pages/Home';
import Vehicles from './pages/Vehicles';
import Missions from './pages/Missions';
import Anomalies from './pages/Anomalies';
import Remboursements from './pages/Remboursements';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { MapProvider } from './contexts/MapContext';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
}, frFR);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <MapProvider refreshInterval={15000}>
          <Router>
          <div className="App">
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="map" element={<Map />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="missions" element={<Missions />} />
              <Route path="anomalies" element={<Anomalies />}/>
              <Route path="reimbursements" element={<Remboursements />} />
             
               
            </Route>
            <Route path="/home" element={<Home />} />
            <Route path="/test-connection" element={<TestConnection />} />
            <Route path="/map-simple" element={<MapSimple />} />
            <Route path="/map-test" element={<MapTest />} />
            <Route path="/map-debug" element={<MapDebug />} />
            <Route path="/folium-map" element={<FoliumMapPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          </div>
          </Router>
        </MapProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
