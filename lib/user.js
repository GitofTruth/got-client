#!/usr/bin/env node

var fs = require("fs");

var shell = require('shelljs');

const Constants = require('./common/constants');
const encryption = require('./common/encryption');


const UserUpdateType = {
    CreateNewUser: 1,
    ChangeUserUserName: 2,
    ChangeUserPublicKey: 3,
    DeleteUser: 4
 };

/**
 * Class for storing and managing GoT users identites
 */
class UserInfo {
    constructor(userName, publicKey, lastMessageNumber = 0){
        this.userName = userName
        this.publicKey = publicKey
        this.lastMessageNumber = lastMessageNumber
    }

    setUserName(userName){
        this.userName = userName
    }

    setPublicKey(publicKey){
        this.publicKey = publicKey
    }

    getUserName(){
        return this.userName
    }

    getPublicKey(){
        return this.getPublicKey
    }
}

class User{
    constructor(loadExisting = true){
        if (loadExisting && this.loadUserData()){

        }else {
            this.userInfo  = new UserInfo("","",0)
            this.oldUserNames = []
            this.oldKeys = {}
            this.privateKey = ""
            this.managedRepoAuthor = this.userInfo.userName
        }
    }

    signMessage(content){
        var signedData = {}
        // console.log(content)
        signedData.content = JSON.stringify(content)
        signedData.messageNumber = this.userInfo.lastMessageNumber
        signedData.userName = this.userInfo.userName

        var userMessage = {}
        userMessage.signedData = signedData

        // TODO: do signature function
        userMessage.signature = "" //(signedData, this.privateKey)

        this.userInfo.lastMessageNumber = this.userInfo.lastMessageNumber + 1
        this.storeUserData();

        // console.log("Signed this:\t" + userMessage)
        return userMessage
    }

    createArgsMessage(){
        var argsContent = {}
        argsContent.args = []
        for (let i = 0; i< arguments.length; i++){
            argsContent.args.push(arguments[i])
        }

        return this.signMessage(argsContent)
    }

    createNewUserMessage(userName, publicKey = null, privateKey = null){
        this.userInfo.lastMessageNumber = 0
        this.userInfo.userName = userName

        if (publicKey == null || privateKey == null){
            var keys = encryption.generateEncPair()
            this.userInfo.publicKey = keys[1]
            this.privateKey = keys[0]
        }else {
            this.userInfo.publicKey = publicKey
            this.privateKey = privateKey
        }

        // create the message to be sent to hyperledger
        var userUpdate = {}
        userUpdate.userUpdateType = UserUpdateType.CreateNewUser
        userUpdate.userInfo = new UserInfo(this.userInfo.userName, this.userInfo.publicKey, this.userInfo.lastMessageNumber)
        userUpdate.oldUserName = ""

        var userMessage = this.signMessage(userUpdate)

        return userMessage
    }

    changeUserNameMessage(userName){
        if (userName != this.userInfo.userName){
            this.oldUserNames.push(this.userInfo.userName)
        }

        // create the message to be sent to hyperledger
        var userUpdate = {}
        userUpdate.userUpdateType = UserUpdateType.ChangeUserUserName
        userUpdate.userInfo = new UserInfo(userName, this.userInfo.publicKey, this.userInfo.lastMessageNumber)
        userUpdate.oldUserName = this.oldUserNames[this.oldUserNames.length-1]

        var userMessage = this .signMessage(userUpdate)
        this.userInfo.userName = userName

        return userMessage
    }

    generateNewKeysMessage(publicKey = null, privateKey = null){
        this.oldKeys[this.userInfo.publicKey] = this.privateKey
        var pvKey

        if (publicKey == null || privateKey == null){
            var keys = encryption.generateEncPair()
            this.userInfo.publicKey = keys[1]
            pvKey = keys[0]
        }else {
            this.userInfo.publicKey = publicKey
            pvKey = privateKey
        }

        // create the message to be sent to hyperledger
        var userUpdate = {}
        userUpdate.userUpdateType = UserUpdateType.ChangeUserPublicKey
        userUpdate.userInfo = new UserInfo(this.userInfo.userName, this.userInfo.publicKey, this.userInfo.lastMessageNumber)
        userUpdate.oldUserName = ""

        var userMessage = this.signMessage(userUpdate)
        this.privateKey = pvKey

        return userMessage
    }

    removeUserMessage(){
        // create the message to be sent to hyperledger
        var userUpdate = {}
        userUpdate.userUpdateType = UserUpdateType.DeleteUser
        userUpdate.userInfo = new UserInfo(this.userInfo.userName, this.userInfo.publicKey, this.userInfo.lastMessageNumber)
        userUpdate.oldUserName = ""

        var userMessage = this.signMessage(userUpdate)

        return userMessage
    }


    storeUserData(storeFilePath = Constants.User_CONFIG_PATH){
        var str = JSON.stringify(this);
        shell.mkdir('-p', Constants.CONFIG_PATH);
        try {
            fs.writeFileSync(storeFilePath, str, { mode: 0o755 });
        } catch(err) {
            console.error(err);
        }
        return str
    }

    loadUserData(loadFilePath = Constants.User_CONFIG_PATH){
        if (fs.existsSync(loadFilePath)) {
            try {
                var str = fs.readFileSync(loadFilePath);
                var serializedObject = JSON.parse(str);
                Object.assign(this, serializedObject);
                return true
            } catch(err){
                console.log(err)
                return false
            }
        }else {
            return false
        }

    }
}

// function main(){
//     var userInfo = new UserInfo("mickey", "key")
//     var user = new User(false, userInfo, "privateKey")
//     var str = user.storeUserData()

//     var userTwo = new User()
//     console.log(userTwo)
// }


// main()


module.exports ={
    User
};
