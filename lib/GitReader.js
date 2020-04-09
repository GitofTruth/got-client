#!/usr/bin/env node

repoPath = '.';
const gitlog = require('gitlog');
const simpleGit = require('simple-git')(repoPath);


class GitReader {
  constructor (branchName){
    this.currentBranch = branchName

    this.repo = {};
    this.branchesNames = [];
    this.branchesContent = [];
    this.currentBranch = "master"
    
    this.options =
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
  }

  branchLocalExec(e,d){
    this.branchesNames = d['all']
    this.branchesContent = d['branches']

    console.log(this.branchesNames)

    var branchObjs = {};
    var hashObjs = {};
    for (var branchInd = 0; branchInd < this.branchesNames.length; branchInd++){
      this.options['branch'] = this.branchesNames[branchInd]
      if (this.branchesContent[this.branchesNames[branchInd]]['current']){
        this.currentBranch = this.branchesNames[branchInd];
      }
      // console.log(options)
      let commits = gitlog(this.options);
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

    this.repo = {
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
  }

  // stepTwo
  async addCommits(remoteLastCommit){

    this.options['branch'] = this.repo.getCurrentBranchName()
    var commits = gitlog(this.options);

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


    // to be set generic >>> stepOne  >>> Done
    getCurrentBranchName(){
        return currentBranch
    }

    getRepo(){
        return this.repo
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

module.exports = GitReader;