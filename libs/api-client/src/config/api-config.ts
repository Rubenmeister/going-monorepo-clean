export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  retryAttempts: 3,
};

export const ENDPOINTS = {
  rides: '/api/rides',
  bookings: '/api/bookings',
  users: '/api/users',
  payments: '/api/payments',
};
