#!/usr/bin/env node

// internal imports
const CONNECTION_PROFILE_PATH = '.gotconfig/profiles/dev-connection.yaml';
const FILESYSTEM_WALLET_PATH = '.gotconfig/user-wallet';

const USER_ID = 'Admin@acme.com';
const NETWORK_NAME = 'airlinechannel';
const CONTRACT_ID = "GoT";

var gateway, network, contract;


const fs = require('fs');
const yaml = require('js-yaml');

const { Gateway, FileSystemWallet, DefaultEventHandlerStrategies, Transaction  } = require('fabric-network');


// other package classes
const GotStorage = require('./GotStorage.js')
const GotReader = require('./GotReader.js')

let repoPath = '.';
const simpleGit = require('simple-git')(repoPath);



class Client {

  constructor (){
    this.storage = new GotStorage("","");
    this.GotReader = new GotReader("master")
  }


  async addRepo(){
    try{
        console.log("sending this repo:", this.GotReader.getRepo())
        let newRepoString = JSON.stringify(this.GotReader.getRepo());
        let response = await contract.submitTransaction('addNewRepo', newRepoString)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryRepo(){
    try{
        let response = await contract.evaluateTransaction('queryRepo', this.GotReader.getAuthor(), this.GotReader.getName())
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async cloneRepo(){
    try{
        let response = await contract.evaluateTransaction('clone', this.GotReader.getAuthor(), this.GotReader.getName())
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async addBranch(branchName){
    try{
        let newBranchString = JSON.stringify(this.GotReader.getBranch(branchName));
        let response = await contract.submitTransaction('addNewBranch', this.GotReader.getAuthor(), this.GotReader.getName(), newBranchString)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryBranches(){
    try{
        let response = await contract.evaluateTransaction('queryBranches', this.GotReader.getAuthor(), this.GotReader.getName())
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryBranch(branchName){
    try{
        let response = await contract.evaluateTransaction('queryBranch', this.GotReader.getAuthor(), this.GotReader.getName(), branchName)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryBranchCommits(branchName, lastCommit){
    try{
        let response = await contract.evaluateTransaction('queryBranchCommits', this.GotReader.getAuthor(), this.GotReader.getName(), branchName, lastCommit)
        console.log("Submit Response=",response.toString())
    } catch(e){
        console.log(e)
    }
    return
  }

  async queryLastBranchCommit(branchName){
    try{
        let response = await contract.evaluateTransaction('queryLastBranchCommit', this.GotReader.getAuthor(), this.GotReader.getName(), branchName)
        console.log("Submit Response=",response.toString())
        return response.toString()
    } catch(e){
        console.log(e)
    }
    return
  }


  updateStorage(pulling){
    this.storage.CopyObjects([], pulling)
      return
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

  //stepThree
  async remotePostReceive(branchName){
    // sending objects in remote to nodeStorage
    this.updateStorage(false)

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
    await this.localPrePush();
    await simpleGit.push();
    await this.remotePostReceive(this.GotReader.getCurrentBranchName());
  }

  async pull(){
    await this.updateRemote();
    await simpleGit.pull();
  }
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
    
    case "test":
      console.log("Test zy el fol");
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


function toTimestamp(strDate){
    var datum = Date.parse(strDate);
    return datum/1000;
}



main();



