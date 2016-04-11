// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var TaskSchema = new mongoose.Schema({
  name: String,
  description: String,
  deadline: Date,
  completed: Boolean,
  assignedUser: {type : String, default : ""},
  assignedUserName: {type : String, default : "unassigned"},
  dateCreated: { type : Date, default : Date.now }
});

TaskSchema.path('name').required(true, 'Task name cannot be blank');
TaskSchema.path('deadline').required(true, 'Task deadline cannot be blank');

// Export the Mongoose model
module.exports = mongoose.model('Task', TaskSchema);
