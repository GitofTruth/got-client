#!/usr/bin/env node

const fs = require('fs');

const Constants = require('./common/constants')

const simpleGit = require('simple-git')(Constants.REPO_PATH);

// other package classes
const GotStorage = require('./storage/GotStorage')
const GotReader = require('./reader/GotReader')
const User = require('./user')

const UserAccess = {
  ReadWriteAccess: 1,
  CollaboratorAccess: 2,
  OwnerAccess: 3,
  ReovkedAccess: 4,
  NeverSetAccess: 5
};

class Client {

  constructor (contract){
    this.contract = contract
    this.storage = new GotStorage("","");
    this.GotReader = new GotReader("master")
    this.user = new User.User()
  }

  async addRepo(){
    try{
        let repo = this.GotReader.getRepo()
        repo["directoryCID"] = await this.storage.InitializeObjectsIPFS()

        console.log("sending this repo:", this.GotReader.getRepo())
        let newRepoString = JSON.stringify(this.GotReader.getRepo());
        let response = await this.contract.submitTransaction('addNewRepo', newRepoString)

        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryDirectoryCID(){
    try{
      let response = await this.queryRepo()

      console.log(response)
      return response['directoryCID']
    }catch(e){
      console.log(e)
    }
  }

  async queryRepo(){
    try{
        let response = await this.contract.evaluateTransaction('queryRepo', this.GotReader.getAuthor(), this.GotReader.getName())
        console.log("Submit Response=",response.toString())
        // console.log(response)
        return JSON.parse(response.toString())
    } catch(e){
        console.log(e)
    }
  }

  async cloneRepo(repoAuthor, repoName){
    try{
        let response = await this.contract.evaluateTransaction('clone', repoAuthor, repoName)
        let repo  = JSON.parse(response.toString())
        let directoryCID = repo["directoryCID"]

        await this.storage.InitializeObjectsLocal(directoryCID)
        console.log("Current Branch Name "+ this.GotReader.getCurrentBranchName())
        let lastCommit = await this.queryLastBranchCommit(this.GotReader.getCurrentBranchName());
        let fileName = './.got/refs/heads/' + this.GotReader.getCurrentBranchName();

        console.log("LAST COMMIT "+lastCommit)

        console.log(process.cwd())
        fs.writeFileSync(fileName, lastCommit)


        // fs.writeFile(fileName, lastCommit, function(err) {
        //   if(err) {
        //     return console.log(err);
        //   }
        //   console.log("The file was saved!");
        //   console.log("Submit Response=",response.toString())
        // });


      //   fs.writeFile(fileName, lastCommit, function (err, result) {
      //   if (err)
      //     console.log('error', err);
      // });


        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async addBranch(branchName){
    try{
        let newBranchString = JSON.stringify(this.GotReader.getBranch(branchName));
        let response = await this.contract.submitTransaction('addNewBranch', this.GotReader.getAuthor(), this.GotReader.getName(), newBranchString)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryBranches(){
    try{
        let response = await this.contract.evaluateTransaction('queryBranches', this.GotReader.getAuthor(), this.GotReader.getName())
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryBranch(branchName){
    try{
        let response = await this.contract.evaluateTransaction('queryBranch', this.GotReader.getAuthor(), this.GotReader.getName(), branchName)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryBranchCommits(branchName, lastCommit){
    try{
        let response = await this.contract.evaluateTransaction('queryBranchCommits', this.GotReader.getAuthor(), this.GotReader.getName(), branchName, lastCommit)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryLastBranchCommit(branchName){
    try{
        let response = await this.contract.evaluateTransaction('queryLastBranchCommit', this.GotReader.getAuthor(), this.GotReader.getName(), branchName)
        console.log("Submit Response=",response.toString())
        return response.toString()
    } catch(e){
        console.log(e)
    }
    return
  }


  updateStorage(pulling){
    //  this.storage.CopyObjects([], pulling)

    let directoryCID = this.queryDirectoryCID()

      if(!pulling)
      {
        this.storage.UploadObjects(directoryCID)
      }else{
        this.storage.DownloadObjects(directoryCID)
      }
      returnmaster
  }

  async loadCurrentRepo(){
    await this.GotReader.loadCurrentRepo()
  }

  async updateRemote(){
    // copy files from nodeStorage to remote (.got) >> updateStorage()
    this.updateStorage(true);

    // update head in remote (.got) >> queryLastBranchCommit() & write to head file in (.got)
    var lastCommit = await this.queryLastBranchCommit(this.GotReader.getCurrentBranchName());
    var fileName = '.got/refs/heads/' + this.GotReader.getCurrentBranchName();

    fs.writeFile(fileName, lastCommit, function(err, result) {
      if(err) console.log('error', err);
    });
  }

  async addCommits(remoteLastCommit){
    var pushlog = await this.GotReader.preparePushLog(remoteLastCommit)
    console.log("trying to add pushlog")
    console.log (pushlog)
    try{
        var newPushLog = JSON.stringify(pushlog);
        console.log(pushlog)
        console.log(newPushLog)
        let response = await this.contract.submitTransaction('addCommits', this.GotReader.getAuthor(), this.GotReader.getName(), newPushLog)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  //stepThree
  async remotePostReceive(branchName){
    // sending objects in remote to nodeStorage
    console.log("remote POST RECIEVE FUNCTION!!!")
    await this.updateStorage(false)

    // for current branch:
      // get last Commit in hyperledger
      // get last Commit in Remote
      var lastCommit = await this.queryLastBranchCommit(this.GotReader.getCurrentBranchName());

      // find commits in between >>> needs change in contract
      // send commits in between to hyperledger
      await this.addCommits(lastCommit)
      return
  }

  async localPrePush(){
    await this.updateRemote()
  }

  async push(){
    console.log("BEFORE PRE PUSH!!!")

    await this.localPrePush();
    console.log("BEFORE PUSH!!!")
    await simpleGit.push();

    console.log("AFTER PUSH!!")
    await this.remotePostReceive(this.GotReader.getCurrentBranchName());
  }

  async pull(){
    await this.updateRemote();
    await simpleGit.pull();
  }

  // update user >> addUserUpdate
    // create user
  async createNewUser(userName, publicKey = null, privateKey = null, showError = true){
    try{
        if(showError){
          let newUserString = JSON.stringify(this.user.createNewUserMessage(userName, publicKey, privateKey));
          let response = await this.contract.submitTransaction('addUserUpdate', newUserString)
          console.log("Submit Response=",response.toString())
        }
        this.user.storeUserData()
    } catch(e){
      console.log(e)
    }
    return
  }

    // change username
  async changeUserName(userName){
    try{
        let newUserString = JSON.stringify(this.user.changeUserNameMessage(userName));
        let response = await this.contract.submitTransaction('addUserUpdate', newUserString)
        this.user.storeUserData()
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

    // generate new keys
  async generateNewKeys(publicKey = null, privateKey = null){
    try{
        let newUserString = JSON.stringify(this.user.generateNewKeysMessage(publicKey, privateKey));
        let response = await this.contract.submitTransaction('addUserUpdate', newUserString)
        this.user.storeUserData()
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

    // remove user
  async removeUser(){
    try{
        let newUserString = JSON.stringify(this.user.removeUserMessage());
        let response = await this.contract.submitTransaction('addUserUpdate', newUserString)
        this.user.storeUserData()
        console.log("Submit Response=",response.toString())
      } catch(e){
        console.log(e)
      }
    return
  }

  // get public key for a user >> queryUser
  async queryUserPublicKey(userName){
    try{
        let response = await this.contract.evaluateTransaction('queryUser', userName)
        console.log("Submit Response=",response.toString())
        return JSON.parse(response.toString())
    } catch(e){
        console.log(e)
    }
  }

  // get public key for a set of users >> queryUsers
  async queryUsersPublicKey(userNames){
    try{
        let userNamesString = JSON.stringify(userNames);
        let response = await this.contract.evaluateTransaction('queryUsers', userNamesString)
        console.log("Submit Response=",response.toString())
        return JSON.parse(response.toString())
    } catch(e){
        console.log(e)
    }
  }


  // update repo access >> updateRepoUserAccess
    // author/repoName username access
  async updateUserAccess(authorized, access, encryptionKey = null, authorizer = this.user.userInfo.userName){
    try{
        if (encryptionKey == null){
          // TODO: generate a new key
          encryptionKey = "encKey"
        }

        // // do encryption for encryption key
        // var accessInt = parseInt(access, 10);

        // // get users with access to repo
        // var users = await this.queryUsersAccess(this.GotReader.getAuthor(), this.GotReader.getName())
        // var userNames = Object.keys(users)

        // // change userName to exclude or include
        // if (accessInt == UserAccess.ReovkedAccess){

        // }

        // var usersInfo = await this.queryUsersPublicKey(userNames)
        // var publicKeys = usersInfo.map(x => x["publicKey"])

        //let updateAccessString = JSON.stringify(this.user.createNewUser(userName, publicKey, privateKey));
        let response = await this.contract.submitTransaction('updateRepoUserAccess', this.GotReader.getAuthor(), this.GotReader.getName(), authorized, access.toString(), authorizer, encryptionKey)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }


  // get users in a repo >> queryRepoUserAccess
  async queryUsersAccess(authorName = this.GotReader.getAuthor(), repoName = this.GotReader.getName()){
    try{
        let response = await this.contract.evaluateTransaction('queryRepoUserAccess', authorName, repoName)
        console.log("Submit Response=",response.toString())
        return JSON.parse(response.toString())
    } catch(e){
        console.log(e)
    }
  }

  // get encryption key >> queryRepo
  async queryCurrentEncryptionKey(){
    try{
        let response = await this.contract.evaluateTransaction('queryRepo', this.GotReader.getAuthor(), this.GotReader.getName())
        console.log("Submit Response=",response.toString())
        // console.log(response)
        return JSON.parse(response.toString())["encryptionKey"]
    } catch(e){
        console.log(e)
    }
  }
}

module.exports ={
  Client,
  UserAccess
};
