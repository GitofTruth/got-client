#!/usr/bin/env node

const path = require('path');

const ipfsClient = require('./ipfs-client');

const Constants = require('../common/constants')

var remoteObjs = ".got/remote/objects"
var defStoragePath = Constants.REMOTE_PATH + "objects"
var excptList = ["info", "pack"]

const fs = require('fs');


var rmdir = function (dir) {

  if (fs.existsSync(dir)) {
    var list = fs.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
      var filename = path.join(dir, list[i]);
      var stat = fs.statSync(filename);

      if (filename == "." || filename == "..") {
        // pass these files
      } else if (stat.isDirectory()) {
        // rmdir recursively
        rmdir(filename);
      } else {
        // rm fiilename
        fs.unlinkSync(filename);
      }
    }

    fs.rmdirSync(dir);
  }
};

class GotStorage {
  // localStoragePath = "";
  // remoteRepoPath = "";

  constructor(localStoragePath, remoteRepoPath) {
    this.localStoragePath = localStoragePath
    this.remoteRepoPath = remoteRepoPath
  }


  // directoryCID = addAllGitObjects("directoryPath", "");
  // getAllGitObjects(directoryCID, localPath){}
  // getGitObject(directoryCID, innerDirectoryName, fileName, localPath){}
  // addGitObject(directoryCID, innerDirectoryName, fileName, localPath){}
  // removeGitObject(directoryCID, innerDirectoryName, fileName){}
  // removeAllGitObjects(directoryCID){}


  ListFiles(testFolder) {
    let files = []
    fs.readdirSync(testFolder).forEach(file => {
      if (excptList.indexOf(file) > -1) {
      } else {
        files = [...files, file]
        // console.log(file);
      }
    });

    return files
  }


  GetObjectsName(objHomeDirectory) {
    let names = []
    let files = []
    let dirs = this.ListFiles(objHomeDirectory)
    dirs.forEach(d => {
      files = this.ListFiles(objHomeDirectory + d + "/")
      files.forEach(f => {
        names = [...names, d + f]
      })
    })

    return names;
  }

  prepareObjectsPath(logsHashes) {
    let gotObjectsPaths = []
    logsHashes.forEach(logHash => {

      let objectName = logHash.substring(2, logHash.length)
      let objectDirectory = logHash.substring(0, 2)

      let objectPath = path.join(objectsPath, objectDirectory, objectName)

      gotObjectsPaths.push(objectPath)

    });

    return gotObjectsPaths

  }

  async InitializeObjectsIPFS(objectsPath = defStoragePath) {
    console.log("Adding to ipfs cluster")

    let directoryCID = await ipfsClient.addAllGitObjects(objectsPath)
    console.log("directoryCID " + directoryCID)
    console.log("Added to ipfs  cluster")
    return directoryCID
  }

  async InitializeObjectsLocal(directoryCID, objectsPath = defStoragePath) {

    rmdir(objectsPath)
    console.log("Getting from ipfs cluster")
    await ipfsClient.getAllGitObjects(directoryCID, objectsPath)
    console.log(process.cwd())
    console.log("Retrieved from ipfs cluster")
    // try {
    //   fs.renameSync('./.got/' + directoryCID, objectsPath)
    //   console.log("Successfully renamed the directory.")
    // } catch(err) {
    //   console.log(err)
    // }

  }


  async UploadObjects(objectsHashes) {

    let gotObjectsPaths = this.prepareObjectsPath(objectsHashes)

    // upload objects
    let hashCIDMap = await ipfsClient.addFilesCluster(gotObjectsPaths)

    return hashCIDMap
  }


  async DownloadObjects(objectsMap) {

    await ipfsClient.getFilesIPFS(objectsMap);

    return
    
  }




  // if true updates .got
  // if true: copy files from nodeStorage to remote (.got) >> updateStorage()
  async CopyObjects(namesList = [], pulling, sourcePath = defStoragePath) {
    let destinationPath = remoteObjs
    let directoryCID;
    if (!pulling) {
      let temp = sourcePath
      sourcePath = destinationPath
      destinationPath = temp

      // console.log("Here pulling!")
      console.log("Adding to ipfs cluster")
      directoryCID = await ipfsClient.addAllGitObjects("./.git/objects")
      console.log("Added to ipfs cluster")
    }
    //  else {

    // }



    // if(!pulling)
    //   { 

    //   }else{
    //   }


    console.log("Starting copying files ... to storage")
    console.log("The source Path: " + sourcePath)
    console.log("The destination Path: " + destinationPath)
    let sourceObjs = this.GetObjectsName(sourcePath)
    let destinationObjs = this.GetObjectsName(destinationPath)
    let missing = []

    if (namesList.length <= 0) {
      namesList = sourceObjs
    }

    if (namesList.length > 0) {
      namesList.forEach(n => {
        if (destinationObjs.indexOf(n) == -1) {
          missing = [...missing, n]
        }
      })
    } else {
      missing = namesList
    }

    console.log("Found source Objects: ")
    console.log(sourceObjs)
    console.log("Found destination objects Objects: ")
    console.log(destinationObjs)
    console.log("Missing destination Objects: ")
    console.log(missing)

    missing.forEach(m => {
      if (!fs.existsSync(destinationPath + m.substring(0, 2))) {
        fs.mkdirSync(destinationPath + m.substring(0, 2));
      }
      if (!fs.existsSync(destinationPath + m.substring(0, 2) + "/" + m.substring(2))) {
        fs.copyFileSync(sourcePath + m.substring(0, 2) + "/" + m.substring(2), destinationPath + m.substring(0, 2) + "/" + m.substring(2)
          // , (err) => {
          // if (err) throw err;
          // console.log(m + " was added to bare repo");
          // }
        );
      }
    })
    console.log("Done copying files ... to storage\n\n")

    return directoryCID;
  }


}
module.exports = GotStorage;