const queries = require('./queries');

module.exports = function uninstall(){
    return gladys.utils.sql(
        queries.deleteSentence,
        [ 'allocine' ]
    );
}

