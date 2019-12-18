const sendCommand = require('./allocine.sendCommand');

module.exports = function getSpecificMovie(movieName){
    const options = {
        movie: movieName
    };
    return sendCommand(options);
}
