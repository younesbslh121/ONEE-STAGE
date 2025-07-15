import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { vehicleService } from '../services/vehicleService';
import { missionService } from '../services/missionService';
import { anomalyService } from '../services/anomalyService';
import { Vehicle, Mission, Anomaly, User } from '../types';

// Extended types for MapContext
export interface VehicleWithLocation extends Vehicle {
  current_location?: {
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
    heading: number;
  };
}

export interface MissionWithLocation extends Mission {
  start_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  end_location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  route?: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
    speed: number;
    heading: number;
  }>;
}

export interface AnomalyWithLocation extends Anomaly {
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

export interface MapData {
  vehicles: Vehicle[];
  missions: Mission[];
  anomalies: Anomaly[];
  lastUpdate: Date;
  isLoading: boolean;
  error: string | null;
}

interface MapContextType extends MapData {
  refreshData: () => Promise<void>;
  updateVehicle: (vehicleId: number, updates: Partial<Vehicle>) => Promise<void>;
  updateMission: (missionId: number, updates: Partial<Mission>) => Promise<void>;
  getMissionMap: (missionId: number) => Promise<any>;
  subscribeToUpdates: (callback: (data: MapData) => void) => () => void;
  setAutoRefresh: (enabled: boolean) => void;
  autoRefreshEnabled: boolean;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

interface MapProviderProps {
  children: ReactNode;
  refreshInterval?: number;
}

export const MapProvider: React.FC<MapProviderProps> = ({ 
  children, 
  refreshInterval = 30000 // 30 secondes par défaut
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [subscribers, setSubscribers] = useState<((data: MapData) => void)[]>([]);

  // Fonction pour charger toutes les données
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Refreshing map data...');
      
      // Charger les données en parallèle
      const [vehiclesData, missionsData, anomaliesData] = await Promise.all([
        vehicleService.getVehicles().catch(err => {
          console.warn('Failed to load vehicles:', err);
          return [];
        }),
        missionService.getMissions().catch(err => {
          console.warn('Failed to load missions:', err);
          return [];
        }),
        anomalyService.getAnomalies().catch(err => {
          console.warn('Failed to load anomalies:', err);
          return [];
        })
      ]);

      // Process vehicles to ensure proper type handling
      const processedVehicles = vehiclesData.map(vehicle => {
        // Ensure fuel_type is properly set
        const processedVehicle: Vehicle = {
          ...vehicle,
          fuel_type: vehicle.fuel_type || 'gasoline'
        };
        return processedVehicle;
      });

      // Process missions to ensure proper type handling
      const processedMissions = missionsData.map(mission => {
        const processedMission: Mission = {
          ...mission,
          start_latitude: mission.start_latitude || 0,
          start_longitude: mission.start_longitude || 0,
          end_latitude: mission.end_latitude || 0,
          end_longitude: mission.end_longitude || 0
        };
        return processedMission;
      });

      // Process anomalies to ensure proper type handling
      const processedAnomalies = anomaliesData.map(anomaly => {
        const processedAnomaly: Anomaly = {
          ...anomaly,
          detected_at: anomaly.detected_at || new Date().toISOString()
        };
        return processedAnomaly;
      });

      setVehicles(processedVehicles);
      setMissions(processedMissions);
      setAnomalies(processedAnomalies);
      setLastUpdate(new Date());
      
      // Notifier les abonnés
      const mapData: MapData = {
        vehicles: processedVehicles,
        missions: processedMissions,
        anomalies: processedAnomalies,
        lastUpdate: new Date(),
        isLoading: false,
        error: null
      };
      
      subscribers.forEach(callback => callback(mapData));
      
      console.log('✅ Map data refreshed successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      console.error('❌ Failed to refresh map data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [subscribers]);

  // Mettre à jour un véhicule
  const updateVehicle = useCallback(async (vehicleId: number, updates: Partial<Vehicle>) => {
    try {
      await vehicleService.updateVehicle(vehicleId, updates);
      
      // Mettre à jour localement
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId ? { ...vehicle, ...updates } : vehicle
      ));
      
      // Rafraîchir les données complètes
      await refreshData();
      
    } catch (err) {
      console.error('Failed to update vehicle:', err);
      throw err;
    }
  }, [refreshData]);

  // Mettre à jour une mission
  const updateMission = useCallback(async (missionId: number, updates: Partial<Mission>) => {
    try {
      await missionService.updateMission(missionId, updates);
      
      // Mettre à jour localement
      setMissions(prev => prev.map(mission => 
        mission.id === missionId ? { ...mission, ...updates } : mission
      ));
      
      // Rafraîchir les données complètes
      await refreshData();
      
    } catch (err) {
      console.error('Failed to update mission:', err);
      throw err;
    }
  }, [refreshData]);

  // Obtenir les données de carte pour une mission spécifique
  const getMissionMap = useCallback(async (missionId: number) => {
    try {
      const missionMapData = await missionService.getMissionMap(missionId);
      return missionMapData;
    } catch (err) {
      console.error('Failed to get mission map:', err);
      throw err;
    }
  }, []);

  // S'abonner aux mises à jour
  const subscribeToUpdates = useCallback((callback: (data: MapData) => void) => {
    setSubscribers(prev => [...prev, callback]);
    
    // Retourner la fonction de désabonnement
    return () => {
      setSubscribers(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval, refreshData]);

  // Chargement initial
  useEffect(() => {
    refreshData();
  }, []);

  const contextValue: MapContextType = {
    vehicles,
    missions,
    anomalies,
    lastUpdate,
    isLoading,
    error,
    refreshData,
    updateVehicle,
    updateMission,
    getMissionMap,
    subscribeToUpdates,
    setAutoRefresh: setAutoRefreshEnabled,
    autoRefreshEnabled
  };

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useMapData = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMapData must be used within a MapProvider');
  }
  return context;
};

export default MapContext;
