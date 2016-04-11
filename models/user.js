// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var UserSchema   = new mongoose.Schema({
  name: String,
  email: String,
  pendingTasks: [{type: String}],
  dateCreated: { type : Date, default : Date.now }
});

UserSchema.path('name').required(true, 'User name cannot be blank');
UserSchema.path('email').required(true, 'User email cannot be blank');

UserSchema.path('email').validate(function (email, fn) {
  const User = mongoose.model('User');

  // Check only when it is a new user or when email field is modified
  if (this.isNew || this.isModified('email')) {
    User.find({ email: email }).exec(function (err, users) {
      fn(!err && users.length === 0);
    });
  } else fn(true);
}, 'Email already exists');

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
