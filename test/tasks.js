/**
 * Created by LDV on 02/04/14.
 */

var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var winston = require('winston');
var config  = require('./../myLibs/config');

var TaskModel    = require('../model/mongoose').TaskModel;
var ProjectModel = require('../model/mongoose').ProjectModel;
var UserModel    = require('../model/mongoose').UserModel;

var Promise = require('promise');

describe('Task CRUD', function()
{
    var url = 'http://localhost:3000';
    var authCookie;

    var currentProject = {};

    beforeEach(function(done)
    {
        ProjectModel.collection.drop();
        TaskModel.collection.drop();
        UserModel.collection.drop();

        var project = new ProjectModel({
            name: 'TestProjectName'
        });

        project.save(function (err)
        {
            if (err) {
                throw err;
            }

            currentProject = project;


            var user = new UserModel({
                name:        "User1",
                password:    "user1",
                description: 'Created from Tests',
                projectIDs: [currentProject._id]
            });

            user.save(function (err)
            {
                if (err) {
                    throw err;
                }

                var credentials = {
                    username: user.name,    // passport ask to have username
                    password: user.password
                };

                request(url)
                    .post('/login')
                    .send(credentials)
                    .end(function(err, res) {
                        if (err) {
                            throw err;
                        }

                        var cookies = res.headers['set-cookie'];
                        // Parse cookies to prepare string, which we will be able to use in request headers
                        if (cookies) {
                            authCookie = cookies.map(function(cookie) {
                                return cookie.split(';')[0];
                            }).join('; ');
                        } else {
                            throw "";
                        }

                        res.should.have.status(302);
                        res.text.should.containDeep("/projects/list");

                        done();
                    });
            });
        });
    });

    afterEach(function(done) {
        ProjectModel.collection.drop();
        TaskModel.collection.drop();
        UserModel.collection.drop();

        done();
    });


    describe('Task creation', function() {
        it('Should create task for project', function(done) {

            var taskName = 'TestTaskName';
            var taskSpendTime = 10;

            var body = {
                projectID: currentProject._id,
                name: taskName,
                spendTime: taskSpendTime
            };

            request(url)
                .post('/tasks/create')
                .set('cookie', authCookie)
                .send(body)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    } else {

                        res.should.have.status(302);
                        res.text.should.containDeep("/projects/details");

                        TaskModel.findOne(body, function(err, task) {
                            if (err) {
                                throw err;
                            } else {
                                should.exist(task);


                                ProjectModel.findById(task.projectID, function(err, parentProject) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        should.exist(parentProject);

                                        parentProject.name.should.eql(currentProject.name);
                                        parentProject.spendTime.should.eql(taskSpendTime);

                                        done();
                                    }
                                });
                            }
                        });
                    }
                });
        });


        it('Should sum tasks spend time', function(done) {

            var taskSpendTime1 = 1.0;
            var taskSpendTime2 = 2.0;
            var taskSpendTime3 = 3.0;

            var tasksSpendTime = taskSpendTime1 + taskSpendTime2 + taskSpendTime3;

            function doRequest(body, resolve, reject) {
                request(url).post('/tasks/create').set('cookie', authCookie).send(body).end(
                    function(err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(res)
                        }
                    }
                );
            }

            var createTask1Promise = new Promise(function (resolve, reject)
            {
                // call  to fulfill the promise with that value
                // call reject(error) if something goes wrong

                var body1 = {
                    projectID: currentProject._id,
                    name: 'TestTaskName1',
                    spendTime: taskSpendTime1
                };

                doRequest(body1, resolve, reject);
            });

            var createTask2Promise = new Promise(function (resolve, reject)
            {
                // call  to fulfill the promise with that value
                // call reject(error) if something goes wrong

                var body = {
                    projectID: currentProject._id,
                    name: 'TestTaskName2',
                    spendTime: taskSpendTime2
                };

                doRequest(body, resolve, reject);
            });

            var createTask3Promise = new Promise(function (resolve, reject)
            {
                // call  to fulfill the promise with that value
                // call reject(error) if something goes wrong

                var body = {
                    projectID: currentProject._id,
                    name: 'TestTaskName3',
                    spendTime: taskSpendTime3
                };

                doRequest(body, resolve, reject);
            });


            Promise.all([createTask1Promise, createTask2Promise, createTask3Promise]).done(function (res, err)
            {
                ProjectModel.findById(currentProject._id, function(err, updatedProject) {
                    if (err) {
                        throw err;
                    } else {
                        should.exist(updatedProject);

                        updatedProject.name.should.eql(currentProject.name);
                        updatedProject.spendTime.should.eql(tasksSpendTime);

                        request(url)
                            .get('/projects/list')
                            .set('cookie', authCookie)
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                } else {
                                    res.should.have.status(200);
                                    res.text.should.containDeep(tasksSpendTime.toString());

                                    done();
                                }
                            });
                    }
                });

            })

        });
    });

    describe('Task deletion', function() {
        it('Should delete task for project', function(done) {

            var taskName = 'TestTaskName';
            var taskSpendTime = 10;

            var body = {
                projectID: currentProject._id,
                name: taskName,
                spendTime: taskSpendTime
            };

            request(url)
                .post('/tasks/create')
                .set('cookie', authCookie)
                .send(body)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    } else {

                        res.should.have.status(302);


                        TaskModel.findOne(body, function(err, createdTask) {
                            if (err) {
                                throw err;
                            } else {
                                should.exist(createdTask);

                                ProjectModel.findById(createdTask.projectID, function(err, parentProject) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        should.exist(parentProject);

                                        parentProject.name.should.eql(currentProject.name);
                                        parentProject.spendTime.should.eql(taskSpendTime);


                                        request(url)
                                            .get('/tasks/delete/'+createdTask._id)
                                            .set('cookie', authCookie)
                                            .end(function(err, res) {
                                                if (err) {
                                                    throw err;
                                                } else {

                                                    res.should.have.status(302);
                                                    res.text.should.containDeep("/projects/details");


                                                    request(url)
                                                        .get('/projects/details/' + createdTask.projectID)
                                                        .set('cookie', authCookie)
                                                        .end(function(err, res) {
                                                            if (err) {
                                                                throw err;
                                                            } else {

                                                                res.text.should.not.containDeep(taskName);

                                                                request(url)
                                                                    .get('/projects/list')
                                                                    .set('cookie', authCookie)
                                                                    .end(function(err, res) {
                                                                        if (err) {
                                                                            throw err;
                                                                        } else {

                                                                            res.text.should.containDeep(currentProject.name);

                                                                            ProjectModel.findById(createdTask.projectID, function(err, modifiedProject) {
                                                                                if (err) {
                                                                                    throw err;
                                                                                } else {
                                                                                    should.exist(modifiedProject);

                                                                                    modifiedProject.name.should.eql(currentProject.name);
                                                                                    modifiedProject.spendTime.should.eql(0);

                                                                                    done();
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                            }
                                                        });
                                                }
                                            });
                                    }
                                });
                            }
                        });
                    }
                });
        });

        it('Should not sum deleted tasks spend time', function(done) {

            var initialTaskSpendTime = 1000.0;

            var taskSpendTime1 = 1.0;
            var taskSpendTime2 = 2.0;
            var taskSpendTime3 = 3.0;

            var maxTasksSpendTime = initialTaskSpendTime + taskSpendTime1 + taskSpendTime2 + taskSpendTime3;

            var resultTasksSpendTime = initialTaskSpendTime;

            function doRequest(body, resolve, reject) {
                request(url).post('/tasks/create').set('cookie', authCookie).send(body).end(
                    function(err, res) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(res)
                        }
                    }
                );
            }

            var initialTaskName = 'initialTaskName';
            var createInitialTaskPromise = new Promise(function (resolve, reject)
            {
                // call  to fulfill the promise with that value
                // call reject(error) if something goes wrong

                var body1 = {
                    projectID: currentProject._id,
                    name: initialTaskName,
                    spendTime: initialTaskSpendTime
                };

                doRequest(body1, resolve, reject);
            });

            createInitialTaskPromise.done( function (res, err) {
                ProjectModel.findById(currentProject._id, function(err, initialProject) {
                    if (err) {
                        throw err;
                    } else {
                        should.exist(initialProject);

                        initialProject.name.should.eql(currentProject.name);
                        initialProject.spendTime.should.eql(initialTaskSpendTime);


                        var createTask1Promise = new Promise(function (resolve, reject)
                        {
                            // call  to fulfill the promise with that value
                            // call reject(error) if something goes wrong

                            var body1 = {
                                projectID: currentProject._id,
                                name: 'TestTaskName1',
                                spendTime: taskSpendTime1
                            };

                            doRequest(body1, resolve, reject);
                        });

                        var createTask2Promise = new Promise(function (resolve, reject)
                        {
                            // call  to fulfill the promise with that value
                            // call reject(error) if something goes wrong

                            var body = {
                                projectID: currentProject._id,
                                name: 'TestTaskName2',
                                spendTime: taskSpendTime2
                            };

                            doRequest(body, resolve, reject);
                        });

                        var createTask3Promise = new Promise(function (resolve, reject)
                        {
                            // call  to fulfill the promise with that value
                            // call reject(error) if something goes wrong

                            var body = {
                                projectID: currentProject._id,
                                name: 'TestTaskName3',
                                spendTime: taskSpendTime3
                            };

                            doRequest(body, resolve, reject);
                        });

                        Promise.all([createTask1Promise, createTask2Promise, createTask3Promise]).done(function (res, err)
                        {
                            ProjectModel.findById(currentProject._id, function(err, updatedProjectMaxSpendTime) {
                                if (err) {
                                    throw err;
                                } else {
                                    should.exist(updatedProjectMaxSpendTime);

                                    updatedProjectMaxSpendTime.name.should.eql(currentProject.name);
                                    updatedProjectMaxSpendTime.spendTime.should.eql(maxTasksSpendTime);

                                    TaskModel.find(function(err, tasks){
                                        if (err) throw err;

                                        function taskDeletionDeletionRequest(taskID, resolve, reject) {
                                            request(url).get('/tasks/delete/'+taskID).set('cookie', authCookie).end(
                                                function(err, res) {
                                                    if (err) {
                                                        reject(err);
                                                    } else {
                                                        resolve(res)
                                                    }
                                                }
                                            );
                                        }

                                        var deletionPromises = [];
                                        for (var i = 0; i < tasks.length; i++)
                                        {
                                            var task = tasks[i];
                                            if (task.name !== initialTaskName) {

                                                var taskDeletionPromise = new Promise(function (resolve, reject)
                                                {
                                                    taskDeletionDeletionRequest(task._id, resolve, reject);
                                                });

                                                deletionPromises.push(taskDeletionPromise);
                                            }
                                        }

                                        Promise.all(deletionPromises).done(function (res, err)
                                        {
                                            ProjectModel.findById(currentProject._id, function(err, projectInitialSpendTime)
                                            {
                                                if (err) throw err;

                                                should.exist(projectInitialSpendTime);

                                                console.log("MyLog: " + projectInitialSpendTime.spendTime);
                                                projectInitialSpendTime.spendTime.should.eql(initialTaskSpendTime);


                                                request(url)
                                                .get('/projects/list')
                                                .set('cookie', authCookie)
                                                .end(function(err, res) {
                                                    if (err) throw err;

                                                        res.should.have.status(200);
                                                        res.text.should.containDeep(initialTaskSpendTime.toString());

                                                        done();
                                                    });
                                            });
                                        });
                                    });
                                }
                            });

                        })

                    }
                });

            })

        });

    });

    describe('Task editing', function() {
        it('Should update task', function(done) {

            var oldTaskName = 'OldTaskName';
            var oldTaskSpendTime = 10;

            var body = {
                projectID: currentProject._id,
                name: oldTaskName,
                spendTime: oldTaskSpendTime
            };

            request(url)
                .post('/tasks/create')
                .set('cookie', authCookie)
                .send(body)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    } else {

                        res.should.have.status(302);
                        res.text.should.containDeep("/projects/details");

                        TaskModel.findOne(body, function(err, task) {
                            if (err) {
                                throw err;
                            } else {
                                should.exist(task);

                                var newTaskName = "NEWTaskName";
                                var newTaskSpendTime = 20;

                                var editedBody = {
                                    projectID: currentProject._id,
                                    name:      newTaskName,
                                    spendTime: newTaskSpendTime,
                                    taskId:    task._id
                                }

                                request(url)
                                    .post('/tasks/edit')
                                    .set('cookie', authCookie)
                                    .send(editedBody)
                                    .end(function(err, res) {
                                        if (err) {
                                            throw err;
                                        } else {

                                            res.should.have.status(302);
                                            res.text.should.containDeep("/projects/details");

                                            TaskModel.findById(task._id, function(err, task) {
                                                if (err) {
                                                    throw err;
                                                } else {
                                                    should.exist(task);

                                                    task.name.should.eql(newTaskName);
                                                    task.spendTime.should.eql(newTaskSpendTime);


                                                    ProjectModel.findById(task.projectID, function(err, parentProject) {
                                                        if (err) {
                                                            throw err;
                                                        } else {
                                                            should.exist(parentProject);

                                                            parentProject.spendTime.should.eql(newTaskSpendTime);

                                                            done();
                                                        }
                                                    });

                                                }

                                            });
                                        }
                                    });
                            }
                        });
                    }
                });
        });
    });

});

