const sendCommand = require('./allocine.sendCommand');
const options = {
    withoutTime: true
};

module.exports = function getMoviesWithoutTimes(){
    return sendCommand(options);
}
