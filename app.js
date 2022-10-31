const path = require('path');
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const cors = require('cors');
const AppError = require('./utils/appError');
const bodyparser = require('body-parser');
const globalErrorHandler = require('./controllers/errorController');
const adminAuthRouter = require('./routes/adminAuthRoutes');
const adminPharmacyRouter = require('./routes/adminPharmacyRoutes');
const adminCategoryRouter = require('./routes/adminCategoryRoutes');
const pharmacyProductCategoryRouter = require('./routes/pharmacyProductCategoryRoutes');
const adminProductCategoryRouter = require('./routes/adminProductCategoryRoutes');
const pharmacyAuthRouter = require('./routes/pharmcyAuthRoutes');
const pharmacyProductRouter = require('./routes/pharmacyProductRoutes');
const productRouter = require('./routes/productRoutes');
const cartRouter = require('./routes/cartRoutes');
const pharmacyOrderRouter = require('./routes/pharmacyOrderRoutes');
const adminOrderRouter = require('./routes/adminOrderRoutes');
const socketServer = require('./socketServer');
const stripe = require('stripe')(
  'sk_test_51K8MAIDn9TkGm5IKUa29vUoHp7IAIed02s4lkGi644W4PKO9TbFs0jSGdWeDSvzjj45WY3iQ9olyBnz16uL1o3bR002Gtfl3cV'
);
const app = express();
const server = http.createServer(app);

socketServer.registerSocketServer(server);

app.use(cors());
app.options('*', cors());
if (process.env.NODE_ENV == 'development') {
  app.use(morgan('dev'));
}
app.use(express.static(`${__dirname}/public`));
app.use(cors());
app.use(bodyparser.json());
app.use(
  bodyparser.urlencoded({
    extended: true,
  })
);

app.get('/', (req, res) => {
  res.status(200).send('Hello from server');
});
const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  return 1400;
};

app.post('/create-payment-intent', async (req, res) => {
  const { items } = req.body;

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: 'usd',
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});

app.use('/api/v1/products', productRouter);
app.use('/api/v1/admin/auth', adminAuthRouter);
app.use('/api/v1/admin/orders', adminOrderRouter);
app.use('/api/v1/admin/product_category', adminProductCategoryRouter);
app.use('/api/v1/pharmacy/cart', cartRouter);
app.use('/api/v1/admin/pharmacy', adminPharmacyRouter);
app.use('/api/v1/admin/category', adminCategoryRouter);
app.use('/api/v1/pharmacy/auth', pharmacyAuthRouter);
app.use('/api/v1/pharmacy/product', pharmacyProductRouter);
app.use('/api/v1/pharmacy/product_category', pharmacyProductCategoryRouter);
app.use('/api/v1/pharmacy/orders', pharmacyOrderRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = server;
