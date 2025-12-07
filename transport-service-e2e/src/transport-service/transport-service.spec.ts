import axios from 'axios';

describe('Transport Service E2E', () => {
  it('should request a trip', async () => {
    const tripData = {
      userId: '123e4567-e89b-12d3-a456-426614174001', // Mock user UUID
      driverId: '123e4567-e89b-12d3-a456-426614174000', // Optional driver UUID
      vehicleType: 'SUV',
      mode: 'DOOR_TO_DOOR',
      departureTime: new Date().toISOString(),
      origin: {
        city: 'New York',
        address: '123 Start St',
        latitude: 40.7128,
        longitude: -74.0060,
      },
      destination: {
        city: 'Boston',
        address: '456 End St',
        latitude: 42.3601,
        longitude: -71.0589,
      },
      price: {
        amount: 100,
        currency: 'USD',
      },
    };

    try {
      const res = await axios.post(`/api/transport/request`, tripData);
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
    } catch (error) {
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  });
});
