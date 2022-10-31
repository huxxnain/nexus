const fs = require('fs');
const columns = require('./defaultDatabaseColumns');
const mongoose = require('mongoose');
const QRYM_DRUG_PRODUCT = require('./models/qrymDrugProductModel');
const ProductCategory = require('./models/pharmacyProductCategoryModel');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE;

function readFromFile(file, cols) {
  return new Promise((resolve, reject) => {
    fs.readFile(`dev-data/DPD_DATABASE/${file}`, (err, data) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        let array = data.toString().split('\n');

        let dataWithHeaders = array.map((el, index) => {
          console.log(array[index]);
          let str = array[index].replace('\r', '').replace('\n', '');
          str = str.replace(/['"]+/g, '');
          let data = str?.split(',');
          let obj = {};
          for (let i = 0; i < cols.length; i++) {
            obj[cols[i]] = data[i];
          }
          return {
            ...obj,
          };
        });

        // let
        resolve(dataWithHeaders);
      }
    });
  });
}

const seedDB = async () => {
  try {
    const promises = [
      readFromFile('drug.txt', columns.drug),
      readFromFile('comp.txt', columns.comp),
      readFromFile('form.txt', columns.form),
      readFromFile('ingred.txt', columns.ingred),
      readFromFile('route.txt', columns.route),
      readFromFile('status.txt', columns.status),
      readFromFile('pharm.txt', columns.pharm),
      readFromFile('package.txt', columns.package),
      /////////////////////////////////////////////////

      //   readFromFile('ther.txt', columns.ther),
      //   readFromFile('vet.txt', columns.vet),
      //   readFromFile('schedule.txt', columns.schedule),
      // ETC ...
    ];

    const results = await Promise.all(promises);
    const drugs = results[0];
    const companies = results[1];
    const form = results[2];
    const ingredients = results[3];
    const route = results[4];
    const status = results[5];
    const pharm = results[6];
    const package = results[7];

    let data = drugs.map((el) => {
      console.log('....loading');
      return {
        ...el,
        // status: JSON.stringify(
        //   status.filter((item) => item.DRUG_CODE == el.DRUG_CODE)
        // ),
        // ingredients: JSON.stringify(
        //   ingredients.filter((item) => item.DRUG_CODE == el.DRUG_CODE)
        // ),
        // form: JSON.stringify(
        //   form.filter((item) => item.DRUG_CODE == el.DRUG_CODE)
        // ),
        // companies: JSON.stringify(
        //   companies.filter((item) => item.DRUG_CODE == el.DRUG_CODE)
        // ),
        // package: JSON.stringify(
        //   package.filter((item) => item.DRUG_CODE == el.DRUG_CODE)
        // ),
        // route: JSON.stringify(
        //   route.filter((item) => item.DRUG_CODE == el.DRUG_CODE)
        status: status.filter((item) => item.DRUG_CODE == el.DRUG_CODE),
        ingredients: ingredients.filter(
          (item) => item.DRUG_CODE == el.DRUG_CODE
        ),

        form: form.filter((item) => item.DRUG_CODE == el.DRUG_CODE),
        companies: companies.filter((item) => item.DRUG_CODE == el.DRUG_CODE),
        package: package.filter((item) => item.DRUG_CODE == el.DRUG_CODE),

        route: route.filter((item) => item.DRUG_CODE == el.DRUG_CODE),
      };
    });

    data = data.map((el) => {
      return {
        ...el,
        status: el?.status?.sort(
          (a, b) => new Date(b.STATUS).getTime() - new Date(a.STATUS).getTime()
        ),
      };
    });

    await QRYM_DRUG_PRODUCT.deleteMany({});
    // await ProductCategory.deleteMany({});

    // for (let i = 0; i < data.length; i++) {
    //   console.log(data[i].PRODUCT_CATEGORIZATION);
    //   if (data[i].PRODUCT_CATEGORIZATION) {
    //     let product_category = await ProductCategory.findOne({
    //       title: data[i].PRODUCT_CATEGORIZATION,
    //     });

    //     if (!product_category) {
    //       product_category = await ProductCategory.create({
    //         title: data[i].PRODUCT_CATEGORIZATION,
    //       });
    //     }
    //   } else if (data[i].PRODUCT_CATEGORIZATION == '') {
    //     let product_category = await ProductCategory.findOne({
    //       title: 'other',
    //     });

    //     if (!product_category) {
    //       product_category = await ProductCategory.create({
    //         title: 'other',
    //       });
    //     }
    //   }
    // }
    await QRYM_DRUG_PRODUCT.insertMany(data);
  } catch (err) {
    console.log(err.message);
  }
};

mongoose
  .connect(DB)
  .then(() =>
    seedDB().then(() => {
      console.log('created');
      mongoose.connection.close();
    })
  )
  .catch((err) => console.log(err));
