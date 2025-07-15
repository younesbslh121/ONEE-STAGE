import axios from 'axios';
import { Anomaly, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const anomalyService = {
  // Récupérer toutes les anomalies
  getAnomalies: async (): Promise<Anomaly[]> => {
    try {
      const response = await axios.get<ApiResponse<Anomaly[]>>(`${API_BASE_URL}/anomalies/noauth`);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des anomalies:', error);
      throw error;
    }
  },

  // Récupérer les anomalies non résolues
  getUnresolvedAnomalies: async (): Promise<Anomaly[]> => {
    try {
      const response = await axios.get<ApiResponse<Anomaly[]>>(`${API_BASE_URL}/anomalies/?resolved=false`);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des anomalies non résolues:', error);
      throw error;
    }
  },

  // Récupérer les anomalies par véhicule
  getAnomaliesByVehicle: async (vehicleId: number): Promise<Anomaly[]> => {
    try {
      const response = await axios.get<ApiResponse<Anomaly[]>>(`${API_BASE_URL}/anomalies/?vehicle_id=${vehicleId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des anomalies du véhicule:', error);
      throw error;
    }
  },

  // Récupérer les anomalies par utilisateur
  getAnomaliesByUser: async (userId: number): Promise<Anomaly[]> => {
    try {
      const response = await axios.get<ApiResponse<Anomaly[]>>(`${API_BASE_URL}/anomalies/?user_id=${userId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des anomalies de l\'utilisateur:', error);
      throw error;
    }
  },

  // Créer une nouvelle anomalie
  createAnomaly: async (anomalyData: Partial<Anomaly>): Promise<Anomaly> => {
    try {
      const response = await axios.post<ApiResponse<Anomaly>>(`${API_BASE_URL}/anomalies/noauth`, anomalyData);
      return response.data.data!;
    } catch (error) {
      console.error('Erreur lors de la création de l\'anomalie:', error);
      throw error;
    }
  },

  // Marquer une anomalie comme résolue
  resolveAnomaly: async (anomalyId: number, notes?: string): Promise<Anomaly> => {
    try {
      const response = await axios.patch<ApiResponse<Anomaly>>(`${API_BASE_URL}/anomalies/${anomalyId}/resolve/`, {
        notes
      });
      return response.data.data!;
    } catch (error) {
      console.error('Erreur lors de la résolution de l\'anomalie:', error);
      throw error;
    }
  },

  // Mettre à jour une anomalie
  updateAnomaly: async (anomalyId: number, updateData: Partial<Anomaly>): Promise<Anomaly> => {
    try {
      const response = await axios.patch<ApiResponse<Anomaly>>(`${API_BASE_URL}/anomalies/${anomalyId}/`, updateData);
      return response.data.data!;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'anomalie:', error);
      throw error;
    }
  },

  // Supprimer une anomalie
  deleteAnomaly: async (anomalyId: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/anomalies/${anomalyId}/`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'anomalie:', error);
      throw error;
    }
  },

  // Détecter les anomalies de consommation excessive
  detectFuelAnomalies: async (vehicleId: number, threshold: number = 1.5): Promise<Anomaly[]> => {
    try {
      const response = await axios.post<ApiResponse<Anomaly[]>>(`${API_BASE_URL}/anomalies/detect-fuel/`, {
        vehicle_id: vehicleId,
        threshold: threshold
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la détection des anomalies de carburant:', error);
      throw error;
    }
  },

  // Détecter les déviations de route
  detectRouteDeviations: async (missionId: number): Promise<Anomaly[]> => {
    try {
      const response = await axios.post<ApiResponse<Anomaly[]>>(`${API_BASE_URL}/anomalies/detect-route-deviation/`, {
        mission_id: missionId
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la détection des déviations de route:', error);
      throw error;
    }
  }
};
