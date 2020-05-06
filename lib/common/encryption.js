#!/usr/bin/env node

var crypto = require('crypto');


// variables
var algorithm = 'aes256';
var inputEncoding = 'utf8';
var outputEncoding = 'hex';
var ivlength = 16;


// generation key pairs
function generateEncPair(){
    const { publicKey, privateKey } = generateKeyPairSync('rsa', 
    {
            modulusLength: 4096,
            namedCurve: 'secp256k1', 
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'     
            },     
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: passphrase
            } 
    });

    writeFileSync('private.pem', privateKey)
    writeFileSync('public.pem', publicKey)

    return [privateKey, publicKey]
}

function generateSymKey(){
    var secret = 'ciw7p02f70000ysjon7gztjn7'
    var key = crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
    return key
}



function createNewSymmetricKeyAnnouncement(usersKey, privateKey, encKey = null){
    if (encKey == null){
        encKey = generateSymKey()
    }
    var announcement = {}
    announcement.KeyHash = crypto.createHash('sha256').update(encKey).digest('base64');
    announcement.encryptedKeys = {}
    for (let userName in usersKey){
        //announcement.encryptedKeys[userName] = thresholdDec(encKey, usersKey.values, privateKey)
        announcement.encryptedKeys[userName] = encryptDate(data, usersKey[userName])
    }

    return announcement
}


// sign
function signData(data, privateKey) {

}


// verify
function verifySignature(signedData, publicKey) {

}


// thresholdEncryption
// encrypt
function encryptDate(data, publicKey){
    return data+":"+publicKey
}

function decryptDate(data, privateKey){
    return data,substring(0, data.indexOf(':'))
}


function thresholdEnc(data, publicKeys, privateKey) {
    var buffer = new Buffer(data);
    var encrypted = crypto.publicEncrypt(publicKeys[0], buffer);
    return encrypted.toString("base64");
}



// decrypt
function thresholdDec(encData, publicKeys, privateKey) {
    var buffer = new Buffer(encData, "base64");
    //var decrypted = crypto.privateDecrypt(privateKey, buffer);
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey.toString(),
            passphrase: passphrase,
        },
        buffer,
    )
    return decrypted.toString("utf8");
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


// testing threshold encryption


// testing symmetric encryption
var text = "Mickey is good personss"
// var symEncKey = generateSymKey()
// var cipher = symmetricEnc(text, symEncKey)
// var newText = symmetricDec(cipher, symEncKey)

// console.log(symEncKey)
// console.log(cipher)
// console.log(newText)

console.log(symmetricDec(symmetricEnc(text)))

module.exports ={
    generateEncPair,
    generateSymKey,

    createNewSymmetricKeyAnnouncement,

    signData,
    verifySignature,

    thresholdEnc,
    thresholdDec,

    symmetricEnc,
    symmetricDec
};