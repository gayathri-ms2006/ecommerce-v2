require('dotenv').config();

module.exports = {
  stage: process.env.STAGE || 'dev',
  region: process.env.AWS_REGION || 'us-east-1',
  ordersTable: process.env.ORDERS_TABLE || 'order-gayathri'
};
