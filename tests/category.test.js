const { setupDB } = require('./test-setup');
const request = require('supertest');
const app = require('../app');

setupDB();
let category = {
  title: 'Vaccinations',
};

let pharmacy = {
  email: 'huxxnaainddd@mailinator008.com',
  password: '123456789',
  passwordConfirm: '123456789',
  pharmacy_name: 'Hussnainss118',
  lat_long: [41.8776847, 12.473844],
  location: 'Via Aldo Manuzio, 66b, 00153 Roma RM, Italy',
  mobile_no: '009242343423',
  postcode: '00153',
  country_code: '+92',
  timeZone: 'Asia/Karachi',
  pharmacy_landline_num: '666-666-66',
  country: 'Italy',
  state: 'Lazio',
  city: 'Roma',
};

describe('Product Category tests', () => {
  var token;
  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/pharmacy/auth/signup')
      .send({
        ...pharmacy,
      });

    const loginRes = await request(app)
      .post('/api/v1/pharmacy/auth/login')

      .send({ email: pharmacy.email, password: pharmacy.password });

    pharmacy = loginRes.body.data;
  });

  test('Should save category to database', async () => {
    const res = await request(app)
      .post('/api/v1/pharmacy/product_category')
      .send({ ...category })
      .set('Authorization', `Bearer ${pharmacy.token}`);
    category = res.body.data;
    expect(res.statusCode).toEqual(200);
  });

  test('Should get all categories', async () => {
    const res = await request(app)
      .get('/api/v1/pharmacy/product_category')
      .set('Authorization', `Bearer ${pharmacy.token}`);

    expect(res.statusCode).toEqual(200);
  });

  test('Should get single category detail', async () => {
    const res = await request(app)
      .get(`/api/v1/pharmacy/product_category/${category._id}`)
      .set('Authorization', `Bearer ${pharmacy.token}`);

    expect(res.statusCode).toEqual(200);
  });

  test('Should update category', async () => {
    const res = await request(app)
      .patch(`/api/v1/pharmacy/product_category/${category._id}`)
      .send({ ...category })
      .set('Authorization', `Bearer ${pharmacy.token}`);
    category = res.body.data;
    expect(res.statusCode).toEqual(200);
  });
});
