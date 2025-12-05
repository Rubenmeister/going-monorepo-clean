import axios from 'axios';

describe('Transport Service E2E', () => {
  it('should request a trip', async () => {
    const tripData = {
      driverId: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
      vehicleType: 'SUV',
      mode: 'DOOR_TO_DOOR',
      originCity: 'New York',
      originAddress: '123 Start St',
      destCity: 'Boston',
      destAddress: '456 End St',
      departureTime: new Date().toISOString(),
      basePrice: 100,
      currency: 'USD',
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
