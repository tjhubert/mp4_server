// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var TaskSchema = new mongoose.Schema({
  name: String,
  description: String,
  deadline: Date,
  completed: {type : Boolean, default : false},
  assignedUser: {type : String, default : ""},
  assignedUserName: {type : String, default : "unassigned"},
  dateCreated: { type : Date, default : Date.now }
});

TaskSchema.path('name').required(true, 'task name cannot be blank');
TaskSchema.path('deadline').required(true, 'task deadline cannot be blank');

// Export the Mongoose model
module.exports = mongoose.model('Task', TaskSchema);
