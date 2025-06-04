const request = require('supertest');
const app = require('../../src/app');
const base64 = require('base-64');

const user = 'user1@email.com';
const pass = 'password1';
const credentials = base64.encode(`${user}:${pass}`);
const authHeader = `Basic ${credentials}`;

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', async () => {
    const res = await request(app).post('/v1/fragments');
    expect(res.statusCode).toBe(401);
  });

  test('unsupported content type returns 415', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set('Authorization', authHeader)
      .set('Content-Type', 'application/msword')
      .send('Fake data');

    expect(res.statusCode).toBe(415);
  });

  test('authenticated user can post text/plain fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set('Authorization', authHeader)
      .set('Content-Type', 'text/plain')
      .send('hello world');

    expect(res.statusCode).toBe(201);
    expect(res.headers.location).toMatch(/\/v1\/fragments\/.+/);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.size).toBe(11);
    expect(res.body.fragment.ownerId).toBe(user);
  });
});
