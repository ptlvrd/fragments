const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id', () => {
  test('unauthenticated requests are rejected', async () => {
    const res = await request(app)
      .put('/v1/fragments/test-id')
      .set('Content-Type', 'text/plain')
      .send('test data');
    
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(401);
  });

  test('authenticated requests can update existing fragments', async () => {
    // First create a fragment
    const createRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('original content');
    
    expect(createRes.status).toBe(201);
    const fragmentId = createRes.body.fragment.id;

    // Then update it
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('updated content');
    
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('ok');
    expect(updateRes.body.fragment.id).toBe(fragmentId);
    expect(updateRes.body.fragment.type).toBe('text/plain');
    expect(updateRes.body.fragment.size).toBe(15); // "updated content".length
  });

  test('updating non-existent fragment returns 404', async () => {
    const res = await request(app)
      .put('/v1/fragments/non-existent-id')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('test data');
    
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });

  test('updating with wrong Content-Type returns 400', async () => {
    // First create a text fragment
    const createRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('original content');
    
    expect(createRes.status).toBe(201);
    const fragmentId = createRes.body.fragment.id;

    // Then try to update with wrong Content-Type
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('{"test": "data"}');
    
    expect(updateRes.status).toBe(400);
    expect(updateRes.body.status).toBe('error');
    expect(updateRes.body.error.code).toBe(400);
    expect(updateRes.body.error.message).toContain('Content-Type mismatch');
  });

  test('updating with no body returns 400', async () => {
    // First create a fragment
    const createRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('original content');
    
    expect(createRes.status).toBe(201);
    const fragmentId = createRes.body.fragment.id;

    // Then try to update with no body
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain');
    
    // When no body is sent, the raw body parser doesn't parse it as a Buffer
    // so req.body is an empty object {}, not a Buffer
    expect(updateRes.status).toBe(400);
    expect(updateRes.body.status).toBe('error');
    expect(updateRes.body.error.code).toBe(400);
    expect(updateRes.body.error.message).toBe('No valid body provided');
  });

  test('updating JSON fragment works correctly', async () => {
    // First create a JSON fragment
    const createRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('{"name": "original"}');
    
    expect(createRes.status).toBe(201);
    const fragmentId = createRes.body.fragment.id;

    // Then update it
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('{"name": "updated", "value": 123}');
    
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('ok');
    expect(updateRes.body.fragment.type).toBe('application/json');
    expect(updateRes.body.fragment.size).toBe(33); // '{"name": "updated", "value": 123}'.length
  });

  test('updating markdown fragment works correctly', async () => {
    // First create a markdown fragment
    const createRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Original Header');
    
    expect(createRes.status).toBe(201);
    const fragmentId = createRes.body.fragment.id;

    // Then update it
    const updateRes = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Updated Header\n\nNew content');
    
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.status).toBe('ok');
    expect(updateRes.body.fragment.type).toBe('text/markdown');
    expect(updateRes.body.fragment.size).toBe(29); // '# Updated Header\n\nNew content'.length
  });
}); 