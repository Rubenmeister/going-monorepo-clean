import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://api.goingec.com';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(async (config) => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401)
          SecureStore.deleteItemAsync('authToken');
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    roles: string[];
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  // Bookings
  async getMyBookings(userId: string) {
    const response = await this.client.get(`/bookings/user/${userId}`);
    return response.data;
  }

  async createBooking(data: any) {
    const response = await this.client.post('/bookings', data);
    return response.data;
  }

  // Search
  async searchTours(query: string) {
    const response = await this.client.get(
      `/tours/search?query=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  async searchExperiences(query: string) {
    const response = await this.client.get(
      `/experiences/search?query=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  async searchAccommodations(query: string) {
    const response = await this.client.get(
      `/accommodations/search?query=${encodeURIComponent(query)}`
    );
    return response.data;
  }

  // Transport
  async requestTrip(data: {
    pickupLocation: any;
    dropoffLocation: any;
    serviceType: string;
  }) {
    const response = await this.client.post('/transport/request', data);
    return response.data;
  }

  // Tracking
  async getActiveDrivers() {
    const response = await this.client.get('/tracking/active-drivers');
    return response.data;
  }

  async broadcastLocation(data: {
    driverId: string;
    latitude: number;
    longitude: number;
  }) {
    const response = await this.client.post('/tracking/location', data);
    return response.data;
  }

  // Notifications
  async getMyNotifications(userId: string) {
    const response = await this.client.get(`/notifications/user/${userId}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
