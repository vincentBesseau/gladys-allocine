const command = require('./lib/command');
const install = require('./lib/install');
const uninstall = require('./lib/uninstall');

module.exports = function() {
    return {
        command: command,
        install: install,
        uninstall: uninstall
    };
};
