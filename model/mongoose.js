var mongoose    = require('mongoose');
var config      = require('./../myLibs/config');

var UserSchema    = require('./userSchema').UserSchema;
var ProjectSchema = require('./projectSchema').ProjectSchema;
var TaskSchema    = require('./tasksSchema').TaskSchema;

mongoose.connect(config.get('mongoose:uri'));

var db = mongoose.connection;

db.on('error', function (err) { console.log('connection error:', err.message); });
db.once('open', function callback() { console.log("Connected to DB!"); });

exports.UserModel    = mongoose.model('User', UserSchema);
exports.ProjectModel = mongoose.model('Project', ProjectSchema);
exports.TaskModel    = mongoose.model('Task', TaskSchema);