import axios from 'axios';

describe('Tracking Service', () => {
  it('GET /api should return a message', async () => {
    const res = await axios.get(`/api`);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });

  it('POST /api/tracking/events should create a tracking event', async () => {
    const payload = {
      parcelId: 'parcel-123',
      status: 'in_transit',
      location: 'New York',
      description: 'Package arrived at hub',
    };

    const res = await axios.post(`/api/tracking/events`, payload);

    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.parcelId).toBe(payload.parcelId);
    expect(res.data.status).toBe(payload.status);
    expect(res.data.timestamp).toBeDefined();
  });
});

