const { setupDB } = require('./test-setup');
const request = require('supertest');
const app = require('../app');

setupDB();
let user = {
  email: 'huxxnaain@mailinator.com',
  password: '123456789',
  passwordConfirm: '123456789',
  first_name: 'Hussnain',
  last_name: 'Hussnain',
  address: 'Hussnain',
  phone_number: '009242343423',
};

describe('Admin Auth  tests', () => {
  test('Should save admin to database', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/signup')
      .send({ ...user });

    expect(res.statusCode).toEqual(201);
  });
  test('admin should  login', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: user.email, password: user.password });
    user = res.body.data;
    expect(res.statusCode).toEqual(200);
  });

  test('admin should  not login', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: user.email, password: 'sssssss' });

    expect(res.statusCode).toEqual(401);
  });

  test('Should give pharmacy not found error', async () => {
    const res = await request(app)
      .get('/api/v1/admin/pharmacy')
      .set('Authorization', `Bearer ${user.token}`);
    expect(res.statusCode).toEqual(200);
  });
});
