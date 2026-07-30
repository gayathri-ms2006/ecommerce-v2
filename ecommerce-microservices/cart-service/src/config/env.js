require('dotenv').config();

module.exports = {
  stage: process.env.STAGE || 'dev',
  region: process.env.AWS_REGION || 'ap-southeast-1',
  cartTable: process.env.CART_TABLE || 'cart-gayathri'
};
