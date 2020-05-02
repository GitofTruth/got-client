#!/usr/bin/env node

let repoPath = '.';
let path = require('path');
const USER_ID = 'Admin@acme.com';
const simpleGit = require('simple-git')(repoPath);
const gitlog = require('gitlog');

let branchesNames = [];
let branchesContent = [];
currentBranch = "master"

repo = {};
    options =
    {
      repo: repoPath
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


class GotReader {


  

  constructor (branchName){
    currentBranch = branchName
  }

  branchLocalExec(e,d){
    branchesNames = d['all']
    branchesContent = d['branches']

    console.log(branchesNames)

    var branchObjs = {};
    var hashObjs = {};
    for (var branchInd = 0; branchInd < branchesNames.length; branchInd++){
      options['branch'] = branchesNames[branchInd]
      if (branchesContent[branchesNames[branchInd]]['current']){
        currentBranch = branchesNames[branchInd];
      }
      console.log(options)
      const commits = gitlog(options);
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
  }

  async loadCurrentRepo(){
    // this.console.log()
    await simpleGit.branchLocal( this.branchLocalExec);
    // let e = {}
    // let d = {}
    // d["branches"] = []
    // d["all"] = {}
    // this.branchLocalExec(e,d)
  }


  async preparePushLog(remoteLastCommit){
    // wtf?
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

    return pushlog
  }


    // to be set generic >>> stepOne  >>> Done
    getCurrentBranchName(){
        return currentBranch
    }

    getRepo(){
        return repo
    }

    getAuthor(){
        return repo['author']
    }

    getName(){
        return repo['repoName']
    }

    getBranch(branchName){
        return repo['branches'][branchName]
    }
}

function toTimestamp(strDate){
  var datum = Date.parse(strDate);
  return datum/1000;
}


module.exports = GotReader;