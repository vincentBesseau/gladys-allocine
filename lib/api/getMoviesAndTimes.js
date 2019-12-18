const sendCommand = require('./allocine.sendCommand');
const options = {};

module.exports = function getMoviesAndTimes(){
    return sendCommand(options);
}
