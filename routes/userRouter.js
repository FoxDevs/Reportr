/**
 * Created by LDV on 03/04/14.
 */

var projectsRouter = require('./projectsRouter');
var UserModel = require('../model/mongoose').UserModel;

exports.createInitialAdminUser = function()
{
    UserModel.findOne({admin: true}, function(err, adminUser) {
        if (err) throw err;

        if (!adminUser) {

            var initialAdminUser = {
                name:        'admin',
                password:    'admin',
                admin:       true,
                description: 'Initial Admin User'
            }

            UserModel.create(initialAdminUser, function(err, createdAdminUser) {
                if (err) throw err

                if (createdAdminUser) {
                    console.log("Created Initial Admin User");

                } else {
                    console.log("MyError: Could not create initial admin User!!!");
                }
            });

        } else {
            console.log("Admin user is exist");
        }
    });
};


exports.createInitialUser = function()
{
    UserModel.findOne({name: 'user'}, function(err, user) {
        if (err) throw err;

        if (!user) {

            var initialUser = {
                name:        'user',
                password:    'user',
                admin:       false,
                description: 'Initial User'
            }

            UserModel.create(initialUser, function(err, createdInitialUser) {
                if (err) throw err

                if (createdInitialUser) {
                    console.log("Created Initial User");

                } else {
                    console.log("MyError: Could not create Initial User!!!");
                }
            });

        } else {
            console.log("Initial User is exist");
        }
    });
};

exports.all = function(request, response)
{
    UserModel.find(function(err, allUsers)
    {
        if (!err) {
            return response.render('user/all', { allUsers: allUsers});
        } else {

            console.log('Need to work it out! exports.all UserModel.find');
            //errorHandler
            return response.send({ error: 'Server error' });
        }
    });
};

exports.create = function(request, response)
{
    response.render('user/new_user');
};

exports.createUser = function(request, response)
{
    var newUser = {
        name:        request.body.username,
        password:    request.body.password,
        admin:       false,
        description: request.body.description
    }

    var currentUser = request.user;

    if (currentUser.admin)
    {
        if (request.body.adminCheckBox) newUser.admin = true;
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


exports.edit = function(request, response)
{
    var userId = request.params.id;

    UserModel.findById(userId, function(err, user)
    {
        if (err) throw err;

        if (user)
        {
            var currentUser = request.user;
            response.render('user/edit', {currentUser: currentUser, editingUser: user});
        } else {
            console.log("MyError: cannot find user with id " + userId);
            response.send('Server errrrr');
        }
    });
};


exports.editUser = function(request, response)
{
    var currentUser = request.user;

    UserModel.findById(request.params.id, function(err, user)
    {
        if (err) throw err;

        if (user)
        {
            // TODO trim, validation and so on
            user.name        = request.body.username;
            user.password    = request.body.password;
            user.description = request.body.description;

            // To edit some fields need to have admin rights
            if (currentUser.admin)
            {
                if (request.body.adminCheckBox) {
                    user.admin = true;

                    user.save(function(err)
                    {
                        if (err) throw err;

                        response.redirect('/users/all');
                    });

                } else {

                    // TODO if the only admin left and this is the last one it cannot be set too false because no more admins left
                    isAdminLast(function(adminIsLast)
                    {
                        if (adminIsLast) {

                            response.send("<h1>You Are Trying to remove last Admin !!!<h1>");

                        } else {

                            user.admin = false;

                            user.save(function(err)
                            {
                                if (err) throw err;

                                response.redirect('/users/all');
                            });
                        }
                    });
                }

            } else {
                user.save(function(err) {
                    if (err) throw err;

                    var currentUser = request.user;
                    if (currentUser.admin) {
                        response.redirect('/users/all');
                    } else {
                        response.redirect('/projects/list');
                    }
                });
            }

        } else {
            console.log("Cannot find user exports.editUser UserModel.findById");
        }
    });
};


exports.delete = function(request, response)
{
    var userID = request.params.id;

    var currentUser = request.user;

    if (userID == currentUser._id) {
        response.send("You are trying to remove YOUSELF!!!");
        response.end();
    }

    UserModel.findById(userID, function(err, user) {
        if (err) throw err;

        if (user)
        {
            // If last Admin will be deleted it means control will be lost
            if (user.admin)
            {
                UserModel.find({admin: true}, function(err, admins)
                {
                    if (err) throw err;

                    if (admins.length > 1)
                    {
                        user.remove();
                        console.log('Removed user: ' + user.name);
                    } else {
                        response.send("<h1>You are trying to delete the last Admin in the system. If he will be deleted the system will out of control!!!!</h1>");
                        return;
                    }
                });
            } else {
                user.remove();
                console.log('Removed user: ' + user.name);
            }
        } else {
            console.log('Cant find user for deletion with id ' + request.params.id);
            response.redirect('/users/all');
        }
    });
}


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


function isAdminLast(next)
{
    UserModel.find({admin: true}, function(err, admins)
    {
        if (err) throw err;

        if (admins.length > 1)
        {
            next(false);
        } else {
            next(true);
        }
    });
}