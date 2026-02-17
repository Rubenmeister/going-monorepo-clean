import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 10000,
    });

    // Add token to requests
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  // Booking endpoints
  async createBooking(data: any) {
    const response = await this.client.post('/bookings', data);
    return response.data;
  }

  async getBookingsByUser(userId: string) {
    const response = await this.client.get(`/bookings/user/${userId}`);
    return response.data;
  }

  // Search endpoints
  async searchTours(filters: any) {
    const params = new URLSearchParams(filters).toString();
    const response = await this.client.get(`/tours/search?${params}`);
    return response.data;
  }

  async searchExperiences(filters: any) {
    const params = new URLSearchParams(filters).toString();
    const response = await this.client.get(`/experiences/search?${params}`);
    return response.data;
  }

  // Tracking
  async getActiveDrivers() {
    const response = await this.client.get('/tracking/active-drivers');
    return response.data;
  }

  async broadcastLocation(data: any) {
    const response = await this.client.post('/tracking/location', data);
    return response.data;
  }
}

export const apiClient = new ApiClient();
