#!/usr/bin/env node

const fs = require('fs');

const Constants = require('./common/constants')
const encryption = require('./common/encryption');

const simpleGit = require('simple-git/promise')(Constants.REPO_PATH);

// other package classes
const GotStorage = require('./storage/GotStorage')
const GotReader = require('./reader/GotReader')
const GitTree = require('./reader/walk-git-tree')
const User = require('./user')

const UserAccess = {
  ReadWriteAccess: 1,
  CollaboratorAccess: 2,
  OwnerAccess: 3,
  ReovkedAccess: 4,
  NeverSetAccess: 5
};


/**
 * Client class which is used for adding users and repos data to blockchain and ipfs
 */
class Client {

  /**
   * Initializes the client components
   * @param {Contract} contract - an instance of the class contract (part of the fabric network sdk) 
   */
  constructor(contract) {
    /**
     * contract - Used to interact with the chaincode and submit transactions
     */
    this.contract = contract
    /**
     * @property {GotStorage} storage - an instance of the got storage class used to interact with IPFS
     */
    this.storage = new GotStorage();
    /**
     * @property {GotReader} GotReader - an instance of the GotReader class used to interact with local git
     */
    this.GotReader = new GotReader("master")
    /**
     * @property {User} user - a User object
     */
    this.user = new User.User()
  }

  /**
   * Function that loads the current repo and adds its branches and commits to the ledger
   * and its git objects to the decentralized storage
   */
  async addRepo() {
    try {
      this.user.managedRepoAuthor = this.user.userInfo.userName
      this.GotReader.changeRepoAuthor(this.user.managedRepoAuthor)
      await this.loadCurrentRepo(this.user.managedRepoAuthor)
      let repo = this.GotReader.getRepo()

      // creating the initial encryption key
      var usersKey = {}
      usersKey[this.user.userInfo.userName] = this.user.userInfo.publicKey
      repo.encryptionKey = encryption.createNewSymmetricKeyAnnouncement(usersKey, this.user.privateKey, null)
      var usedSymmetricKey = encryption.decryptDate(repo.encryptionKey.encryptedKeys[this.user.userInfo.userName], this.privateKey)
      repo.KeyAnnouncements = {}
      repo.KeyAnnouncements[repo.encryptionKey.KeyHash] = repo.encryptionKey

      //repo.branches["master"].logs["HEAD"].storageHashes = "map returned from IPFS"
      // repo["directoryCID"] = await this.storage.InitializeObjectsIPFS()

      // let pushlog = await this.GotReader.preparePushLog()
      let commitHash = '';
      let allObjectsHashes = [];
      let hashCIDMap = {};

      let commitLogs = repo.branches[this.GotReader.getCurrentBranchName()].logs;

      // console.log("commitLogs = "+ JSON.stringify(commitLogs));

      for (var commitLogHash in commitLogs) {
        // commitHash = commitLogs[i];
        await GitTree.getCommitObjectsHashes(commitLogHash, allObjectsHashes);
        // hashCIDMap.commitHash = "IPFSHash"
        // console.log("All Objects Hashes = "+ allObjectsHashes)
        hashCIDMap = await this.storage.UploadObjects(allObjectsHashes, usedSymmetricKey);
        // console.log("storageHashes= " + hashCIDMap)
        commitLogs[commitLogHash].encryptionKey = repo.encryptionKey.KeyHash
        commitLogs[commitLogHash].storageHashes = hashCIDMap;
        // console.log(commitLogs[commitLogHash])
        // console.log("commit " + " = " + commitLogs[commitLogHash])
      }


      let newRepoString = JSON.stringify(this.GotReader.getRepo());
      var sentArguments = JSON.stringify(this.user.createArgsMessage(newRepoString))
      let response = await this.contract.submitTransaction('addNewRepo', sentArguments)
      console.log("Submit Response=", response.toString())
    } catch (e) {
      console.log(e)
    }
    return
  }

  async queryDirectoryCID() {
    try {
      let response = await this.queryRepo()

      console.log(response)
      return response['directoryCID']
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * Function that retrieves repo from the ledger using repo author and repo name from the GotReader
   */
  async queryRepo() {
    try {
      let response = await this.contract.evaluateTransaction('queryRepo', this.GotReader.getAuthor(), this.GotReader.getName())
      console.log("Submit Response=", JSON.parse(response.toString()))
      // console.log(response)
      return JSON.parse(response.toString())
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * Function that retrieves the repo data from the ledger and uses it to retrieve the repo git objects from 
   * IPFS and decrypt them and then it updates the git refs
   * @param {string} repoAuthor 
   * @param {string} repoName 
   * @returns {void}
   */

  async cloneRepo(repoAuthor, repoName) {
    try {
      this.user.managedRepoAuthor = repoAuthor
      this.user.storeUserData()
      this.GotReader.changeRepoAuthor(repoAuthor)
      await this.loadCurrentRepo(repoAuthor)
      let response = await this.contract.evaluateTransaction('clone', repoAuthor, repoName, this.user.userInfo.userName)
      let repo = JSON.parse(response.toString())
      // let directoryCID = repo["directoryCID"]


      for (var branchName in repo.branches) {
        let branchCommits = repo.branches[branchName].logs
        for (var commitLogHash in branchCommits) {
          // console.log(branchCommits)
          const commit = branchCommits[commitLogHash];
          if (commit.encryptionKey == "") {
            console.log("user does not have enough information to reconstrct the requested data")
            process.exit()
          }
          var retrievedSymmericKey = encryption.decryptDate(commit.encryptionKey, this.user.privateKey)
          // console.log(JSON.stringify(commit.storageHashes))
          await this.storage.DownloadObjects(commit.storageHashes, retrievedSymmericKey);
        }
      }

      // update head in remote (.got) >> queryLastBranchCommit() & write to head file in (.got)
      var lastCommit = await this.queryLastBranchCommit(this.GotReader.getCurrentBranchName());
      var fileName = Constants.REMOTE_PATH + 'refs/heads/' + this.GotReader.getCurrentBranchName();
      fs.writeFileSync(fileName, lastCommit)

      // await this.storage.InitializeObjectsLocal(directoryCID)
      // console.log("Current Branch Name " + this.GotReader.getCurrentBranchName())
      // let lastCommit = await this.queryLastBranchCommit(this.GotReader.getCurrentBranchName());
      // let fileName = Constants.REMOTE_PATH + 'refs/heads/' + this.GotReader.getCurrentBranchName();

      // console.log("LAST COMMIT " + lastCommit)

      // console.log(process.cwd())
      // fs.writeFileSync(fileName, lastCommit)

      console.log("Submit Response=", repo)
    } catch (e) {
      console.log(e)
    }
    return
  }

  /**
   * Function that reads the branch data and adds them to the ledger
   * @param {string} branchName 
   */
  async addBranch(branchName) {
    try {
      let newBranchString = JSON.stringify(this.GotReader.getBranch(branchName));
      var sentArguments = JSON.stringify(this.user.createArgsMessage(this.GotReader.getAuthor(), this.GotReader.getName(), newBranchString))
      let response = await this.contract.submitTransaction('addNewBranch', sentArguments)
      console.log("Submit Response=", JSON.parse(response.toString()))
    } catch (e) {
      console.log(e)
    }
    return
  }

  /**
   * Function that gets all the repo branches data from the ledger
   */
  async queryBranches() {
    try {
      let response = await this.contract.evaluateTransaction('queryBranches', this.GotReader.getAuthor(), this.GotReader.getName(), this.user.userInfo.userName)
      console.log("Submit Response=", JSON.parse(response.toString()))
    } catch (e) {
      console.log(e)
    }
    return
  }

  /**
   * Function that gets a certain branch data from the ledger
   * @param {string} branchName 
   */
  async queryBranch(branchName) {
    try {
      let response = await this.contract.evaluateTransaction('queryBranch', this.GotReader.getAuthor(), this.GotReader.getName(), branchName, this.user.userInfo.userName)
      console.log("Submit Response=", JSON.parse(response.toString()))
    } catch (e) {
      console.log(e)
    }
    return
  }

  /**
   * Function that retrieves all the latest branch commits after a certain commit
   * @param {string} branchName 
   * @param {string} lastCommit 
   */
  async queryBranchCommits(branchName, lastCommit) {
    try {
      // console.log("last commit "+ lastCommit)
      let response = await this.contract.evaluateTransaction('queryBranchCommits', this.GotReader.getAuthor(), this.GotReader.getName(), branchName, lastCommit, this.user.userInfo.userName)
      console.log("Submit Response=", JSON.parse(response.toString()))
      return JSON.parse(response.toString())
      // return response
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * Function that retrieves that latest branch commit from the ledger
   * @param {string} branchName 
   */
  async queryLastBranchCommit(branchName) {
    try {
      // console.log(this.GotReader.getAuthor(), this.GotReader.getName(), branchName)
      let response = await this.contract.evaluateTransaction('queryLastBranchCommit', this.GotReader.getAuthor(), this.GotReader.getName(), branchName)
      console.log("Submit Response=", response.toString())
      return response.toString()
    } catch (e) {
      console.log(e)
    }
    return
  }


  updateStorage(pulling, logs) {
    //  this.storage.CopyObjects([], pulling)

    // let directoryCID = this.queryDirectoryCID()

    let logsHashes = this.getLogsHashes(logs)

    if (!pulling) {
      this.storage.UploadObjects(logsHashes)
    } else {
      this.storage.DownloadObjects(logsHashes)
    }
    return
  }


  getLogsHashes(logs) {
    let logsHashes = [];
    logs.forEach(commitLog => {
      logsHashes.push(commitLog.Hash);
    });

    return logsHashes;
  }

  /**
   * function that loads the current repo info through the GotReader
   */
  async loadCurrentRepo() {
    await this.GotReader.loadCurrentRepo(this.user.managedRepoAuthor)
  }


  /**
   * Function that updates the GoT remote repo by retrieving all
   * the git objects of the commits following the current branch HEAD
   */
  async updateRemote() {

    console.log("Updating Remote Repo...")

    let lastRemoteCommit = this.GotReader.getCurrentRemoteBranchHEAD()
    // console.log('Last Remote Commit '+ lastRemoteCommit);
    let branchName = this.GotReader.getCurrentBranchName()
    let branchCommits = await this.queryBranchCommits(branchName, lastRemoteCommit.toString('utf8'))

    for (let i = 0; i < branchCommits.length; i++) {

      const commit = branchCommits[i];
      if (commit.encryptionKey == "") {
        console.log("user does not have enough information to reconstrct the requested data")
        process.exit()
      }
      var retrievedSymmericKey = encryption.decryptDate(commit.encryptionKey, this.user.privateKey)
      await this.storage.DownloadObjects(commit.storageHashes, retrievedSymmericKey)
    }
    // copy files from IPFS to remote (.got) >> updateStorage()
    // this.updateStorage(true);

    // update head in remote (.got) >> queryLastBranchCommit() & write to head file in (.got)
    var lastCommit = await this.queryLastBranchCommit(this.GotReader.getCurrentBranchName());
    var fileName = Constants.REMOTE_PATH + 'refs/heads/' + this.GotReader.getCurrentBranchName();

    fs.writeFile(fileName, lastCommit, function (err, result) {
      if (err) console.log('error', err);
    });
  }

  /**
   * Function that takes an array of commits logs and adds them to the ledger
   * @param {{ branchName: string, logs: Array<Object>}} pushlog 
   */

  async addCommits(pushlog) {
    // console.log("trying to add pushlog")
    // console.log(pushlog)
    try {
      var newPushLog = JSON.stringify(pushlog);
      var sentArguments = JSON.stringify(this.user.createArgsMessage(this.GotReader.getAuthor(), this.GotReader.getName(), newPushLog))
      let response = await this.contract.submitTransaction('addCommits', sentArguments)
      console.log("Submit Response=", response.toString())
    } catch (e) {
      console.log(e)
    }
    return
  }

  /**
   * Function that reads the latest local commits and uploads their git objects to IPFS 
   * after encrypting them using the current repo encryption key and then 
   * adds those commits to the ledger
   */
  async remotePostReceive() {

    // console.log("remote POST RECIEVE FUNCTION!!!")
    // for current branch:
    // get last Commit in hyperledger
    let ledgerLastCommit = await this.queryLastBranchCommit(this.GotReader.getCurrentBranchName());
    // console.log("ledgerLastCommit= "+ ledgerLastCommit)

    // let lastRemoteCommit = this.GotReader.getCurrentRemoteBranchHEAD()
    // Reading the latest commits to push to ledger
    let pushlog = await this.GotReader.preparePushLog(ledgerLastCommit)

    // console.log("push log difference= "+ JSON.stringify(pushlog))
    // let logsHashes = this.getLogsHashes(pushlog.logs)
    // sending objects in remote to nodeStorage
    // await this.updateStorage(false, pushlog.logs)
    // find commits in between >>> needs change in contract
    // send commits in between to hyperledger
    let commitHash = '';
    let allObjectsHashes = [];
    let hashCIDMap = {};

    var repoEncryptionKey = JSON.parse(await this.queryCurrentEncryptionKey()).encryptionKey
    var encryptedSymmtricKey
    for (let m in JSON.parse(repoEncryptionKey.toString()).encryptedKeys) {
      if (m == this.user.userInfo.userName) {
        var encryptedSymmtricKey = JSON.parse(repoEncryptionKey.toString()).encryptedKeys[m]
      }
    }
    // console.log(encryptedSymmtricKey)
    if (encryptedSymmtricKey == "" || encryptedSymmtricKey == null) {
      console.log("user is not authorized to edit this repo")
      process.exit()
    }
    var symmetricKey = encryption.decryptDate(encryptedSymmtricKey, this.user.privateKey)


    for (let i = 0; i < pushlog.logs.length; i++) {
      commitHash = pushlog.logs[i].Hash;
      await GitTree.getCommitObjectsHashes(commitHash, allObjectsHashes);
      hashCIDMap = await this.storage.UploadObjects(allObjectsHashes, symmetricKey);

      pushlog.logs[i].StorageHashes = hashCIDMap;
      // console.log(JSON.parse(repoEncryptionKey.toString()).keyHash)
      pushlog.logs[i].encryptionKey = JSON.parse(repoEncryptionKey.toString()).keyHash;

    }

    console.log("Adding commits to GoT ledger........")

    await this.addCommits(pushlog)

    return
  }

  /**
   * Function that updates the remote repo before pushing new local changes
   */
  async localPrePush() {
    await this.updateRemote()
  }



  /**
   * Function that updates the remote repo before pushing new local changes,
   * then, executes a git push,
   * then, pushes the new local changes to ledger and IPFS
   */
  async push() {
    // console.log("BEFORE PRE PUSH!!!")
    await this.localPrePush();
    console.log("Running a git push.....")
    await simpleGit.push("origin", this.GotReader.getCurrentBranchName());
    // console.log("AFTER PUSH!!")
    await this.remotePostReceive();
  }

  /**
   * Function that updates the remote repo with the latest commits from the ledger and IPFS,
   * then, executes a git pull command to sync these changes with the local git repo
   */
  async pull() {
    await this.updateRemote();
    await simpleGit.pull("origin", this.GotReader.getCurrentBranchName());
  }

  // update user >> addUserUpdate
  // create user
  /**
   * Function that adds new user info to the ledger
   * @param {string} userName  new username
   * @param {string} publicKey new user public key
   * @param {*} privateKey user private key used to sign the new user transaction
   * @param {*} showError 
   */
  async createNewUser(userName, publicKey = null, privateKey = null, showError = true) {
    try {
      if (showError) {
        let newUserString = JSON.stringify(this.user.createNewUserMessage(userName, publicKey, privateKey));
        let response = await this.contract.submitTransaction('addUserUpdate', newUserString)
        console.log("Submit Response=", response.toString())
      }
      this.user.storeUserData()
    } catch (e) {
      console.log(e)
    }
    return
  }


  // change username
  /**
   * Function that changes the user name of an existing GoT user
   * @param {string} userName 
   */
  async changeUserName(userName) {
    try {
      let newUserString = JSON.stringify(this.user.changeUserNameMessage(userName));
      let response = await this.contract.submitTransaction('addUserUpdate', newUserString)
      this.user.storeUserData()
      console.log("Submit Response=", response.toString())
    } catch (e) {
      console.log(e)
    }
    return
  }

  // generate new keys
  /**
   * Function that generates new key pairs 
   * @param {string} publicKey 
   * @param {string} privateKey 
   */
  async generateNewKeys(publicKey = null, privateKey = null) {
    try {
      let newUserString = JSON.stringify(this.user.generateNewKeysMessage(publicKey, privateKey));
      let response = await this.contract.submitTransaction('addUserUpdate', newUserString)
      this.user.storeUserData()
      console.log("Submit Response=", response.toString())
    } catch (e) {
      console.log(e)
    }
    return
  }

  // remove user
  /**
   * Function that deletes the current user from GoT
   */
  async removeUser() {
    try {
      let newUserString = JSON.stringify(this.user.removeUserMessage());
      let response = await this.contract.submitTransaction('addUserUpdate', newUserString)
      this.user.storeUserData()
      console.log("Submit Response=", response.toString())
    } catch (e) {
      console.log(e)
    }
    return
  }

  /**
   * Function that gets public key for a user 
  */
  async queryUserPublicKey(userName) {
    try {
      let response = await this.contract.evaluateTransaction('queryUser', userName)
      console.log("Submit Response=", response.toString())
      return JSON.parse(response.toString())
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * Function that gets public keys for a set of users 
   *
   */
  async queryUsersPublicKey(userNames) {
    try {
      let userNamesString = JSON.stringify(userNames);
      let response = await this.contract.evaluateTransaction('queryUsers', userNamesString)
      // console.log("Submit Response=", response.toString())
      return JSON.parse(response.toString())
    } catch (e) {
      console.log(e)
    }
  }


  // update repo access >> updateRepoUserAccess
  // author/repoName username access

  /**
   * Function that updates a certain user access to the current GoT repo
   * @param {string} authorized username of the user whose access to the repo is being updated
   * @param {number} access updated level of access
   * @param {string} encryptionKey key used to encrypt the repo after updated access
   * @param {string} authorizer username of the user who is updating the access
   */
  async updateUserAccess(authorized, access, encryptionKey = null, authorizer = this.user.userInfo.userName) {
    try {
      // var accessInt = parseInt(access, 10);

      // get users with access to repo
      var users = await this.queryUsersAccess(this.GotReader.getAuthor(), this.GotReader.getName())
      var userNames = Object.keys(users)

      // change userName to exclude or include
      if (access == UserAccess.ReovkedAccess) {
        const index = userNames.indexOf(authorized);
        if (index > -1) {
          userNames.splice(index, 1);
        }
      } else {
        userNames.push(authorized)
      }

      var usersInfo = await this.queryUsersPublicKey(userNames)
      var usersKey = {}
      for (let i = 0; i < usersInfo.length; i++) {
        usersKey[usersInfo[i].userName] = usersInfo[i].publicKey
      }
      // var publicKeys = usersInfo.map(x => x["publicKey"])

      //let updateAccessString = JSON.stringify(this.user.createNewUser(userName, publicKey, privateKey));
      let announcementString = JSON.stringify(encryption.createNewSymmetricKeyAnnouncement(usersKey, this.user.privateKey, encryptionKey))
      var sentArguments = JSON.stringify(this.user.createArgsMessage(this.GotReader.getAuthor(), this.GotReader.getName(), authorized, access.toString(), authorizer, announcementString))
      let response = await this.contract.submitTransaction('updateRepoUserAccess', sentArguments)


      console.log("Submit Response=", response.toString())
    } catch (e) {
      console.log(e)
    }
    return
  }


  // get users in a repo >> queryRepoUserAccess
  /**
   * Function that gets the list of users's access to the current repo
   * @param {string} authorName the username of the owner of the repo
   * @param {string} repoName the repo name
   */
  async queryUsersAccess(authorName = this.GotReader.getAuthor(), repoName = this.GotReader.getName()) {
    try {
      let response = await this.contract.evaluateTransaction('queryRepoUserAccess', authorName, repoName)
  
      // console.log("Submit Response=", response.toString())
      let userAccessJSON = JSON.parse(response.toString())
      console.log("Repo Users Access: ")
      for (var userName in userAccessJSON) {
        if (userAccessJSON[userName] == UserAccess.ReadWriteAccess)
          console.log("--->" + userName + " : " + "ReadWriteAccess")
        else if (userAccessJSON[userName] == UserAccess.CollaboratorAccess)
          console.log("--->" +userName + " : " + "CollaboratorAccess")
        else if (userAccessJSON[userName] == UserAccess.OwnerAccess)
          console.log("--->" +userName + " : " + "OwnerAccess")
        else if (userAccessJSON[userName] == UserAccess.ReovkedAccess)
          console.log("--->" +userName + " : " + "ReovkedAccess")

        else if (userAccessJSON[userName] == UserAccess.NeverSetAccess)
          console.log("--->" +userName + " : " + "NeverSetAccess")
      }

      return JSON.parse(response.toString())
    } catch (e) {
      console.log(e)
    }
  }

  // get encryption key >> queryRepo
  async queryCurrentEncryptionKey() {
    try {
      let response = await this.contract.evaluateTransaction('queryRepo', this.GotReader.getAuthor(), this.GotReader.getName())
      console.log("Submit Response=", response.toString())
      // console.log(response)
      return response.toString()
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = {
  Client,
  UserAccess
};
