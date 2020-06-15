const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  workspace_id: String,
  user_id: String,
  is_admin: Boolean,
  is_banned: Boolean,
});

module.exports = mongoose.model('User', userSchema);
