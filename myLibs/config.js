/**
 * Created by LDV on 28/03/14.
 */

var nconf = require('nconf');

nconf.argv()
    .env()
    .file({ file: './config.json' });

module.exports = nconf;