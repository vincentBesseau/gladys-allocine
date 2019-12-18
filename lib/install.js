const sentences = require('sentences');

module.exports = function install(){
    sentences.sentenceCineFR.forEach((sentence) => {
        return gladys.sentence.create(sentence);
    })

    sentences.sentenceCineEN.forEach((sentence) => {
        return gladys.sentence.create(sentence);
    })
}
