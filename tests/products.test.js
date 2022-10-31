const { setupDB } = require('./test-setup');
const request = require('supertest');
const app = require('../app');

setupDB();

describe('Product tests', () => {
  test('Should come list of all products', async () => {
    const res = await request(app).get('/api/v1/products');

    expect(res.statusCode).toEqual(200);
  });

  test('Should give error not found', async () => {
    const res = await request(app).get(
      '/api/v1/products/632b4f70c7eddb66bc791221'
    );

    expect(res.statusCode).toEqual(404);
  });
});
