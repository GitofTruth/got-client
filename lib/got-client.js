#!/usr/bin/env node

// internal imports
// var Constants = require("constants");
const CONNECTION_PROFILE_PATH = '.gotconfig/profiles/dev-connection.yaml';
const FILESYSTEM_WALLET_PATH = '.gotconfig/user-wallet';

const USER_ID = 'Admin@acme.com';
const NETWORK_NAME = 'airlinechannel';
const CONTRACT_ID = "GoT";

const repoPath = '.';
var repo = {};
var branchesNames = [];
var branchesContent = [];
var gateway, network, contract;


var remoteObjs = ".got/objects/"
var defStoragePath = "../../Storage/"
var excptList = ["info", "pack"]

var currentBranch = "master"



var options =
{ repo: repoPath
, branch: 'master'
, number: 10
, fields:
  [ 'subject'
  , 'authorName'
  , 'committerName'
  , 'authorDate'
  , 'hash'
  , 'parentHashes'
  ]
, execOptions:
  { maxBuffer: 1000 * 1024,
    status: false
  }
};

// imports
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

const { Gateway, FileSystemWallet, DefaultEventHandlerStrategies, Transaction  } = require('fabric-network');

const gitlog = require('gitlog');

const simpleGit = require('simple-git')(repoPath);

const { join } = require("path")




class Client {

  constructor (){
  }

  async loadCurrentRepo(){
    await simpleGit.branchLocal(function(e,d){
      branchesNames = d['all']
      branchesContent = d['branches']

      var branchObjs = {};
      var hashObjs = {};
      for (var branchInd = 0; branchInd < branchesNames.length; branchInd++){
        options['branch'] = branchesNames[branchInd]
        if (branchesContent[branchesNames[branchInd]]['current']){
          currentBranch = branchesNames[branchInd];
        }
        // console.log(options)
        let commits = gitlog(options);
        var commObjs = {};

        // console.log(d)
        // console.log(branchesNames[branchInd])
        // console.log(branchesContent)
        // console.log(commits)

        for(var i = 0; i < commits.length; i++) {
            hashObjs[commits[i].hash]={}
            commObjs[commits[i].hash] = {
                Message : commits[i].subject,
                Author : commits[i].authorName,
                Committer  : commits[i].committerName,
                CommitterTimestamp  : toTimestamp(commits[i].authorDate),
                Hash      : commits[i].hash,
                Parenthashes : [commits[i].parentHashes],
                Signature   : null
               }
        }

        var newBranch = {
            branchName: branchesNames[branchInd],
            author: USER_ID,
            timestamp: 1,
            logs: commObjs
        }
        branchObjs[newBranch.branchName] = newBranch
      }

      repo = {
        repoName: path.basename(path.resolve(process.cwd())),
        author: USER_ID,
        timeStamp: 0,
        hashes: hashObjs,
        branches: branchObjs
      };

      // console.log(USER_ID)
      // console.log(repo)
    });
  }

  async addRepo(){
    try{
        console.log("sending this repo:", repo)
        let newRepoString = JSON.stringify(repo);
        let response = await contract.submitTransaction('addNewRepo', newRepoString)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryRepo(){
    try{
        let response = await contract.evaluateTransaction('queryRepo', repo['author'], repo['repoName'])
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async cloneRepo(){
    try{
        let response = await contract.evaluateTransaction('clone', repo['author'], repo['repoName'])
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async addBranch(branchName){
    try{
        let newBranchString = JSON.stringify(repo['branches'][branchName]);
        let response = await contract.submitTransaction('addNewBranch', repo['author'], repo['repoName'], newBranchString)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryBranches(){
    try{
        let response = await contract.evaluateTransaction('queryBranches', repo['author'], repo['repoName'])
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryBranch(branchName){
    try{
        let response = await contract.evaluateTransaction('queryBranch', repo['author'], repo['repoName'], branchName)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  // stepTwo
  async addCommits(remoteLastCommit){

    options['branch'] = this.getCurrentBranchName()
    var commits = gitlog(options);

    var commObjs = []
    for(var i = 0; i < commits.length && commits[i].hash != remoteLastCommit; i++) {
        commObjs.push({
            Message : commits[i].subject,
            Author : commits[i].authorName,
            Committer  : commits[i].committerName,
            CommitterTimestamp  : toTimestamp(commits[i].authorDate),
            Hash      : commits[i].hash,
            Parenthashes : [commits[i].parentHashes],
            Signature   : null
          });
    }

    var pushlog = {
      branchName: this.getCurrentBranchName(),
      logs: commObjs
    }

    console.log("trying to add pushlog")
    try{
        var newPushLog = JSON.stringify(pushlog);
        console.log(pushlog)
        console.log(newPushLog)
        let response = await contract.submitTransaction('addCommits', repo['author'], repo['repoName'], newPushLog)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryBranchCommits(branchName, lastCommit){
    try{
        let response = await contract.evaluateTransaction('queryBranchCommits', repo['author'], repo['repoName'], branchName, lastCommit)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryLastBranchCommit(branchName){
    try{
        let response = await contract.evaluateTransaction('queryLastBranchCommit', repo['author'], repo['repoName'], branchName)
        console.log("Submit Response=",response.toString())
        return response.toString()
    } catch(e){
        console.log(e)
    }
    return
  }

  // to be set generic >>> stepOne  >>> Done
  getCurrentBranchName(){
    return currentBranch
  }

  updateStorage(pulling){
    CopyObjects([], pulling)
      return
  }

  async updateRemote(){
    // copy files from nodeStorage to remote (.got) >> updateStorage()
    this.updateStorage(true);

    // update head in remote (.got) >> queryLastBranchCommit() & write to head file in (.got)
    var lastCommit = await this.queryLastBranchCommit(this.getCurrentBranchName());
    var fileName = '.got/refs/heads/' + this.getCurrentBranchName();

    fs.writeFile(fileName, lastCommit, function(err, result) {
      if(err) console.log('error', err);
    });
  }

  //stepThree
  async remotePostReceive(branchName){
    // sending objects in remote to nodeStorage
    this.updateStorage(false)

    // for current branch:
      // get last Commit in hyperledger
      // get last Commit in Remote
      var lastCommit = await this.queryLastBranchCommit(this.getCurrentBranchName());

      // find commits in between >>> needs change in contract
      // send commits in between to hyperledger
      await this.addCommits(lastCommit)
      return
  }

  async localPrePush(){
    await this.updateRemote()
  }

  async push(){
    await this.localPrePush();
    await simpleGit.push();
    await this.remotePostReceive(this.getCurrentBranchName());
  }

  // StepFour
  // when ???????
  async pull(){
    await this.updateRemote();
    await simpleGit.pull();
  }
}

async function setupGateway(){
  // 2.1 load the connection profile into a JS object
  let connectionProfile = yaml.safeLoad(fs.readFileSync(CONNECTION_PROFILE_PATH, 'utf8'));

  // 2.2 Need to setup the user credentials from wallet
  const wallet = new FileSystemWallet(FILESYSTEM_WALLET_PATH);

  // 2.3 Set up the connection options
  let connectionOptions = {
      identity: USER_ID,
      wallet: wallet,
      discovery: { enabled: false, asLocalhost: true }
  };

  await gateway.connect(connectionProfile, connectionOptions);
}

function ListFiles(testFolder){
  let files = []
  fs.readdirSync(testFolder).forEach(file => {
    if( excptList.indexOf(file) > -1){
    }else {
      files = [... files, file]
      // console.log(file);
    }
  });

  return files
}


function GetObjectsName(objHomeDirectory) {
  let names = []
  let dirs = ListFiles(objHomeDirectory)
  dirs.forEach(d => {
    files = ListFiles(objHomeDirectory + d + "/")
    files.forEach(f => {
      names = [...names, d + f]
    })
  })

  return names;
}

function CopyObjects(namesList = [],pulling = true, sourcePath = defStoragePath){
  let destinationPath = remoteObjs
  if (!pulling){
    let temp = sourcePath
    sourcePath = destinationPath
    destinationPath = temp
  }else {
  }

  console.log("Starting copying files ... to storage")
  console.log("The source Path: " + sourcePath)
  console.log("The destination Path: " + destinationPath)
  let sourceObjs = GetObjectsName(sourcePath)
  let destinationObjs = GetObjectsName(destinationPath)
  let missing = []

  if (namesList.length <= 0){
    namesList = sourceObjs
  }

  if (namesList.length > 0){
    namesList.forEach(n => {
      if(destinationObjs.indexOf(n) == -1){
        missing = [...missing, n]
      }
    })
  }else{
    missing = namesList
  }

  console.log("Found source Objects: ")
  console.log(sourceObjs)
  console.log("Found destination objects Objects: ")
  console.log(destinationObjs)
  console.log("Missing destination Objects: ")
  console.log(missing)

  missing.forEach( m => {
    if (!fs.existsSync(destinationPath + m.substring(0,2))){
      fs.mkdirSync(destinationPath + m.substring(0,2));
    }
    if(!fs.existsSync(destinationPath + m.substring(0,2) + "/" + m.substring(2))){
      fs.copyFileSync(sourcePath + m.substring(0,2) + "/" + m.substring(2), destinationPath + m.substring(0,2) + "/" + m.substring(2)
      // , (err) => {
      // if (err) throw err;
      // console.log(m + " was added to bare repo");
      // }
    );
    }
  })
  console.log("Done copying files ... to storage\n\n")
}

function toTimestamp(strDate){
    var datum = Date.parse(strDate);
    return datum/1000;
}

async function main(){
  gateway = new Gateway();
  await setupGateway();
  network = await gateway.getNetwork(NETWORK_NAME);
  contract = await network.getContract(CONTRACT_ID);
  var client = new Client();
  await client.loadCurrentRepo();

  console.log("entered command: ", process.argv[2])

  switch (process.argv[2]) {
    case "addRepo":
      await client.addRepo();
      break;

    case "push":
      await client.push();
      break;

    case "pull":
      await client.pull();
      break;

    default:
      console.log("undefined command: ", process.argv, "  !");
  }




  // await client.queryRepo();
  // await client.cloneRepo();
  // await client.queryBranches();
  // await client.queryLastBranchCommit("master");

  process.exit();
  return 0;
}

main();
