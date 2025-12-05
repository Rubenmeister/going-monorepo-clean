import axios from 'axios';

describe('Tours Service E2E', () => {
  it('should create a tour', async () => {
    const tourData = {
      hostId: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
      title: 'Amazing City Tour',
      description: 'A wonderful tour of the city',
      pricePerPerson: 50,
      currency: 'USD',
      maxCapacity: 10,
      durationHours: 3,
      location: 'New York',
      meetingPoint: 'Central Park',
    };

    try {
      const res = await axios.post(`/api/tours`, tourData);
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
