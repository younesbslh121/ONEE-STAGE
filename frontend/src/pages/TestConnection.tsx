import React, { useState, useEffect } from 'react';
import { authAPI, vehicleAPI, missionAPI } from '../services/api';
import axios from 'axios';

const TestConnection: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<string>('Vérification...');
  const [loginStatus, setLoginStatus] = useState<string>('Non testé');
  const [vehiclesStatus, setVehiclesStatus] = useState<string>('Non testé');
  const [missionsStatus, setMissionsStatus] = useState<string>('Non testé');
  const [token, setToken] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      const response = await axios.get('http://localhost:5000/health');
      setBackendStatus('✅ Backend accessible');
      console.log('Backend health check:', response.data);
    } catch (error) {
      setBackendStatus('❌ Backend inaccessible');
      console.error('Backend error:', error);
    }
  };

  const testLogin = async () => {
    try {
      setLoginStatus('🔄 Test en cours...');
      const response = await authAPI.login({
        username: 'admin',
        password: 'admin123'
      });
      
      setToken(response.access_token);
      localStorage.setItem('token', response.access_token);
      setLoginStatus('✅ Connexion réussie');
      console.log('Login response:', response);
    } catch (error: any) {
      setLoginStatus(`❌ Erreur: ${error.response?.data?.message || error.message}`);
      console.error('Login error:', error);
    }
  };

  const testVehicles = async () => {
    try {
      setVehiclesStatus('🔄 Test en cours...');
      const response = await vehicleAPI.getAll();
      setVehiclesStatus(`✅ ${response.vehicles.length} véhicules trouvés`);
      console.log('Vehicles response:', response);
    } catch (error: any) {
      setVehiclesStatus(`❌ Erreur: ${error.response?.data?.message || error.message}`);
      console.error('Vehicles error:', error);
    }
  };

  const testMissions = async () => {
    try {
      setMissionsStatus('🔄 Test en cours...');
      const response = await missionAPI.getAll();
      setMissionsStatus(`✅ ${response.missions.length} missions trouvées`);
      console.log('Missions response:', response);
    } catch (error: any) {
      setMissionsStatus(`❌ Erreur: ${error.response?.data?.message || error.message}`);
      console.error('Missions error:', error);
    }
  };

  const createTestVehicle = async () => {
    try {
      const vehicleData = {
        license_plate: `TEST-${Date.now().toString().slice(-3)}`,
        brand: 'Toyota',
        model: 'Test',
        year: 2023,
        color: 'Blue',
        fuel_type: 'gasoline'
      };

      const response = await vehicleAPI.create(vehicleData);
      setTestResults(prev => [...prev, {
        type: 'Véhicule créé',
        data: response,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Rafraîchir la liste des véhicules
      testVehicles();
    } catch (error: any) {
      setTestResults(prev => [...prev, {
        type: 'Erreur création véhicule',
        data: error.response?.data || error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const createTestMission = async () => {
    try {
      const missionData = {
        title: `Mission Test ${Date.now().toString().slice(-3)}`,
        description: 'Mission de test créée depuis le frontend',
        start_address: 'Paris, France',
        start_latitude: 48.8566,
        start_longitude: 2.3522,
        end_address: 'Lyon, France',
        end_latitude: 45.7640,
        end_longitude: 4.8357,
        estimated_duration: 240,
        vehicle_id: 1
      };

      const response = await missionAPI.create(missionData);
      setTestResults(prev => [...prev, {
        type: 'Mission créée',
        data: response,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Rafraîchir la liste des missions
      testMissions();
    } catch (error: any) {
      setTestResults(prev => [...prev, {
        type: 'Erreur création mission',
        data: error.response?.data || error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔧 Test de Connexion Frontend ↔ Backend</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>🏥 État des Services</h3>
          <div style={{ marginBottom: '10px' }}>
            <strong>Backend Flask:</strong> {backendStatus}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Authentification:</strong> {loginStatus}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>API Véhicules:</strong> {vehiclesStatus}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>API Missions:</strong> {missionsStatus}
          </div>
          {token && (
            <div style={{ marginTop: '15px', fontSize: '12px' }}>
              <strong>Token JWT:</strong> {token.substring(0, 20)}...
            </div>
          )}
        </div>

        <div style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>⚡ Actions de Test</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={testBackendConnection} style={{
              padding: '10px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}>
              🔄 Tester Backend
            </button>
            
            <button onClick={testLogin} style={{
              padding: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}>
              🔑 Se Connecter
            </button>
            
            <button onClick={testVehicles} disabled={!token} style={{
              padding: '10px',
              backgroundColor: token ? '#17a2b8' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: token ? 'pointer' : 'not-allowed'
            }}>
              🚗 Tester Véhicules
            </button>
            
            <button onClick={testMissions} disabled={!token} style={{
              padding: '10px',
              backgroundColor: token ? '#ffc107' : '#6c757d',
              color: token ? 'black' : 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: token ? 'pointer' : 'not-allowed'
            }}>
              📋 Tester Missions
            </button>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f0f8ff'
        }}>
          <h3>➕ Créer des Données</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={createTestVehicle} disabled={!token} style={{
              padding: '12px',
              backgroundColor: token ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: token ? 'pointer' : 'not-allowed'
            }}>
              🚗 Créer Véhicule de Test
            </button>
            
            <button onClick={createTestMission} disabled={!token} style={{
              padding: '12px',
              backgroundColor: token ? '#fd7e14' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: token ? 'pointer' : 'not-allowed'
            }}>
              📋 Créer Mission de Test
            </button>
          </div>
        </div>

        <div style={{
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>📊 Résultats des Tests</h3>
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            border: '1px solid #eee',
            padding: '10px',
            backgroundColor: 'white'
          }}>
            {testResults.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                Aucun test effectué
              </p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} style={{
                  marginBottom: '10px',
                  padding: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  <strong>{result.timestamp}</strong> - {result.type}
                  <pre style={{ margin: '5px 0', fontSize: '10px' }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px'
      }}>
        <h3>📝 Instructions</h3>
        <ol>
          <li>Vérifiez que le backend Flask fonctionne</li>
          <li>Connectez-vous avec admin/admin123</li>
          <li>Testez les APIs véhicules et missions</li>
          <li>Créez des données de test</li>
          <li>Vérifiez que les données apparaissent dans l'application</li>
        </ol>
        <p><strong>Note:</strong> Ouvrez la console du navigateur (F12) pour voir les détails des réponses.</p>
      </div>
    </div>
  );
};

export default TestConnection;
