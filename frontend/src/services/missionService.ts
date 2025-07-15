import { Mission } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const missionService = {
  async getMissions(): Promise<Mission[]> {
    const response = await fetch(`${API_BASE_URL}/api/missions/noauth`);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.missions || [];
  },

  async getMission(id: number): Promise<Mission> {
    const response = await fetch(`${API_BASE_URL}/api/missions/noauth/${id}`);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.mission;
  },

  async getMissionMap(id: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/missions/noauth/${id}/map`);
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  },

  async createMission(mission: Omit<Mission, 'id'>): Promise<Mission> {
    const response = await fetch(`${API_BASE_URL}/api/missions/noauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mission),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.mission;
  },

  async updateMission(id: number, mission: Partial<Mission>): Promise<Mission> {
    const response = await fetch(`${API_BASE_URL}/api/missions/noauth/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mission),
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.mission;
  },

  async deleteMission(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/missions/noauth/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
  },

  async startMission(id: number): Promise<Mission> {
    const response = await fetch(`${API_BASE_URL}/api/missions/${id}/start`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.mission;
  },

  async completeMission(id: number): Promise<Mission> {
    const response = await fetch(`${API_BASE_URL}/api/missions/${id}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.mission;
  },

  async cancelMission(id: number): Promise<Mission> {
    const response = await fetch(`${API_BASE_URL}/api/missions/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.mission;
  }
};
