require('dotenv').config();

module.exports = {
  stage: process.env.STAGE || 'dev',
  region: process.env.AWS_REGION || 'ap-southeast-1',
  paymentsTable: process.env.PAYMENTS_TABLE || 'payment-gayathri'
};
