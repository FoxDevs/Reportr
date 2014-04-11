/**
 * Created by LDV on 31/03/14.
 */

var dateFormat = require('dateformat');

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
        spendTime: request.body.spendTime,
        created_at: Date.now()
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

                            response.redirect('projects/details/'+updatedProject._id);
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

exports.edit = function(req, res)
{
    var taskID = req.params.id;

    TaskModel.findById(taskID, function(err, task)
    {
        if (!err)
        {
            res.render('tasks/edit', {task: task});
        } else {
            console.log('MyError: Cant exports.edit');
            response.send({ error: 'Server error' });
        }
    });
};

exports.editTask  = function(req, res)
{
    var taskID = req.body.taskId;

    TaskModel.findById(taskID, function(err, task)
    {
        if (err) throw err;

        var newSpendTime = req.body.spendTime;

        var spendTimeDif = newSpendTime - task.spendTime

        task.name      = req.body.name;
        task.spendTime = newSpendTime;

        task.save(function (err)
        {
            if (err) throw err;

            ProjectModel.findByIdAndUpdate(task.projectID, {$inc: {spendTime:spendTimeDif}}, function (err, updatedProject) {
                if (err) throw err;

                res.redirect('projects/details/'+task.projectID);
            });
        });
    });
};

exports.calendar = function(req, res) {

    var projectID = req.params.id;

    res.render('tasks/calendar', {projectID: projectID});
};

function taskToEvent(task, projectID)
{
    var formattedDate = dateFormat(task.created_at, "yyyy-mm-dd");

    var event = {
        // start: "2014-04-25"
        title: task.name,
        start: formattedDate,
        url: "/projects/details/" + projectID
    }

    return event;
}

exports.returnEvents = function(req, res) {

    var projectID = req.params.id;

    TaskModel.find({projectID: projectID}, function(err, tasks) {

        if (!err) {

            var events = [];

            for(var taskIndex = 0; taskIndex < tasks.length; taskIndex++)
            {
                var task = tasks[taskIndex];

                var event = taskToEvent(task, projectID);

                events.push(event);
            }

            res.json(events);

        } else {
            console.log('MyError: Cant find tasks');
            response.send({ error: 'Server error' });
        }
    });
};