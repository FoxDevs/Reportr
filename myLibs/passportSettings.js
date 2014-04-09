/**
 * Created by LDV on 03/04/14.
 */

var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

var UserModel = require('../model/mongoose').UserModel;

passport.use(new LocalStrategy(
    function(username, password, done) {
        UserModel.findOne({ name: username, password: password}, function(err, user) {
            if (err) { return done(err); }
            if (!user) {
                return done(null, false, { message: 'Incorrect username or password' });
            }
//            if (!user.validPassword(password)) {
//                return done(null, false, { message: 'Incorrect password.' });
//            }
            return done(null, user);
        });
    }
));


var FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
        clientID: '609827529061863',
        clientSecret: '05064e5303253d04b71c18d66ff3d2e3',
        callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {

        console.log('FBUser Name: ' + profile.displayName)

        UserModel.findOne({faceBookID: profile.id}, function(err, existedUser) {
            if (err) { return done(err); }

            if (existedUser) {
                done(null, existedUser);
            } else {
                var newUser = {
                    faceBookID:  profile.id,
                    name:        profile.displayName,
                    description: 'Created from FaceBook'
                }

                UserModel.create(newUser, function(err, user) {
                    if (err) { return done(err); }
                    done(null, user);
                });
            }
        });
    }
));


passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {

    UserModel.findById(id, function(err, user) {
        done(err, user);
    });
});

exports.passport = passport;