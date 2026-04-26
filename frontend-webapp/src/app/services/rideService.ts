// Ride API Service - connects to Transport microservice
import { authFetch } from '@/lib/providers/auth-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export interface CreateRideRequest {
  pickupLocation: { lat: number; lng: number; address: string }
  dropoffLocation: { lat: number; lng: number; address: string }
  rideType: 'economy' | 'comfort' | 'premium'
  paymentMethod: string
}

export interface RideEstimate {
  distance: number
  duration: number
  estimatedFare: number
  surgeMultiplier: number
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export const rideService = {
  async getEstimate(pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }): Promise<RideEstimate> {
    const res = await authFetch(`${API_BASE}/transport/estimate`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ pickup, dropoff }),
    })
    if (!res.ok) throw new Error('Failed to get ride estimate')
    return res.json()
  },

  async createRide(data: CreateRideRequest) {
    const res = await authFetch(`${API_BASE}/transport/rides`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create ride')
    return res.json()
  },

  async getRide(rideId: string) {
    const res = await authFetch(`${API_BASE}/transport/rides/${rideId}`)
    if (!res.ok) throw new Error('Failed to get ride')
    return res.json()
  },

  async cancelRide(rideId: string, reason?: string) {
    const res = await authFetch(`${API_BASE}/transport/rides/${rideId}/cancel`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ reason }),
    })
    if (!res.ok) throw new Error('Failed to cancel ride')
    return res.json()
  },

  async getRideHistory(page = 1, limit = 10) {
    const res = await authFetch(`${API_BASE}/transport/rides?page=${page}&limit=${limit}`)
    if (!res.ok) throw new Error('Failed to get ride history')
    return res.json()
  },

  async trackDriver(rideId: string) {
    const res = await authFetch(`${API_BASE}/tracking/rides/${rideId}/location`)
    if (!res.ok) throw new Error('Failed to get driver location')
    return res.json()
  },
}

export const paymentService = {
  async processPayment(rideId: string, method: string, amount: number) {
    const res = await authFetch(`${API_BASE}/payment/process`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ rideId, method, amount }),
    })
    if (!res.ok) throw new Error('Payment failed')
    return res.json()
  },

  async getPaymentHistory(page = 1, limit = 10) {
    const res = await authFetch(`${API_BASE}/payment/history?page=${page}&limit=${limit}`)
    if (!res.ok) throw new Error('Failed to get payment history')
    return res.json()
  },

  async addPaymentMethod(data: { type: string; token: string }) {
    const res = await authFetch(`${API_BASE}/payment/methods`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to add payment method')
    return res.json()
  },
}

export const ratingService = {
  async submitRating(data: {
    rideId: string
    driverId: string
    stars: number
    review?: string
    categories?: Record<string, number>
  }) {
    const res = await authFetch(`${API_BASE}/ratings`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to submit rating')
    return res.json()
  },

  async getDriverRatings(driverId: string) {
    const res = await authFetch(`${API_BASE}/ratings/driver/${driverId}`)
    if (!res.ok) throw new Error('Failed to get driver ratings')
    return res.json()
  },
}
