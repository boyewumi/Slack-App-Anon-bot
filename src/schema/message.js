var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
  team_id: String,
  sender_id: String,
  message_timestamp: Number,
  message_body: String,
  channel_id: String,
});

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;
