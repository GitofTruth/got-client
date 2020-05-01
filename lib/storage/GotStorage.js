#!/usr/bin/env node

const path= require('path');

const ipfsClient = require('./ipfs-client');

var remoteObjs = ".got/objects/"
var defStoragePath = "./.got/objects"
var excptList = ["info", "pack"]

const fs = require('fs');


var rmdir = function(dir) {

  if (fs.existsSync(dir)){
  var list = fs.readdirSync(dir);
  for(var i = 0; i < list.length; i++) {
      var filename = path.join(dir, list[i]);
      var stat = fs.statSync(filename);

      if(filename == "." || filename == "..") {
          // pass these files
      } else if(stat.isDirectory()) {
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

    constructor(localStoragePath, remoteRepoPath){
      this.localStoragePath = localStoragePath
      this.remoteRepoPath = remoteRepoPath
    }


    // directoryCID = addAllGitObjects("directoryPath", "");
    // getAllGitObjects(directoryCID, localPath){}
    // getGitObject(directoryCID, innerDirectoryName, fileName, localPath){}
    // addGitObject(directoryCID, innerDirectoryName, fileName, localPath){}
    // removeGitObject(directoryCID, innerDirectoryName, fileName){}
    // removeAllGitObjects(directoryCID){}


    ListFiles(testFolder){
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

    async InitializeObjectsIPFS(objectsPath = defStoragePath){
      console.log("Adding to ipfs cluster")
      let directoryCID = await ipfsClient.addAllGitObjects(objectsPath)
      console.log("directoryCID " + directoryCID)
      console.log("Added to ipfs  cluster")
      return directoryCID
    }

    async InitializeObjectsLocal(directoryCID, objectsPath = defStoragePath){

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


    async UploadObjects(directoryCID, namesList=[], objectsPath = defStoragePath){
      let gotObjects = this.GetObjectsName(objectsPath)
      let ipfsObjects = (await ipfsClient.listGitObjects(directoryCID)).allObjectsHashes

      let missingObjects = []

      for (let obj in gotObjects){
        if (typeof ipfsObjects[obj] === 'undefined' && ( namesList.length <=0  || !(typeof namesList[obj] === 'undefined')) ){
          missingObjects.push(obj)
        }
      }

      // upload objects
      await ipfsClient.addMissingGitObjects(directoryCID, missingObjects, objectsPath)

    }


    async DownloadObjects( directoryCID, namesList=[], objectsPath = defStoragePath){
      let gotObjects = this.GetObjectsName(objectsPath)
      let ipfsObjects = (await ipfsClient.listGitObjects(directoryCID)).allObjectsHashes

      let missingObjects = []

      for (let obj in ipfsObjects){
        if (typeof gotObjects[obj] === 'undefined' && ( namesList.length <=0  || !(typeof namesList[obj] === 'undefined')) ){
          missingObjects.push(obj)
        }
      }

      // you got the missing objects
      await ipfsClient.getMissingGitObjects(directoryCID, missingObjects, objectsPath)
    }




    // if true updates .got
    // if true: copy files from nodeStorage to remote (.got) >> updateStorage()
     async CopyObjects(namesList = [],pulling , sourcePath = defStoragePath){
        let destinationPath = remoteObjs
        let directoryCID;
        if (!pulling){
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

        return directoryCID;
    }


}
module.exports = GotStorage;