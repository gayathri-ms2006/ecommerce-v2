require('dotenv').config();

module.exports = {
  stage: process.env.STAGE || 'dev',
  region: process.env.AWS_REGION || 'ap-southeast-1',
  wishlistTable: process.env.WISHLIST_TABLE || 'wishlist'
};
