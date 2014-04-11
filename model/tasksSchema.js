/**
 * Created by LDV on 31/03/14.
 */

var mongoose = require('mongoose');

exports.TaskSchema = mongoose.Schema({
    projectID: String,
    name:      String,
    spendTime: Number,
    created_at: Date
});
