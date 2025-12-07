import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

describe('User Auth Service', () => {
  const email = `test-${uuidv4()}@example.com`;
  const password = 'securePassword123';
  const name = 'Test User';
  const API_URL = '/api'; // Use relative URL, assuming axios configured with baseURL or proxy

  it('POST /auth/register should create a user', async () => {
    const payload = {
      email,
      password,
      name,
      role: 'USER',
    };

    const res = await axios.post(`${API_URL}/auth/register`, payload);

    expect(res.status).toBe(201);
    expect(res.data.accessToken).toBeDefined();
    expect(res.data.user.email).toBe(email);
    expect(res.data.user.name).toBe(name);
  });

  it('POST /auth/login should return valid token', async () => {
    const payload = {
      email,
      password,
    };

    const res = await axios.post(`${API_URL}/auth/login`, payload);

    expect(res.status).toBe(201);
    expect(res.data.accessToken).toBeDefined();
    expect(res.data.user.email).toBe(email);
  });

  it('POST /auth/login should fail with invalid password', async () => {
    const payload = {
      email,
      password: 'wrongPassword',
    };

    try {
      await axios.post(`${API_URL}/auth/login`, payload);
      fail('Should have thrown 401');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });
});