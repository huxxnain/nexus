const csv = require('@fast-csv/parse');
const streamifier = require('streamifier');
const multer = require('multer');
const Product = require('../models/productModel');
const Pharmacy = require('../models/pharmcyModel');
const ProductCategory = require('../models/pharmacyProductCategoryModel');
const ProductImage = require('../models/productImageModel');
const Category = require('../models/categoryModel');
const APIFeatures = require('../utils/apiFeatures');
const ProductInventory = require('../models/pharmacyProductInventoryModel');
const mongoose = require('mongoose');
const fs = require('fs');
const QRYM_DRUG_PRODUCT = require('../models/qrymDrugProductModel');

fs.readFile('dev-data/DPD_DATABASE/drug.txt', function (err, f) {
  // var array = f.toString().split(',').trim();
  const buffer = f;
  const dataFromRows = [];

  streamifier
    .createReadStream(buffer)
    .pipe(csv.parse({ headers: false, ignoreEmpty: false })) // <== this is @fast-csv/parse!!
    .on('data', (row) => {
      dataFromRows.push(row);
    })
    .on('end', async (rowCount) => {
      try {
        for (let i = 0; i < dataFromRows.length; i++) {
          for (
            let j = dataFromRows[i].length - 1;
            j < dataFromRows[i].length;
            j++
          ) {
            console.log(dataFromRows[i]);
            (async () => {
              await QRYM_DRUG_PRODUCT.create({
                _id: dataFromRows[i][0],
                DRUG_CODE: dataFromRows[i][0],
                PRODUCT_CATEGORIZATION: dataFromRows[i][1],
                CLASS: dataFromRows[i][2],
                DRUG_IDENTIFICATION_NUMBER: dataFromRows[i][3],
                BRAND_NAME: dataFromRows[i][4],
                DESCRIPTOR: dataFromRows[i][5],
                ADDRESS_BILLING_FLAG: dataFromRows[i][6],
                PEDIATRIC_FLAG: dataFromRows[i][7],
                NUMBER_OF_AIS: dataFromRows[i][8],
                LAST_UPDATE_DATE: dataFromRows[i][9],
                AI_GROUP_NO: dataFromRows[i][10],
                CLASS_F: dataFromRows[i][11],
                BRAND_NAME_F: dataFromRows[i][12],
                DESCRIPTOR_F: dataFromRows[i][13],
              });
            })();
          }
        }
        res.status(400).json({ success: true });
      } catch (error) {
        res.status(400).json({ error });
      }
    });
});
