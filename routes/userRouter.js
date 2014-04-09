/**
 * Created by LDV on 03/04/14.
 */

var projectsRouter = require('./projectsRouter');
var UserModel = require('../model/mongoose').UserModel;

exports.create = function(request, response)
{
    response.render('user/new_user');
};

exports.createUser = function(request, response)
{
    var newUser = {
        name:        request.body.username,
        password:    request.body.password,
        description: request.body.description
    }

    UserModel.create(newUser, function(err, createdUser) {
        if (err) { throw err }

        if (createdUser) {
            response.send('Now you can log in through ' + createdUser.name);
        } else {
            console.log("todo");
        }
    });
};

exports.login = function(request, response)
{
    response.render('user/login');
};

exports.successful = function(request, response)
{
    console.log('Login Successful For ' + request.user.name);

    projectsRouter.list(request, response);
};

exports.unsuccessful = function(request, response)
{
    response.render('user/login_unsuccessful');
};


exports.faceBookRedirect = function(request, response)
{
    response.send('Face Boock Redirect');
};
