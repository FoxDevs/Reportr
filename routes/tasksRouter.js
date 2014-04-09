/**
 * Created by LDV on 31/03/14.
 */

var projectsRouter = require('./projectsRouter');

var TaskModel = require('../model/mongoose').TaskModel;
var ProjectModel = require('../model/mongoose').ProjectModel;

exports.list = function(request, response)
{
    if (request.params.id) {

        ProjectModel.findById(request.params.id, function(err, project) {
            if (!err) {

                if (project)
                {
                    TaskModel.find({projectID: request.params.id}, function(err, tasks) {

                        if (!err) {
                            response.render('tasks/list', {project:project, tasks: tasks});

                        } else {
                            console.log('MyError: Cant find tasks');
                            response.send({ error: 'Server error' });
                        }
                    });

                } else {
                    response.render('tasks/list', {project:project});
                }
            } else {
                console.log('MyError: Cant find project');
                response.send({ error: 'Server error' });
            }
        });
    } else {
        console.log('No project ID request');
        response.redirect('projects/list');
    }
};

exports.create = function(request, response)
{
    var project = ProjectModel.findById(request.params.id, function(err, doc) {
        if (!err) {
            response.render('tasks/create', {project: doc});

        } else {
            console.log('MyError: Cannot find Project with ID ' + request.params.id);
            response.redirect('/projects/list')
        }
    });


};

exports.createTask = function(request, response)
{
    var task = new TaskModel({
        projectID: request.body.projectID,
        name: request.body.name,
        spendTime: request.body.spendTime
    });

    task.save(function (err)
    {
        if (!err) {

            ProjectModel.findById(task.projectID, function(err, project) {
                if (!err) {

                    if (project)
                    {

                        ProjectModel.findByIdAndUpdate(project._id, {$inc: {spendTime:task.spendTime}}, function (err, updatedProject) {
                            if (err) return console.log(err);

                            response.redirect('projects/list');
                        });

                    } else {
                        var errMessage = 'MyError: Project with ID ' + request.params.id + 'not found';
                        console.log(errMessage);
                        response.send(errMessage);
                    }

                } else {
                    console.log('MyError: Cannot find Project with ID ' + request.params.id);
                    response.redirect('projects/list');
                }
            });
        } else {
            console.log(err);

        }
    });
}

exports.delete = function(req, res) {
    TaskModel.findById(req.params.id, function (err, task) {
        if (!err) {

            if (task) {

                ProjectModel.findByIdAndUpdate(task.projectID, {$inc: {spendTime:-task.spendTime}}, function (err, updatedProject) {
                    if (err) return console.log(err);

                    task.remove(function (err) {

                        res.redirect('projects/details');

                    });
                });
            } else {
                projectsRouter.createProject(req, res);
            }


        } else {
            console.log('Cant find task with ID: ' + req.params.id);
            res.statusCode = 500;
            res.send({ error: 'Server error' });
        }
    });
};
