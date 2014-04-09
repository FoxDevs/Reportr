/**
 * Created by LDV on 28/03/14.
 */

var mongoose = require('mongoose');

exports.ProjectSchema = mongoose.Schema({
    name: String,
    spendTime: Number
});
