const request = require('supertest');
const app = require('../../src/app');
const base64 = require('base-64');

const user = 'user1@email.com';
const pass = 'password1';
const credentials = base64.encode(`${user}:${pass}`);
const authHeader = `Basic ${credentials}`;

describe('GET /v1/fragments/:id/info', () => {
  test('authenticated user can get metadata for a fragment', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Authorization', authHeader)
      .set('Content-Type', 'text/plain')
      .send('testing info');

    const id = postRes.body.fragment.id;

    const infoRes = await request(app)
      .get(`/v1/fragments/${id}/info`)
      .set('Authorization', authHeader);

    expect(infoRes.statusCode).toBe(200);
    expect(infoRes.body.fragment).toHaveProperty('id', id);
    expect(infoRes.body.fragment).toHaveProperty('type', 'text/plain');
  });
});
