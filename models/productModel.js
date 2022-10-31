const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    product_name: {
      type: String,
      required: [true, 'Title is required filed!'],
      index: true,
    },
    sku: {
      type: String,
    },
    uuid: {
      type: String,
    },
    description: {
      type: String,
      required: [true, 'Description  is required filed!'],
      index: true,
    },

    brand: {
      type: String,
      index: true,
    },

    sub_brand: {
      type: String,
      index: true,
    },

    imageCover: {
      thumbnail: {
        type: String,
      },
      public_id: {
        type: String,
      },
      full_image: {
        type: String,
        required: true,
      },
    },

    images: [
      {
        thumbnail: {
          type: String,
        },
        public_id: {
          type: String,
        },
        full_image: {
          type: String,
          required: true,
        },
      },
    ],

    size: {
      type: String,
    },

    // price: {
    //   type: String,
    //   index: true,
    //   required: [true, 'Price  is required filed!'],
    // },

    // category_id: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: 'Category',
    //   required: [true, 'Product must belong to a category'],
    //   index: true,
    // },

    product_category: {
      type: mongoose.Schema.ObjectId,
      ref: 'ProductCategory',
      required: [true, 'Product Category must belong to a category'],
      index: true,
    },

    pharmacy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Pharmacy',
      required: [true, 'Product  must belong to a pharmacy'],
      index: true,
    },

    // payment: {
    //   type: String,
    // },

    // fullfillment: {
    //   type: String,
    // },

    DRUG_CODE: {
      type: Number,

      index: true,
    },

    PRODUCT_CATEGORIZATION: {
      type: String,
      max: 80,
    },
    CLASS: {
      type: String,
      max: 40,
    },
    DRUG_IDENTIFICATION_NUMBER: {
      type: String,
      max: 29,
      index: true,
    },
    BRAND_NAME: {
      type: String,
      max: 200,
      index: true,
    },
    DESCRIPTOR: {
      type: String,
      max: 150,
    },
    ADDRESS_BILLING_FLAG: {
      type: String,
      max: 1,
    },
    PEDIATRIC_FLAG: {
      type: String,
      max: 1,
    },
    PRODUCT_FORM: {
      type: String,
      max: 200,
      required: [true, 'Product type is required field'],
    },
    PACKAGING_SIZE: {
      type: String,
      max: 200,
      required: [true, 'PACAKAGING_SIZE size is required field'],
    },
    PEDIATRIC_FLAG: {
      type: String,
      max: 5,
    },
    NUMBER_OF_AIS: {
      type: String,
      max: 10,
    },
    LAST_UPDATE_DATE: {
      type: String,
    },

    AI_GROUP_NO: {
      type: String,
      max: 10,
    },
    CLASS_F: {
      type: String,
      max: 80,
    },
    BRAND_NAME_F: {
      type: String,
      max: 300,
    },
    DESCRIPTOR_F: {
      type: String,
      max: 200,
    },
    status: {
      type: Array,
      default: [],
    },

    ingredients: {
      type: Array,
      default: [],
    },
    form: {
      type: Array,
      default: [],
    },
    companies: {
      type: Array,
      default: [],
    },
    package: {
      type: Array,
      default: [],
    },
    route: {
      type: Array,
      default: [],
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index(
  { pharmacy: 1, product_name: 1 },
  { unique: true, sparse: true }
);
productSchema.index({ product_name: 'text' });
productSchema.index({ BRAND_NAME: 'text' });
const Product = mongoose.model('Product', productSchema);
module.exports = Product;
