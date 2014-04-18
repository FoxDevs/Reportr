/**
 * Created by LDV on 03/04/14.
 */

var mongoose = require('mongoose');

exports.UserSchema = mongoose.Schema({
    faceBookID:  String,
    name:        String,
    password:    String,
    projectIDs:  Array,
    admin:       Boolean,
    description: String
});
