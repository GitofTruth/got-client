#!/usr/bin/env node

var fs = require("fs");

var shell = require('shelljs');


const Constants = require('./common/constants');


const UserUpdateType = {
    CreateNewUser: 1,
    ChangeUserUserName: 2,
    ChangeUserPublicKey: 3,
    DeleteUser: 4
 };

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
    constructor(loadExisting = true, userInfo, privateKey){
        if (loadExisting){
            this.loadUserData()
        }else {
            this.userInfo  = userInfo
            this.oldUserNames = []
            this.oldKeys = {}
            this.privateKey = privateKey
        }
    }

    signMessage(content){
        var signedData = {}
        signedData.content = JSON.stringify(content)
        signedData.messageNumber = this.userInfo.lastMessageNumber
        signedData.userName = this.userInfo.userName
        
        var userMessage = {}
        userMessage.signedData = signedData

        // TODO: do signature function
        userMessage.signature = "" //(signedData, this.privateKey)

        this.userInfo.lastMessageNumber = this.userInfo.lastMessageNumber + 1
        this.storeUserData();

        console.log("Signed this:\t" + JSON.stringify(userMessage))
        return userMessage
    }


    createNewUserMessage(userName, publicKey = null, privateKey = null){
        this.userInfo.lastMessageNumber = 0
        this.userInfo.userName = userName

        if (publicKey == null || privateKey == null){
            // TODO: generate the keys
            this.userInfo.publicKey = ""        
            this.privateKey = ""
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
            // TODO: generate the keys
            this.userInfo.publicKey = ""        
            pvKey = ""
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
        try {
            var str = fs.readFileSync(loadFilePath);
            var serializedObject = JSON.parse(str);
            Object.assign(this, serializedObject);
        } catch(err){
            console.log(err)
        }
    }
}

function main(){
    var userInfo = new UserInfo("mickey", "key")
    var user = new User(false, userInfo, "privateKey")
    var str = user.storeUserData()

    var userTwo = new User()
    console.log(userTwo)
}


main()


module.exports ={
    User
};