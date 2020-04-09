#!/usr/bin/env node


const {path, join} = require('path');


var remoteObjs = ".got/objects/"
var defStoragePath = "../../Storage/"
var excptList = ["info", "pack"]


class GotStorage {
    localStoragePath = "";
    remoteRepoPath = "";

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
    let dirs = ListFiles(objHomeDirectory)
    dirs.forEach(d => {
        files = ListFiles(objHomeDirectory + d + "/")
        files.forEach(f => {
        names = [...names, d + f]
        })
    })

    return names;
    }

    // if true updates .got
    // if true: copy files from nodeStorage to remote (.got) >> updateStorage()
    CopyObjects(namesList = [],pulling = true, sourcePath = defStoragePath){
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


}
module.exports = GotStorage;