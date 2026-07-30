require('dotenv').config();

module.exports = {
  stage: process.env.STAGE || 'dev',
  region: process.env.AWS_REGION || 'ap-southeast-1',
  inventoryTable: process.env.INVENTORY_TABLE || 'inventory-gayathri'
};
