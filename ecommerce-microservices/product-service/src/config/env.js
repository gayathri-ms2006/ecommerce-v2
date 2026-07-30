require('dotenv').config();

module.exports = {
  stage: process.env.STAGE || 'dev',
  region: process.env.AWS_REGION || 'ap-southeast-1',
  productsTable: process.env.PRODUCTS_TABLE || 'product-service-products-dev'
};
