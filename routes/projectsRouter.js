var UserModel = require('../model/mongoose').UserModel;
var ProjectModel = require('../model/mongoose').ProjectModel;
var TasksModel = require('../model/mongoose').TaskModel;

exports.list = function(request, response)
{
    //console.log("Current User Name: " + request.user.name);
    //console.log("ProjectIDs: " + request.user.projectIDs);

    return ProjectModel.find({_id: {$in:request.user.projectIDs} }, function (err, projects)
    {
        if (!err) {
            return response.render('projects/list', {projects: projects});
        } else {

            console.log('Need to work it out!');
            //errorHandler
            return response.send({ error: 'Server error' });
        }
    });
};

exports.create = function(request, response)
{
    response.render('projects/create');
};

exports.createProject = function(request, response)
{
    var projectName = request.body.name;

    ProjectModel.findOne({name: projectName}, function (err, projectWithThatName)
    {
        if (!projectWithThatName)
        {
            var project = new ProjectModel({
                name: projectName
            });

            project.save(function (err)
            {
                if (!err) {

                    //console.log("Project created: " + projectName + " _id=" + project._id);

                    UserModel.findByIdAndUpdate(request.user.id, {$push: {projectIDs:project._id}}, function (err, updatedUser) {
                        if (err) return console.log(err);

                        console.log('ProjectID saved to User');

                        request.user = updatedUser;
                        exports.list(request, response);
                    });

//                    UserModel.update({_id: request.user.id}, {$push: {projectIDs:project._id}}, null, function(err, numAffected) {
//                        // numAffected is the number of updated documents
//
//                        if (numAffected == 1) {
//                            console.log('ProjectID saved to User');
//
//                            exports.list(request, response);
//
//                        } else {
//                            console.log('todo');
//                        }
//                    });

                } else {
                    console.log(err);
                }
            });
        } else {
            response.status(400);
            response.send("Project with name: " + projectName + " is already exist!");
        }
    });
}

exports.details = function(request, response)
{
    ProjectModel.findById(request.params.id, function(err, project) {
        if (!err) {
            TasksModel.find({projectID: request.params.id}, function(err, tasks) {

                if (!err) {
                    response.render('projects/details', {project: project, tasks: tasks});
                } else {
                    console.log('MyError: Got error while TasksModel.find({projectID: request.params.id}');
                    response.send({ error: 'Server error' });
                }
            });
        } else {
            console.log('MyError: Got error while ProjectModel.findById ' + request.params.id);
            response.redirect('/projects/list')
        }
    });
}

exports.delete = function(request, response)
{
    var project = ProjectModel.findById(request.params.id, function(err, doc) {
        if (!err) {

            TasksModel.find({projectID: request.params.id}, function(err, tasks) {
                if (!err) {

                    tasks.forEach(function(task) {
                        task.remove();
                        console.log('Removed task: ' + task.name);
                    });
                }
            });

            doc.remove();
        }
        response.redirect('/projects/list')
    });
}

/*
app.get('/api/articles/:id', function(req, res) {
    return ArticleModel.findById(req.params.id, function (err, article) {
        if(!article) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }
        if (!err) {
            return res.send({ status: 'OK', article:article });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/api/articles/:id', function (req, res){
    return ArticleModel.findById(req.params.id, function (err, article) {
        if(!article) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        article.title = req.body.title;
        article.description = req.body.description;
        article.author = req.body.author;
        article.images = req.body.images;
        return article.save(function (err) {
            if (!err) {
                log.info("article updated");
                return res.send({ status: 'OK', article:article });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    });
});


    */