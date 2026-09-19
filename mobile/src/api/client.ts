import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiConfig } from './config';
import {
  User,
  Announcement,
  ScheduleItem,
  Assignment,
  Exam,
  AbsenceRequest,
  LostFoundItem,
  PotentialMatch,
  Notification,
  Conversation,
  ChatMessage,
  SchoolClass,
} from '../types';

class ApiClient {
  private token: string | null = null;
  private baseUrl: string = ApiConfig.baseUrl;

  constructor() {
    this.loadToken();
  }

  async loadToken() {
    try {
      const saved = await AsyncStorage.getItem('@campus_token');
      if (saved) {
        this.token = saved;
      }
      const savedUrl = await AsyncStorage.getItem('@campus_api_url');
      if (savedUrl) {
        this.baseUrl = savedUrl;
      }
    } catch (e) {
      console.warn('Erreur chargement token/url:', e);
    }
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('@campus_token', token);
    } else {
      await AsyncStorage.removeItem('@campus_token');
    }
  }

  async setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
    await AsyncStorage.setItem('@campus_api_url', this.baseUrl);
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  private getHeaders(isJson: boolean = true): HeadersInit {
    const headers: Record<string, string> = {};
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const resp = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(!(options.body instanceof FormData)),
          ...(options.headers as Record<string, string>),
        },
      });

      if (!resp.ok) {
        let errDetail = `HTTP ${resp.status}`;
        try {
          const errJson = await resp.json();
          errDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
        } catch {
          errDetail = await resp.text();
        }
        throw new Error(errDetail);
      }

      if (resp.status === 204) {
        return {} as T;
      }
      return await resp.json();
    } catch (error: any) {
      console.warn(`[API] Error on ${endpoint}:`, error.message);
      throw error;
    }
  }

  // --- Authentification ---
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const data = await this.request<{ access_token: string; token_type: string }>(
      ApiConfig.endpoints.login,
      {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      }
    );
    await this.setToken(data.access_token);
    return data;
  }

  async register(body: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    class_id?: number | null;
  }): Promise<User> {
    return await this.request<User>(ApiConfig.endpoints.register, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getMe(): Promise<User> {
    return await this.request<User>(ApiConfig.endpoints.me, { method: 'GET' });
  }

  // --- Classes & Matières ---
  async getClasses(): Promise<SchoolClass[]> {
    return await this.request<SchoolClass[]>(ApiConfig.endpoints.classes, { method: 'GET' });
  }

  // --- Annonces ---
  async getAnnouncements(params?: { categorie?: string; recherche?: string }): Promise<Announcement[]> {
    let query = '';
    if (params?.categorie) query += `?categorie=${encodeURIComponent(params.categorie)}`;
    if (params?.recherche) {
      query += (query ? '&' : '?') + `recherche=${encodeURIComponent(params.recherche)}`;
    }
    return await this.request<Announcement[]>(`${ApiConfig.endpoints.announcements}${query}`, { method: 'GET' });
  }

  async createAnnouncement(body: {
    title: string;
    content: string;
    category: string;
    class_id?: number | null;
  }): Promise<Announcement> {
    return await this.request<Announcement>(ApiConfig.endpoints.announcements, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // --- Emploi du temps ---
  async getSchedules(params?: { classe_id?: number; date_seance?: string }): Promise<ScheduleItem[]> {
    let query = '';
    const qParts: string[] = [];
    if (params?.classe_id) qParts.push(`classe_id=${params.classe_id}`);
    if (params?.date_seance) qParts.push(`date_seance=${params.date_seance}`);
    if (qParts.length > 0) query = '?' + qParts.join('&');

    return await this.request<ScheduleItem[]>(`${ApiConfig.endpoints.schedules}${query}`, { method: 'GET' });
  }

  // --- Devoirs ---
  async getAssignments(params?: { a_venir?: boolean; classe_id?: number }): Promise<Assignment[]> {
    let query = '';
    const qParts: string[] = [];
    if (params?.a_venir !== undefined) qParts.push(`a_venir=${params.a_venir}`);
    if (params?.classe_id) qParts.push(`classe_id=${params.classe_id}`);
    if (qParts.length > 0) query = '?' + qParts.join('&');

    return await this.request<Assignment[]>(`${ApiConfig.endpoints.assignments}${query}`, { method: 'GET' });
  }

  async createAssignment(body: {
    teacher_assignment_id: number;
    title: string;
    description?: string;
    due_date: string;
  }): Promise<Assignment> {
    return await this.request<Assignment>(ApiConfig.endpoints.assignments, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // --- Examens ---
  async getExams(params?: { a_venir?: boolean; classe_id?: number }): Promise<Exam[]> {
    let query = '';
    const qParts: string[] = [];
    if (params?.a_venir !== undefined) qParts.push(`a_venir=${params.a_venir}`);
    if (params?.classe_id) qParts.push(`classe_id=${params.classe_id}`);
    if (qParts.length > 0) query = '?' + qParts.join('&');

    return await this.request<Exam[]>(`${ApiConfig.endpoints.exams}${query}`, { method: 'GET' });
  }

  // --- Absences ---
  async getAbsences(params?: { statut?: string }): Promise<AbsenceRequest[]> {
    let query = '';
    if (params?.statut) query = `?statut=${params.statut}`;
    return await this.request<AbsenceRequest[]>(`${ApiConfig.endpoints.absences}${query}`, { method: 'GET' });
  }

  async createAbsence(body: { schedule_id: number; reason: string }): Promise<AbsenceRequest> {
    return await this.request<AbsenceRequest>(ApiConfig.endpoints.absences, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateAbsenceStatus(
    absenceId: number,
    status: 'ACCEPTEE' | 'REFUSEE',
    review_comment?: string
  ): Promise<AbsenceRequest> {
    return await this.request<AbsenceRequest>(`${ApiConfig.endpoints.absences}/${absenceId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, review_comment }),
    });
  }


  // --- Objets Perdus & Trouvés ---
  async getLostFoundItems(params?: {
    type?: string;
    statut?: string;
    categorie?: string;
    recherche?: string;
  }): Promise<LostFoundItem[]> {
    const qParts: string[] = [];
    if (params?.type) qParts.push(`type=${params.type}`);
    if (params?.statut) qParts.push(`statut=${params.statut}`);
    if (params?.categorie) qParts.push(`categorie=${encodeURIComponent(params.categorie)}`);
    if (params?.recherche) qParts.push(`recherche=${encodeURIComponent(params.recherche)}`);
    const query = qParts.length > 0 ? '?' + qParts.join('&') : '';

    return await this.request<LostFoundItem[]>(`${ApiConfig.endpoints.lostFound}${query}`, { method: 'GET' });
  }

  async createLostFoundItem(body: {
    item_type: 'PERDU' | 'TROUVE';
    title: string;
    description: string;
    category?: string;
    color?: string;
    location: string;
    item_date: string;
  }): Promise<LostFoundItem> {
    return await this.request<LostFoundItem>(ApiConfig.endpoints.lostFound, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // --- Correspondance IA ---
  async getPotentialMatches(params?: { statut?: string }): Promise<PotentialMatch[]> {
    let query = '';
    if (params?.statut) query = `?statut=${params.statut}`;
    return await this.request<PotentialMatch[]>(`${ApiConfig.endpoints.potentialMatches}${query}`, { method: 'GET' });
  }

  async updateMatchStatus(matchId: number, status: 'CONFIRMEE' | 'REJETEE'): Promise<PotentialMatch> {
    return await this.request<PotentialMatch>(`${ApiConfig.endpoints.potentialMatches}/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // --- Notifications ---
  async getNotifications(params?: { non_lues?: boolean }): Promise<Notification[]> {
    let query = '';
    if (params?.non_lues) query = `?non_lues=true`;
    return await this.request<Notification[]>(`${ApiConfig.endpoints.notifications}${query}`, { method: 'GET' });
  }

  async markNotificationRead(id: number): Promise<void> {
    await this.request<void>(`${ApiConfig.endpoints.notifications}/${id}/lire`, { method: 'POST' });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request<void>(`${ApiConfig.endpoints.notifications}/lire-tout`, { method: 'POST' });
  }

  // --- Assistant IA ---
  async askAssistant(question: string): Promise<{ reponse: string; sources?: any[] }> {
    return await this.request<{ reponse: string; sources?: any[] }>(ApiConfig.endpoints.assistant, {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  // --- Messagerie ---
  async getConversations(): Promise<Conversation[]> {
    return await this.request<Conversation[]>(ApiConfig.endpoints.conversations, { method: 'GET' });
  }

  async getMessages(conversationId: number): Promise<ChatMessage[]> {
    return await this.request<ChatMessage[]>(`${ApiConfig.endpoints.conversations}/${conversationId}/messages`, {
      method: 'GET',
    });
  }

  async sendMessage(conversationId: number, content: string): Promise<ChatMessage> {
    return await this.request<ChatMessage>(`${ApiConfig.endpoints.conversations}/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // --- Administration ---
  async getAdminStats(): Promise<any> {
    return await this.request<any>(ApiConfig.endpoints.adminStats, { method: 'GET' });
  }
}

export const api = new ApiClient();
