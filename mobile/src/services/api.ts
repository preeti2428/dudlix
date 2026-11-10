import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Room, WidgetPayload, WidgetPreference, Stroke } from '../shared/types';

// Default backend host
const DEFAULT_HOST = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

const STORAGE_KEYS = {
  TOKEN: 'doodlix_auth_token',
  USER: 'doodlix_auth_user',
  CUSTOM_SERVER: 'doodlix_server_url',
};

class ApiService {
  private customBaseUrl: string | null = null;

  async getBaseUrl(): Promise<string> {
    if (this.customBaseUrl) return this.customBaseUrl;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_SERVER);
      if (stored) {
        this.customBaseUrl = stored;
        return stored;
      }
    } catch {}
    return DEFAULT_HOST;
  }

  async setBaseUrl(url: string): Promise<void> {
    this.customBaseUrl = url.trim().replace(/\/$/, '');
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_SERVER, this.customBaseUrl);
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Network timeout. Please check your connection to the Doodlix server.');
      }
      throw err;
    }
  }

  // --- AUTH ---
  async signup(username: string, email: string, password: string) {
    const res = await this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (res.token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    }
    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    }
    return res;
  }

  async demoLogin(role: 'A' | 'B' = 'A') {
    const res = await this.request('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (res.token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
    }
    return res;
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async logout() {
    await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  }

  async getCurrentUser() {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  }

  // --- ROOMS ---
  async createRoom(name?: string): Promise<{ success: boolean; room: Room }> {
    return this.request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getMyRooms(): Promise<{ success: boolean; rooms: Room[] }> {
    return this.request('/api/rooms');
  }

  async getRoomById(roomId: string): Promise<{ success: boolean; room: Room }> {
    return this.request(`/api/rooms/${roomId}`);
  }

  async joinRoomByInvite(inviteCode: string): Promise<{ success: boolean; room: Room; message: string }> {
    return this.request('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  }

  async leaveRoom(roomId: string) {
    return this.request(`/api/rooms/${roomId}/leave`, {
      method: 'DELETE',
    });
  }

  // --- DRAWINGS ---
  async getLatestDrawing(roomId: string): Promise<{ success: boolean; drawing: any; activeStrokes: Stroke[] }> {
    return this.request(`/api/drawings/${roomId}`);
  }

  async saveDrawing(roomId: string, strokes: Stroke[], customSnapshotUrl?: string) {
    return this.request(`/api/drawings/${roomId}`, {
      method: 'POST',
      body: JSON.stringify({ strokes, customSnapshotUrl }),
    });
  }

  async getDrawingHistory(roomId: string, limit = 20) {
    return this.request(`/api/drawings/${roomId}/history?limit=${limit}`);
  }

  async clearCanvas(roomId: string) {
    return this.request(`/api/drawings/${roomId}/clear`, {
      method: 'DELETE',
    });
  }

  // --- WIDGET API ---
  async getWidgetDataForRoom(roomId: string, userId?: string): Promise<{ success: boolean; widget: WidgetPayload }> {
    const q = userId ? `?userId=${userId}` : '';
    return this.request(`/api/widgets/${roomId}${q}`);
  }

  async getWidgetDataForUser(userId: string): Promise<{ success: boolean; widget: WidgetPayload }> {
    return this.request(`/api/widgets/user/${userId}/latest`);
  }

  async saveWidgetPreferences(pref: Partial<WidgetPreference>) {
    return this.request('/api/widgets/preferences', {
      method: 'POST',
      body: JSON.stringify(pref),
    });
  }

  async getWidgetPreferences(userId: string, roomId?: string) {
    const q = roomId ? `?roomId=${roomId}` : '';
    return this.request(`/api/widgets/preferences/${userId}${q}`);
  }
}

export const api = new ApiService();

