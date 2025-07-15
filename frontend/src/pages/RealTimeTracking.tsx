import React, { useState, useEffect } from 'react';
import RealTimeVehicleTracker from '../components/RealTimeVehicleTracker';
import { missionService } from '../services/missionService';
import { Mission } from '../types';

const RealTimeTracking: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedMissionIds, setSelectedMissionIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const allMissions = await missionService.getMissions();
        const activeMissions = allMissions.filter(
          mission => mission.status === 'in_progress' || mission.status === 'pending'
        );
        setMissions(activeMissions);
        
        // Sélectionner automatiquement les premières missions en cours
        const defaultSelected = activeMissions
          .filter(m => m.status === 'in_progress')
          .slice(0, 2)
          .map(m => m.id);
        setSelectedMissionIds(defaultSelected);
      } catch (err) {
        setError('Erreur lors du chargement des missions');
        console.error('Error fetching missions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMissions();
  }, []);

  const handleMissionToggle = (missionId: number) => {
    setSelectedMissionIds(prev => {
      if (prev.includes(missionId)) {
        return prev.filter(id => id !== missionId);
      } else {
        return [...prev, missionId];
      }
    });
  };

  const getMissionStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'in_progress':
        return '#3b82f6';
      case 'completed':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>🔄 Chargement des missions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <div>⚠️ {error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🚗 Suivi en Temps Réel des Véhicules</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Sélectionner les missions à suivre</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '15px',
          marginBottom: '20px'
        }}>
          {missions.map(mission => (
            <div
              key={mission.id}
              style={{
                border: selectedMissionIds.includes(mission.id) ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: selectedMissionIds.includes(mission.id) ? '#f0f9ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleMissionToggle(mission.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong>{mission.title}</strong>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em',
                    fontWeight: 'bold',
                    color: 'white',
                    backgroundColor: getMissionStatusColor(mission.status),
                    textTransform: 'uppercase'
                  }}
                >
                  {mission.status}
                </span>
              </div>
              <div style={{ fontSize: '0.9em', color: '#6b7280' }}>
                <div>🎯 {mission.start_address} → {mission.end_address}</div>
                <div>👤 {mission.assigned_user?.first_name} {mission.assigned_user?.last_name}</div>
                <div>🚗 {mission.vehicle?.license_plate}</div>
                <div>📅 {new Date(mission.scheduled_start).toLocaleString()}</div>
              </div>
              <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#9ca3af' }}>
                {selectedMissionIds.includes(mission.id) ? '✅ Sélectionné' : '⭕ Cliquez pour sélectionner'}
              </div>
            </div>
          ))}
        </div>
        
        {missions.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
            Aucune mission active trouvée
          </div>
        )}
      </div>

      {selectedMissionIds.length > 0 && (
        <RealTimeVehicleTracker 
          missionIds={selectedMissionIds}
          refreshInterval={10000} // 10 secondes
        />
      )}
      
      {selectedMissionIds.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          borderRadius: '10px',
          border: '1px solid #e5e7eb'
        }}>
          <h3>Aucune mission sélectionnée</h3>
          <p>Sélectionnez une ou plusieurs missions ci-dessus pour commencer le suivi en temps réel.</p>
        </div>
      )}
    </div>
  );
};

export default RealTimeTracking;
