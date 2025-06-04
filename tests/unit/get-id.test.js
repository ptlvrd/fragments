const request = require('supertest');
const app = require('../../src/app');
const base64 = require('base-64');

const user = 'user1@email.com';
const pass = 'password1';
const credentials = base64.encode(`${user}:${pass}`);
const authHeader = `Basic ${credentials}`;

describe('GET /v1/fragments/:id', () => {
  let fragmentId;

  beforeAll(async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .set('Authorization', authHeader)
      .set('Content-Type', 'text/plain')
      .send('test fragment');

    fragmentId = postRes.body.fragment.id;
  });

  test('unauthenticated requests are denied', async () => {
    const res = await request(app).get(`/v1/fragments/${fragmentId}`);
    expect(res.statusCode).toBe(401);
  });

  test('returns the raw fragment data if authenticated and owned', async () => {
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .set('Authorization', authHeader);

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('test fragment'); // raw body match
    expect(res.headers['content-type']).toBe('text/plain'); // correct header
  });

  test('returns 404 if fragment not found', async () => {
    const res = await request(app)
      .get(`/v1/fragments/does-not-exist`)
      .set('Authorization', authHeader);

    expect(res.statusCode).toBe(404);
  });
});
