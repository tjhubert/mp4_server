// Get the packages we need
var express = require('express');
var mongoose = require('mongoose');
var User = require('./models/user');
var Task = require('./models/task');
var bodyParser = require('body-parser');
var JSON = require('JSON');
var _ = require('underscore');
var router = express.Router();

//replace this with your Mongolab URL
mongoose.connect('mongodb://tjhubert:mp4starter@ds059694.mlab.com:59694/tjhubert_mp4');

// Create our Express application
var app = express();

// Use environment defined port or 4000
var port = process.env.PORT || 4000;

//Allow CORS so that backend and frontend could pe put on different servers
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
  next();
};
app.use(allowCrossDomain);

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
  extended: true
}));

// All our routes will start with /api
app.use('/api', router);

//Default route here
var homeRoute = router.route('/');

homeRoute.get(function(req, res) {
  res.json({ message: 'Hello World!' });
});


var queryCallback = function (err, data, res) {
        if (err) {
            res.status(500).send({
                'message': err.message,
                'data': []
            });
        } else {
            res.status(200).json({
                'message': 'OK',
                'data': data
            });
        }
    };

//User route
var userRoute = router.route('/users');

/**
 * Gets a list of names of all users
 *
 * @param  req  The request object of the HTTP request
 * @param  res  The response that will be returned to the client
 * @return      The response with the list of users attached
 */
userRoute.get(function (req, res) {
    var queryModel;
    var whereQuery = req.query.where ? JSON.parse(req.query.where) : {};

    if (req.query.count && req.query.count.toLowerCase() === 'true') {
        queryModel = User.count(whereQuery);
    }
    else {
        queryModel = User.find(whereQuery);
    }

    queryModel.
      sort(req.query.sort ? JSON.parse(req.query.sort) : {}).
      limit(req.query.limit).
      select(req.query.select ? JSON.parse(req.query.select) : {}).
      skip(req.query.skip).
      exec(function(err, users) {
        queryCallback(err, users, res);
      });
});

userRoute.post(function (req, res) {
    var newUser = new User(req.body);
    newUser.save(function (err, user) {
        queryCallback(err, user, res);
    });
});

var userIdRoute = router.route('/users/:id');

userIdRoute.get(function (req, res) {
    User.findOne({'_id' : req.params.id}).
        exec(function(err, user) {
            queryCallback(err, user, res);
        })
});

userIdRoute.put(function (req, res) {

    if (req.body.pendingTasks) {
        var userPromise = User.findOne({'_id' : req.params.id}).exec();
        userPromise.then(function (user){
            req.body.pendingTasks = _.isArray(req.body.pendingTasks) ? _.uniq(req.body.pendingTasks) : [req.body.pendingTasks];
            var oldPendingTasks = user.pendingTasks;
            var newPendingTasks = req.body.pendingTasks
            var taskToBeRemoved = _.difference(oldPendingTasks, newPendingTasks);
            var taskToBeAdded = _.difference(newPendingTasks, oldPendingTasks);
            if (taskToBeRemoved.length > 0) {
                Task.update({'_id': { $in: taskToBeRemoved} }, {assignedUser: ''}, {assignedUserName: ''});
            }
            if (taskToBeAdded.length > 0) {
                Task.find({'_id': { $in: taskToBeAdded} }, function(err, tasks) {
                    tasks.forEach(function (task) {
                        User.findOneAndUpdate({'_id' : task.assignedUser}, {$pull: {pendingTasks: task._id}});
                        task.assignedUser = user._id;
                        task.assignedUserName = user.name;
                        task.save();
                    })
                });
            }
            User.update({'_id' : req.params.id}, req.body, function(err, user) {
                queryCallback(err, user, res);
            });
        });
    }
    else {
        User.update({'_id' : req.params.id}, req.body, function(err, user) {
            queryCallback(err, user, res);
        });
    }

});

userIdRoute.delete(function (req, res) {
    User.findOne({'_id' : req.params.id}).
        exec(function(err, user) {
            if (err) {
                res.status(404).send({
                    'message': "User not found",
                    'data': []
                });
            } else {
                if (user.pendingTasks) {
                    Task.update({'_id': { $in: user.pendingTasks} },
                               {assignedUser: ''}, {assignedUserName: ''});
                }
                user.remove();
                res.status(200).send({
                    'message': "User successfully deleted",
                    'data': user
                });
            }
        })
});

//Task route
var taskRoute = router.route('/tasks');

/**
 * Gets a list of names of all tasks
 *
 * @param  req  The request object of the HTTP request
 * @param  res  The response that will be returned to the client
 * @return      The response with the list of tasks attached
 */
taskRoute.get(function (req, res) {
    var queryModel;
    var whereQuery = req.query.where ? JSON.parse(req.query.where) : {};
    
    if (req.query.count && req.query.count.toLowerCase() === 'true') {
        queryModel = Task.count(whereQuery);
    }
    else {
        queryModel = Task.find(whereQuery);
    }

    queryModel.
      limit(req.query.limit).
      sort(req.query.sort ? JSON.parse(req.query.sort) : {}).
      select(req.query.select ? JSON.parse(req.query.select) : {}).
      skip(req.query.skip).
      exec(function(err, users) {
        queryCallback(err, users, res);
      });
});

taskRoute.post(function (req, res) {
    var newTask = new Task(req.body);
    if (newTask.assignedUser) {
        var userPromise = User.findOne({'_id' : newTask.assignedUser}).exec();
        userPromise.then(function (user) {

            if (newTask.assignedUser && !user) {
                queryCallback({'message' : 'User ID not found'}, newTask, res);
            }

            newTask.save(function (err, task) {
                if (err) {
                  queryCallback(err, task, res);
                }
                
                if (task.assignedUser && !task.completed && !_.contains(user.pendingTasks, task._id)) {
                    user.pendingTasks.push(task._id);
                    user.save();
                }
                queryCallback(err, task, res);
            });
        });
    } else {
        newTask.save(function (err, task) {
            queryCallback(err, task, res);
        });
    }

    
    
});

var taskIdRoute = router.route('/tasks/:id');

taskIdRoute.get(function (req, res) {
    Task.findOne({'_id' : req.params.id}).
        exec(function(err, task) {
            queryCallback(err, task, res);
        })
});

taskIdRoute.put(function (req, res) {
    var taskPromise = Task.findOne({'_id' : req.params.id}).exec();

    taskPromise.then(function (task){
        if (task.assignedUser !== req.body.assignedUser && !task.completed) {
            if (task.assignedUser) {
              User.findOneAndUpdate({'_id' : task.assignedUser}, {$pull: {pendingTasks: task._id}});
            }
            if (req.body.assignedUser) {
              User.findOneAndUpdate({'_id' : req.body.assignedUser}, {$push: {pendingTasks: task._id}});
            }
        }

        if (task.completed && req.body.assignedUser) {
            User.findOneAndUpdate({'_id' : req.body.assignedUser}, {$pull: {pendingTasks: task._id}});
        }

        Task.update({'_id' : req.params.id}, function (err, task) {
          queryCallback(err, task, res);
        });
    });
    
});

taskIdRoute.delete(function (req, res) {
    Task.findOne({'_id' : req.params.id}).
        exec(function(err, task) {
            if (err) {
                res.status(400).send({
                    'message': "Task not found",
                    'data': []
                });
            } else {
                if (task.assignedUser) {
                    User.findOneAndUpdate({'_id' : task.assignedUser}, {$pull: {pendingTasks: task._id}});
                }
                task.remove();
                res.status(200).send({
                    'message': "Task successfully deleted",
                    'data': task
                });
            }
        })
});

// Start the server
app.listen(port);
console.log('Server running on port ' + port);
