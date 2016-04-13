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
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
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
      select(req.query.select ? JSON.parse(req.query.select) : {}).
      limit(req.query.limit).
      skip(req.query.skip).
      exec(function(err, users) {
        if (err) {
            return res.status(500).send({
                'message': err.message,
                'data': []
            });
        } else {
            return res.status(200).json({
                'message': "OK",
                'data': users
            });
        }
    });
});

userRoute.post(function (req, res) {
    var newUser = new User(req.body);
    newUser.save(function (err, user) {
        if (err) {
            return res.status(500).send({
                'message': err.message + ": " + 
                    (_.map(err.errors, function (error) { return error.message; })).join(", "),
                'data': []
            });
        } else {
            return res.status(201).json({
                'message': "OK",
                'data': user
            });
        }
    });
});

var userIdRoute = router.route('/users/:id');

userIdRoute.get(function (req, res) {
    User.findOne({'_id' : req.params.id}).
        exec(function(err, user) {
            if (err) {
                return res.status(404).send({
                    'message': "User not found",
                    'data': []
                });
            } else {
                if (!user) {
                    return res.status(404).send({
                        'message': "User not found",
                        'data': []
                    });
                }
                return res.status(200).json({
                    'message': "OK",
                    'data': user
                });
            }
        })
});

userIdRoute.put(function (req, res) {

    User.findOne({'_id' : req.params.id}, function (err, user) {
        if (err) {
            return res.status(404).send({
                'message': "User not found",
                'data': []
            });
        } else {
            if (!user) {
                return res.status(404).send({
                    'message': "User not found",
                    'data': []
                });
            }
            user.name = req.body.name;
            user.email = req.body.email;
            user.dateCreated = req.body.dateCreated;
            user.pendingTasks = req.body.pendingTasks;
            user.save(function (errSave, userSave) {
                if (errSave) {
                    return res.status(500).send({
                        'message': errSave.message + ": " +
                            (_.map(errSave.errors, function (error) { return error.message; })).join(", "),
                        'data': []
                    });
                } else {
                    return res.status(200).json({
                        'message': "OK",
                        'data': userSave
                    });
                }
            });
        }
    });

});

userIdRoute.delete(function (req, res) {
    User.findOne({'_id' : req.params.id}).exec(function(err, user) {
        if (err) {
            return res.status(404).send({
                'message': "User not found",
                'data': []
            });
        } else {
            if (!user) {
                return res.status(404).send({
                    'message': "User not found",
                    'data': []
                });
            }
            user.remove(function (errDelete, userDelete) {
                if (errDelete) {
                    return res.status(500).send({
                        'message': "Error deleting user",
                        'data': []
                    });
                } else {
                    return res.status(200).json({
                        'message': "User deleted",
                        'data': userDelete
                    });
                }
            })
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
      sort(req.query.sort ? JSON.parse(req.query.sort) : {}).
      select(req.query.select ? JSON.parse(req.query.select) : {}).
      limit(req.query.limit).
      skip(req.query.skip).
      exec(function(err, tasks) {
        if (err) {
            return res.status(500).send({
                'message': err.message,
                'data': []
            });
        } else {
            return res.status(200).json({
                'message': "OK",
                'data': tasks
            });
        }
      });
});

taskRoute.post(function (req, res) {
    var newTask = new Task(req.body);
    
    newTask.save(function (err, task) {
        if (err) {
            return res.status(500).send({
                'message': err.message + ": " +
                    (_.map(err.errors, function (error) { return error.message; })).join(", "),
                'data': []
            });
        } else {
            return res.status(201).json({
                'message': "OK",
                'data': task
            });
        }
    });
    
});

var taskIdRoute = router.route('/tasks/:id');

taskIdRoute.get(function (req, res) {
    Task.findOne({'_id' : req.params.id}).
        exec(function(err, task) {
            if (err) {
                return res.status(404).send({
                    'message': "Task not found",
                    'data': []
                });
            } else {
                if (!task) {
                    return res.status(404).send({
                        'message': "Task not found",
                        'data': []
                    });
                }
                return res.status(200).json({
                    'message': "OK",
                    'data': task
                });
            }
        })
});

taskIdRoute.put(function (req, res) {
    Task.findOne({'_id' : req.params.id}, function (err, task) {
        if (err) {
            console.log(err);
            return res.status(404).send({
                'message': "Task not found",
                'data': []
            });
        } else {
            if (!task) {
                return res.status(404).send({
                    'message': "Task not found",
                    'data': []
                });
            }
            task.name = req.body.name;
            task.completed = req.body.completed;
            task.deadline = req.body.deadline;
            task.dateCreated = req.body.dateCreated;
            task.assignedUserName = req.body.assignedUserName;
            task.assignedUser = req.body.assignedUser;
            task.save(function (errSave, taskSave) {
                if (errSave) {
                    return res.status(500).send({
                        'message': errSave.message + ": " +
                            (_.map(errSave.errors, function (error) { return error.message; })).join(", "),
                        'data': []
                    });
                } else {
                    return res.status(200).json({
                        'message': "OK",
                        'data': taskSave
                    });
                }
            });
        }
    });
    
});

taskIdRoute.delete(function (req, res) {
    Task.findOne({'_id' : req.params.id}).exec(function(err, task) {
        if (err) {
            return res.status(404).send({
                'message': "Task not found",
                'data': []
            });
        } else {
            if (!task) {
                return res.status(404).send({
                    'message': "Task not found",
                    'data': []
                });
            }
            task.remove(function (errDelete, taskDelete) {
                if (errDelete) {
                    return res.status(500).send({
                        'message': "Error deleting task",
                        'data': []
                    });
                } else {
                    return res.status(200).json({
                        'message': "Task deleted",
                        'data': taskDelete
                    });
                }
            })
            
        }
    })
});

// Start the server
app.listen(port);
console.log('Server running on port ' + port);
