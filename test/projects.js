/**
 * Created by LDV on 01/04/14.
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

describe('Projects CRUD', function()
{
    var url = 'http://localhost:3000';
    var authCookie;


    beforeEach(function(done) {
        // In our test we use the test db
        //mongoose.connect(config.get('mongoose:uri'));
        //mongoose.connection.db.dropDatabase();

        ProjectModel.collection.drop();
        TaskModel.collection.drop();
        UserModel.collection.drop();

        var user = new UserModel({
            name:        "User1",
            password:    "user1",
            description: 'Created from Tests'
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
                    //console.log(authCookie);

                    res.should.have.status(302);
                    res.text.should.containDeep("/projects/list");

                    done();
                });
        });
    });

    afterEach(function(done) {
        //mongoose.connection.db.dropDatabase();
        ProjectModel.collection.drop();
        TaskModel.collection.drop();
        UserModel.collection.drop();

        done();
    });

    describe('Project creation', function() {
        it('Should create project', function(done) {

            var projectName = 'Test project name';

            var project = {
                name: projectName
            };

            request(url)
                .post('/projects/create')
                .set('cookie', authCookie)
                .send(project)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.should.have.status(200);
                    res.text.should.containDeep(projectName);

                    ProjectModel.findOne({name: projectName}, function(err, createdProject) {

                        should.exist(createdProject);
                        createdProject.should.have.property('name', projectName);

                        done();
                    });
                });
        });


        it('Should not create project with same name', function(done) {

            var projectName = 'SameProjectName';

            var project1 = {
                name: projectName
            };

            request(url)
                .post('/projects/create')
                .set('cookie', authCookie)
                .send(project1)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.should.have.status(200);
                    res.text.should.containDeep(projectName);

                    var project2 = {
                        name: projectName
                    };

                    request(url)
                        .post('/projects/create')
                        .set('cookie', authCookie)
                        .send(project2)
                        .end(function(err, res) {
                            if (err) {
                                throw err;
                            }

                            res.should.have.status(400);
                            res.text.should.containDeep(projectName);

                            ProjectModel.find({name: projectName}, function(err, projectsWithSameName) {

                                projectsWithSameName.should.have.length(1);

                                done();
                            });
                        });
                });
        });


        it('Should delete project', function(done) {

            var projectName = 'ProjectNameToBeDeleted';

            var project = {
                name: projectName
            };

            request(url)
                .post('/projects/create')
                .set('cookie', authCookie)
                .send(project)
                .end(function(err, res) {
                    if (err) {
                        throw err;
                    }

                    res.should.have.status(200);
                    res.text.should.containDeep(projectName);

                    ProjectModel.findOne({name: projectName}, function(err, createdProject) {

                        should.exist(createdProject);
                        createdProject.should.have.property('name', projectName);

                        request(url)
                            .get('/projects/delete/' + createdProject._id)
                            .set('cookie', authCookie)
                            .end(function(err, res) {
                                if (err) {
                                    throw err;
                                }

                                res.should.have.status(302);


                                ProjectModel.findOne({name: projectName}, function(err, createdProject) {

                                    should.not.exist(createdProject);
                                    done();
                                });
                            });
                    });
                });
        });

/*
        it('Should delete all tasks when deleting project', function(done) {
           // todo
        });
*/

    });
});