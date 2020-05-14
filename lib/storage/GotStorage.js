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

/**
 * A class for interacting with the ipfs client and handling git objects 
 */

class GotStorage {
  // localStoragePath = "";
  // remoteRepoPath = "";

 /**
  * Creates new instance of the GotStorage class
  */
  constructor() {
  }



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

  /**
   * Prepares a list of the git objects local paths
   * @param {Array<string>} logsHashes  list of objects hashes 
   * @returns {Array<string>} list of objects paths
   */
  prepareObjectsPath(logsHashes) {
    let gotObjectsPaths = []
    logsHashes.forEach(logHash => {

      let objectName = logHash.substring(2, logHash.length)
      let objectDirectory = logHash.substring(0, 2)

      let objectPath = path.join(Constants.REMOTE_PATH+"objects", objectDirectory, objectName)

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


  /**
   * Uploads multiple git objects to IPFS Cluster
   * @param {Array<string>} objectsHashes - list of objects hashes to upload to IPFS
   * @param {string} symmetricKey - the key used to encrypt the git objects
   */
  async UploadObjects(objectsHashes, symmetricKey) {

    let gotObjectsPaths = this.prepareObjectsPath(objectsHashes)

    // console.log("gotObjectsPaths = " + gotObjectsPaths)

    // upload objects
    let hashCIDMap = await ipfsClient.addFilesCluster(gotObjectsPaths, symmetricKey)

    return hashCIDMap
  }


  /**
   * Download multiple git objects from IPFS
   * @param {Object.<string,string>} objectsMap a dictionary of objects paths (key) and objects IPFS CIDs (value)
   * @param {string} symmetricKey key used to decrypt the git objects
   */
  async DownloadObjects(objectsMap, symmetricKey) {

    await ipfsClient.getFilesIPFS(objectsMap, symmetricKey);

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
