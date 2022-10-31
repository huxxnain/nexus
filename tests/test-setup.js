const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

dotenv.config({ path: './config.env' });

const DB = process.env.TEST_DATABASE;

mongoose.promise = global.Promise;

async function removeAllCollections() {
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    await collection.deleteMany();
  }
}

async function dropAllCollections() {
  const collections = Object.keys(mongoose.connection.collections);
  console.log(collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    try {
      await collection.drop();
    } catch (error) {
      // Sometimes this error happens, but you can safely ignore it
      if (error.message === 'ns not found') return;
      // This error occurs when you use it.todo. You can
      // safely ignore this error too
      if (error.message.includes('a background operation is currently running'))
        return;
      console.log(error.message);
    }
  }
}

module.exports = {
  setupDB(databaseName) {
    // Connect to Mongoose
    beforeAll(async () => {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });

    // Cleans up database between each test
    // afterEach(async () => {
    //   await removeAllCollections();
    // });

    // Disconnect Mongoose
    afterAll(async () => {
      await mongoose.disconnect();
      await mongoServer.stop();
    });
  },
};
