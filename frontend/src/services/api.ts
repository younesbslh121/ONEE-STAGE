import axios from 'axios';
import { 
  User, Vehicle, Mission, Location, Anomaly, 
  LoginRequest, LoginResponse, DashboardStats 
} from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login-simple', credentials);
    return response.data;
  },

  register: async (userData: any): Promise<{ user: User; message: string }> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (userData: any): Promise<{ user: User; message: string }> => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  changePassword: async (passwords: { current_password: string; new_password: string }): Promise<{ message: string }> => {
    const response = await api.put('/auth/change-password', passwords);
    return response.data;
  },
};

// Vehicle API
export const vehicleAPI = {
  getAll: async (): Promise<{ vehicles: Vehicle[] }> => {
    const response = await api.get('/vehicles/noauth');
    return response.data;
  },

  getById: async (id: number): Promise<{ vehicle: Vehicle }> => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  create: async (vehicleData: any): Promise<{ vehicle: Vehicle; message: string }> => {
    const response = await api.post('/vehicles/noauth', vehicleData);
    return response.data;
  },

  update: async (id: number, vehicleData: any): Promise<{ vehicle: Vehicle; message: string }> => {
    const response = await api.put(`/vehicles/${id}`, vehicleData);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/vehicles/noauth/${id}`);
    return response.data;
  },

  getAvailable: async (): Promise<{ vehicles: Vehicle[] }> => {
    const response = await api.get('/vehicles/available');
    return response.data;
  },

  assignDriver: async (vehicleId: number, driverId: number): Promise<{ vehicle: Vehicle; message: string }> => {
    const response = await api.put(`/vehicles/${vehicleId}/driver`, { driver_id: driverId });
    return response.data;
  },

  updateLocation: async (vehicleId: number, latitude: number, longitude: number): Promise<{ vehicle: Vehicle; message: string }> => {
    const response = await api.put(`/vehicles/${vehicleId}/location`, { latitude, longitude });
    return response.data;
  },
};

// Mission API
export const missionAPI = {
  getAll: async (): Promise<{ missions: Mission[] }> => {
    const response = await api.get('/missions/noauth');
    return response.data;
  },

  getById: async (id: number): Promise<{ mission: Mission }> => {
    const response = await api.get(`/missions/${id}`);
    return response.data;
  },

  create: async (missionData: any): Promise<{ mission: Mission; message: string }> => {
    const response = await api.post('/missions/noauth', missionData);
    return response.data;
  },

  update: async (id: number, missionData: any): Promise<{ mission: Mission; message: string }> => {
    const response = await api.put(`/missions/${id}`, missionData);
    return response.data;
  },

  start: async (id: number): Promise<{ mission: Mission; message: string }> => {
    const response = await api.put(`/missions/${id}/start`);
    return response.data;
  },

  complete: async (id: number): Promise<{ mission: Mission; message: string }> => {
    const response = await api.put(`/missions/${id}/complete`);
    return response.data;
  },

  cancel: async (id: number): Promise<{ mission: Mission; message: string }> => {
    const response = await api.put(`/missions/${id}/cancel`);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/missions/noauth/${id}`);
    return response.data;
  },
};

// Location API
export const locationAPI = {
  add: async (locationData: any): Promise<{ location: Location; message: string }> => {
    const response = await api.post('/locations', locationData);
    return response.data;
  },

  getCurrentLocations: async (): Promise<{ locations: Location[] }> => {
    const response = await api.get('/locations/current');
    return response.data;
  },

  getVehicleLocations: async (vehicleId: number, hours: number = 24): Promise<{ locations: Location[]; vehicle: Vehicle }> => {
    const response = await api.get(`/locations/vehicle/${vehicleId}?hours=${hours}`);
    return response.data;
  },

  getMissionLocations: async (missionId: number): Promise<{ locations: Location[] }> => {
    const response = await api.get(`/locations/mission/${missionId}`);
    return response.data;
  },

  getLocationHistory: async (vehicleId: number, startDate?: string, endDate?: string): Promise<{ locations: Location[]; vehicle: Vehicle }> => {
    let url = `/locations/vehicle/${vehicleId}/history`;
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await api.get(url);
    return response.data;
  },
};

// Anomaly API
export const anomalyAPI = {
  getAll: async (filters?: { vehicle_id?: number; mission_id?: number; severity?: string }): Promise<{ anomalies: Anomaly[] }> => {
    const params = new URLSearchParams();
    if (filters?.vehicle_id) params.append('vehicle_id', filters.vehicle_id.toString());
    if (filters?.mission_id) params.append('mission_id', filters.mission_id.toString());
    if (filters?.severity) params.append('severity', filters.severity);
    
    const url = `/anomalies${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data;
  },

  getRecent: async (hours: number = 24): Promise<{ anomalies: Anomaly[] }> => {
    const response = await api.get(`/anomalies/recent?hours=${hours}`);
    return response.data;
  },

  runDetection: async (): Promise<{ anomalies: Anomaly[]; message: string }> => {
    const response = await api.post('/anomalies/detect');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getRecentActivity: async (hours: number = 24): Promise<{ recent_missions: Mission[]; recent_anomalies: Anomaly[]; active_missions: Mission[] }> => {
    const response = await api.get(`/dashboard/recent-activity?hours=${hours}`);
    return response.data;
  },

  getMissionAnalytics: async (days: number = 30): Promise<any> => {
    const response = await api.get(`/dashboard/mission-analytics?days=${days}`);
    return response.data;
  },

  getVehicleAnalytics: async (days: number = 30): Promise<any> => {
    const response = await api.get(`/dashboard/vehicle-analytics?days=${days}`);
    return response.data;
  },
};

// Map API
export const mapAPI = {
  getFleetMap: async (): Promise<{ center: { lat: number; lon: number }; zoom: number; vehicles: any[] }> => {
    const response = await api.get('/map/fleet');
    return response.data;
  },

  getVehicleRoute: async (vehicleId: number, hours: number = 24): Promise<{ vehicle: Vehicle; route: any[] }> => {
    const response = await api.get(`/map/vehicle/${vehicleId}/route?hours=${hours}`);
    return response.data;
  },

  getMissionRoute: async (missionId: number): Promise<{ mission: Mission; planned_route: any; actual_route: any[] }> => {
    const response = await api.get(`/map/mission/${missionId}/route`);
    return response.data;
  },

  getHeatmapData: async (hours: number = 24): Promise<{ heatmap_data: any[] }> => {
    const response = await api.get(`/map/heatmap?hours=${hours}`);
    return response.data;
  },

  getCollaboratorsPositions: async (): Promise<{ collaborators: any[] }> => {
    const response = await api.get('/map/collaborators');
    return response.data;
  },

  updateCollaboratorLocation: async (missionId: number, collaboratorId: number, latitude: number, longitude: number): Promise<{ message: string }> => {
    const response = await api.post(`/missions/${missionId}/location`, {
      collaborator_id: collaboratorId,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });
    return response.data;
  },
};

export default api;
