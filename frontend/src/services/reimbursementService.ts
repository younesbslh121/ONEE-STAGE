import axios from 'axios';
import { MissionReimbursement, ReimbursementRate, ApiResponse, Mission, User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Tarifs de remboursement par grade (en MAD)
export const REIMBURSEMENT_RATES: ReimbursementRate[] = [
  {
    grade: 'agent_execution',
    dejeuner: 50,
    dinner: 80,
    hebergement: 200
  },
  {
    grade: 'agent_maitrise',
    dejeuner: 70,
    dinner: 110,
    hebergement: 300
  },
  {
    grade: 'agent_commandement',
    dejeuner: 90,
    dinner: 140,
    hebergement: 400
  },
  {
    grade: 'haut_cadre',
    dejeuner: 120,
    dinner: 180,
    hebergement: 600
  }
];

export const reimbursementService = {
  // Récupérer les tarifs de remboursement
  getReimbursementRates: (): ReimbursementRate[] => {
    return REIMBURSEMENT_RATES;
  },

  // Récupérer le tarif pour un grade spécifique
  getRateByGrade: (grade: string): ReimbursementRate | undefined => {
    return REIMBURSEMENT_RATES.find(rate => rate.grade === grade);
  },

  // Calculer le remboursement pour une mission
  calculateReimbursement: (mission: Mission, user: User): Partial<MissionReimbursement> => {
    const userGrade = user.grade || 'agent_execution';
    const rate = REIMBURSEMENT_RATES.find(r => r.grade === userGrade);
    
    if (!rate) {
      throw new Error(`Tarif non trouvé pour le grade: ${userGrade}`);
    }

    // Calculer la durée de la mission en jours
    const startDate = new Date(mission.scheduled_start || new Date());
    const endDate = new Date(mission.scheduled_end || new Date());
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysCount = Math.max(1, diffDays); // Au minimum 1 jour

    // Calculer les montants
    const dejeunerAmount = rate.dejeuner * daysCount;
    const dinnerAmount = rate.dinner * daysCount;
    const hebergementAmount = rate.hebergement * (daysCount > 1 ? daysCount - 1 : 0); // Pas d'hébergement pour les missions d'un jour
    const totalAmount = dejeunerAmount + dinnerAmount + hebergementAmount;

    return {
      mission_id: mission.id,
      user_id: user.id,
      grade: userGrade,
      dejeuner_amount: dejeunerAmount,
      dinner_amount: dinnerAmount,
      hebergement_amount: hebergementAmount,
      total_amount: totalAmount,
      days_count: daysCount,
      status: 'pending'
    };
  },

  // Récupérer tous les remboursements
  getReimbursements: async (): Promise<MissionReimbursement[]> => {
    try {
      const response = await axios.get<ApiResponse<MissionReimbursement[]>>(`${API_BASE_URL}/reimbursements/`);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des remboursements:', error);
      throw error;
    }
  },

  // Récupérer les remboursements par utilisateur
  getReimbursementsByUser: async (userId: number): Promise<MissionReimbursement[]> => {
    try {
      const response = await axios.get<ApiResponse<MissionReimbursement[]>>(`${API_BASE_URL}/reimbursements/?user_id=${userId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des remboursements de l\'utilisateur:', error);
      throw error;
    }
  },

  // Récupérer les remboursements par mission
  getReimbursementsByMission: async (missionId: number): Promise<MissionReimbursement[]> => {
    try {
      const response = await axios.get<ApiResponse<MissionReimbursement[]>>(`${API_BASE_URL}/reimbursements/?mission_id=${missionId}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des remboursements de la mission:', error);
      throw error;
    }
  },

  // Créer un remboursement
  createReimbursement: async (reimbursementData: Partial<MissionReimbursement>): Promise<MissionReimbursement> => {
    try {
      const response = await axios.post<ApiResponse<MissionReimbursement>>(`${API_BASE_URL}/reimbursements/`, reimbursementData);
      return response.data.data!;
    } catch (error) {
      console.error('Erreur lors de la création du remboursement:', error);
      throw error;
    }
  },

  // Créer automatiquement un remboursement pour une mission
  createAutomaticReimbursement: async (missionId: number, userId: number): Promise<MissionReimbursement> => {
    try {
      const response = await axios.post<ApiResponse<MissionReimbursement>>(`${API_BASE_URL}/reimbursements/auto-create/`, {
        mission_id: missionId,
        user_id: userId
      });
      return response.data.data!;
    } catch (error) {
      console.error('Erreur lors de la création automatique du remboursement:', error);
      throw error;
    }
  },

  // Approuver un remboursement
  approveReimbursement: async (reimbursementId: number): Promise<MissionReimbursement> => {
    try {
      const response = await axios.patch<ApiResponse<MissionReimbursement>>(`${API_BASE_URL}/reimbursements/${reimbursementId}/approve/`);
      return response.data.data!;
    } catch (error) {
      console.error('Erreur lors de l\'approbation du remboursement:', error);
      throw error;
    }
  },

  // Rejeter un remboursement
  rejectReimbursement: async (reimbursementId: number, reason?: string): Promise<MissionReimbursement> => {
    try {
      const response = await axios.patch<ApiResponse<MissionReimbursement>>(`${API_BASE_URL}/reimbursements/${reimbursementId}/reject/`, {
        reason
      });
      return response.data.data!;
    } catch (error) {
      console.error('Erreur lors du rejet du remboursement:', error);
      throw error;
    }
  },

  // Marquer un remboursement comme payé
  markAsPaid: async (reimbursementId: number): Promise<MissionReimbursement> => {
    try {
      const response = await axios.patch<ApiResponse<MissionReimbursement>>(`${API_BASE_URL}/reimbursements/${reimbursementId}/paid/`);
      return response.data.data!;
    } catch (error) {
      console.error('Erreur lors du marquage comme payé:', error);
      throw error;
    }
  },

  // Mettre à jour un remboursement
  updateReimbursement: async (reimbursementId: number, updateData: Partial<MissionReimbursement>): Promise<MissionReimbursement> => {
    try {
      const response = await axios.patch<ApiResponse<MissionReimbursement>>(`${API_BASE_URL}/reimbursements/${reimbursementId}/`, updateData);
      return response.data.data!;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du remboursement:', error);
      throw error;
    }
  },

  // Supprimer un remboursement
  deleteReimbursement: async (reimbursementId: number): Promise<void> => {
    try {
      await axios.delete(`${API_BASE_URL}/reimbursements/${reimbursementId}/`);
    } catch (error) {
      console.error('Erreur lors de la suppression du remboursement:', error);
      throw error;
    }
  },

  // Obtenir les statistiques des remboursements
  getReimbursementStats: async (): Promise<any> => {
    try {
      const response = await axios.get<ApiResponse<any>>(`${API_BASE_URL}/reimbursements/stats/`);
      return response.data.data || {};
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }
};
