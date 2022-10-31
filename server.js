const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const port = process.env.PORT || 8000;
const app = require('./app');

const DB = process.env.DATABASE;
let serverInstance = null;
mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful!'))
  .catch((err) => console.log(err));
serverInstance = app.listen(port, () => {
  console.log('App running on port 8000');
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  app.close(() => {
    process.exist(1);
  });
});

process.on('unhandledException', (err) => {
  console.log(err.name, err.message);
  app.close(() => {
    process.exist(1);
  });
});

module.exports = serverInstance;
