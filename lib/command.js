var method = require('./api/method');

module.exports = function command(scope) {

    switch(scope.label) {
        case 'all-movies-times':
            return method.getMoviesAndTimes();
            break;
        case 'all-movie':
            return  method.getMoviesWithoutTimes();
            break;
        case 'one-movie':
            return  method.getSpecificMovie();
            break;

        default:

            break;
    }
};
