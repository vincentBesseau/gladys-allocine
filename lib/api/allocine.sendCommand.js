const scrapingallocine = require('scraping-allocine');

module.exports = function sendCommand(param) {
    return gladys.param.getValue('ALLOCINE_CINEMA')
        .then((cinemaCode) => {
            param.cinema = cinemaCode;
            return scrapingallocine.getInfo(param);
        })

};
