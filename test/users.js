/**
 * Created by LDV on 08/04/14.
 */
var should = require('should');
var assert = require('assert');
var request = require('supertest');
var mongoose = require('mongoose');
var winston = require('winston');
var config  = require('./../myLibs/config');

var TaskModel = require('../model/mongoose').TaskModel;
var ProjectModel = require('../model/mongoose').ProjectModel;
var UserModel = require('../model/mongoose').UserModel;

describe('Users Login', function()
{
    var url = 'http://localhost:3000';

    var existingUser;

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

            existingUser = user;
            done();
        });
    });

    afterEach(function(done) {

        ProjectModel.collection.drop();
        TaskModel.collection.drop();
        UserModel.collection.drop();

        done();
    });

    describe('User Local Login', function() {

        it('Create User', function(done) {

            var credentials = {
                username: existingUser.name,    // passport ask to have username
                password: existingUser.password
            };

            request(url)
                .post('/login')
                .send(credentials)
                .end(function(err, res) {

                    if (err) {
                        throw err;
                    }

                    res.should.have.status(302);
                    res.text.should.containDeep("/projects/list");

                    done();
                });
        });

        it('Existing User Should login', function(done) {

            var credentials = {
                username: existingUser.name,    // passport ask to have username
                password: existingUser.password
            };

            request(url)
                .post('/login')
                .send(credentials)
                .end(function(err, res) {

                    if (err) {
                        throw err;
                    }

                    res.should.have.status(302);
                    res.text.should.containDeep("/projects/list");

                    done();
                });
        });
    });
});