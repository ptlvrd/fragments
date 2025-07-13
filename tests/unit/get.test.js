const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });
  
  test('authenticated user gets expanded metadata with ?expand=1', async () => {
  // First, create a fragment so that we have something to fetch
  await request(app)
    .post('/v1/fragments')
    .auth('user1@email.com', 'password1')
    .set('Content-Type', 'text/plain')
    .send('test content');

  const res = await request(app)
    .get('/v1/fragments?expand=1')
    .auth('user1@email.com', 'password1');

  expect(res.statusCode).toBe(200);
  expect(res.body.status).toBe('ok');
  expect(Array.isArray(res.body.fragments)).toBe(true);

  // Expect object format (not just string IDs)
  if (res.body.fragments.length > 0) {
    const fragment = res.body.fragments[0];
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('type');
    expect(fragment).toHaveProperty('size');
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
  }
  });

  
});
