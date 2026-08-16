require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  ADMIN_IDS: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(Number) : [],
  
  MODERATION: {
    FLOOD_WINDOW: 10,
    FLOOD_MAX_MSGS: 5,
    TOXIC_THRESHOLD: 0.7,
    MAX_WARNS: 3,
    BAN_THRESHOLD: 5,
    AUTO_DELETE: true,
    DELETE_DELAY: 5000,
  }
};