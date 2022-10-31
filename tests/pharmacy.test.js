const { setupDB } = require('./test-setup');
const request = require('supertest');
const app = require('../app');

setupDB();
let category = {
  title: 'Buy',
};

let admin = {
  email: 'huxxnaain@mailinator.com',
  password: '123456789',
  passwordConfirm: '123456789',
  first_name: 'Hussnain',
  last_name: 'Hussnain',
  address: 'Hussnain',
  phone_number: '009242343423',
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
let inventory = {};
let product = {
  product_name: 'Via',
  drug_Indentification_number: '123456789s',
  brand: '123456789',
  sub_brand: 'mongoose',
  form: 'solid',
  size: '250ml',
  price: 'Free',
  category_name: 'Buy',
  product_category_name: 'Via Aldo Manuzio, 66b, 00153 Roma RM, Italy',
  pharmacy_id: '63289d7ce66743e94251846d',
  fullfillment: 'I will ship',
  payment: 'cash',
  quantity: '100',
  expiry_date: '2002/11/22',
};

let image = {
  image: {
    full_image: 'testjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj',
  },
};
describe('Pharmacy tests', () => {
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
    product.pharmacy_id = loginRes.body.data._id;

    const adminSignupRes = await request(app)
      .post('/api/v1/admin/auth/signup')
      .send({ ...admin });

    const adminRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ email: admin.email, password: admin.password });
    admin = adminRes.body.data;

    const categoryRes = await request(app)
      .post('/api/v1/admin/category')
      .send({ ...category })
      .set('Authorization', `Bearer ${admin.token}`);

    category = categoryRes.body.data;
    product.category_name = category.title;
  });

  test('Should give 400 error', async () => {
    const res = await request(app)
      .post('/api/v1/pharmacy/auth/verifyOTP')
      .send({ pharmacyId: pharmacy._id, otp: '4555' });
    expect(res.statusCode).toEqual(400);
  });

  test('Should resend verify otp code', async () => {
    const res = await request(app)
      .post('/api/v1/pharmacy/auth/resendOTPVerificationCode')
      .send({ pharmacyId: pharmacy._id, email: pharmacy.email });
    expect(res.statusCode).toEqual(400);
  });

  test('Should forgot password email', async () => {
    const res = await request(app)
      .post('/api/v1/pharmacy/auth/forgotPassword')
      .send({ email: pharmacy.email });
    expect(res.statusCode).toEqual(500);
  });

  test('Should save product in database', async () => {
    const res = await request(app)
      .post('/api/v1/pharmacy/product')
      .send({ ...product })
      .set('Authorization', `Bearer ${pharmacy.token}`);
    product = res.body.data;
    expect(res.statusCode).toEqual(200);
  });

  test('Should get single product detail', async () => {
    const res = await request(app)
      .get(`/api/v1/pharmacy/product/${product._id}`)
      .set('Authorization', `Bearer ${pharmacy.token}`);

    expect(res.statusCode).toEqual(200);
  });

  test('Should get all  products by pharmacy ID', async () => {
    const res = await request(app)
      .get(`/api/v1/pharmacy/product/pharmacy/${pharmacy._id}`)
      .set('Authorization', `Bearer ${pharmacy.token}`);

    expect(res.statusCode).toEqual(200);
  });

  test('Should add image to product', async () => {
    const res = await request(app)
      .patch(`/api/v1/pharmacy/product/${product._id}/image`)
      .send({ ...image })
      .set('Authorization', `Bearer ${pharmacy.token}`);
    image = res.body.data;
    expect(res.statusCode).toEqual(200);
  });

  test('Should delete image to product', async () => {
    const res = await request(app)
      .delete(`/api/v1/pharmacy/product/image/${image._id}`)
      .set('Authorization', `Bearer ${pharmacy.token}`);
    image = res.body.data;
    expect(res.statusCode).toEqual(200);
  });

  test('Add product inventory', async () => {
    const res = await request(app)
      .post(`/api/v1/pharmacy/product/createInventory`)
      .send({
        pharmacy_id: pharmacy._id,
        product_id: product._id,
        expiry_date: new Date(),
        quantity: 100,
      })
      .set('Authorization', `Bearer ${pharmacy.token}`);
    inventory = res.body.data;
    expect(res.statusCode).toEqual(200);
  });

  test('Should get product inventory detail', async () => {
    const res = await request(app)
      .get(`/api/v1/pharmacy/product/inventory/${inventory._id}`)
      .set('Authorization', `Bearer ${pharmacy.token}`);

    expect(res.statusCode).toEqual(200);
  });

  test('Should get all inventories of products', async () => {
    const res = await request(app)
      .get(`/api/v1/pharmacy/product/${product._id}/inventory`)
      .set('Authorization', `Bearer ${pharmacy.token}`);

    expect(res.statusCode).toEqual(200);
  });

  test('Should delete product inventory', async () => {
    const res = await request(app)
      .delete(`/api/v1/pharmacy/product/inventory/${inventory._id}`)
      .set('Authorization', `Bearer ${pharmacy.token}`);
    expect(res.statusCode).toEqual(200);
  });

  test('Should delete product', async () => {
    const res = await request(app)
      .delete(`/api/v1/pharmacy/product/${product._id}`)
      .set('Authorization', `Bearer ${pharmacy.token}`);
    expect(res.statusCode).toEqual(200);
  });
});
