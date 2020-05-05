#!/usr/bin/env node

var crypto = require('crypto');


// variables
var algorithm = 'aes256';
var inputEncoding = 'utf8';
var outputEncoding = 'hex';
var ivlength = 16;

function generateSymKey(){
    var secret = 'ciw7p02f70000ysjon7gztjn7'
    var key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
    return key
}
// symmetric encryption
// encrypt
function symmetricEnc(data, symmetricKey = generateSymKey()) {
    var iv = crypto.randomBytes(ivlength);
    var cipher = crypto.createCipheriv(algorithm, symmetricKey, iv);
    var ciphered = cipher.update(data, inputEncoding, outputEncoding);
    ciphered += cipher.final(outputEncoding);
    var ciphertext = iv.toString(outputEncoding) + ':' + ciphered

    return ciphertext
}


// decrypt
function symmetricDec(encData, symmetricKey = generateSymKey()) {
    var components = encData.split(':');
    var iv_from_ciphertext = Buffer.from(components.shift(), outputEncoding);
    var decipher = crypto.createDecipheriv(algorithm, symmetricKey, iv_from_ciphertext);
    var deciphered = decipher.update(components.join(':'), outputEncoding, inputEncoding);
    deciphered += decipher.final(inputEncoding);

    return deciphered
}

module.exports ={

    symmetricEnc,
    symmetricDec
};