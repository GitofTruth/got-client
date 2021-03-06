/**
 * IPFS Client Module for adding Git Objects to IPFS Cluster
 * and retrieving Git objects from IPFS.
 * @module ipfs-client
 */
const ipfsClient = require('ipfs-http-client');
const ipfsCluster = require('ipfs-cluster-api');
const { exec } = require("child_process");
const encryption = require('../common/encryption');
const path = require('path');


const fs = require('fs');

const BufferList = require('bl/BufferList')
const save = require('save-file')


const cluster = ipfsCluster(
  {
    host: '13.84.154.252',
    // host: '0.0.0.0',
    port: '9094',
    protocol: 'http'
  }
);

var ipfs = new ipfsClient(
  {
    host: '0.0.0.0',
    // host: '13.84.154.252',
    port: '5001',
    protocol: 'http'
  }
);

const { spawnSync } = require('child_process');



async function addAllGitObjects(directoryPath) {

  // const file =  fs.readFileSync(directoryPath);
  var allFiles = [];


  fs.readdirSync(directoryPath).forEach(function (innerDirName) {

    innerDirPath = "" + directoryPath + "/" + innerDirName;

    fs.readdirSync(innerDirPath).forEach(function (file) {

      filePath = "" + innerDirPath + "/" + file;
      const fileContent = fs.readFileSync(filePath);

      allFiles.push({
        path: filePath,
        content: fileContent
      });
    })
  });

  let response;

  try {

    response = await cluster.add(
      allFiles,
      {
        "replication-min": 1,
        "replication-max": 2,
        "recursive": true
      });

    console.log(response[response.length - 3].hash)

    return response[response.length - 3].hash;


  } catch (e) {
    console.error(e);
  }

}

/**
 * Lists all directories and files paths under a certain IPFS directory
 * @param {string} cid - Multihash (CID) of an IPFS directory
 * @returns {{ allDirsNames: Array<string>,
    allFilesNames: Array<string>,
    allObjectsHashes: Array<string>}}
 */
async function listGitObjects(cid) {
  let allFiles = [];
  let allDirs = [];
  let allHashes = [];

  for await (const dir of ipfs.ls(cid)) {
    console.log(dir)

    allDirs.push(dir.name);


    for await (const file of ipfs.ls(dir.path)) {
      console.log(file)

      allFiles.push(file.name)
      allHashes.push(dir.name + file.name)
    }
  }

  return {
    allDirsNames: allDirs,
    allFilesNames: allFiles,
    allObjectsHashes: allHashes
  };

}



async function getMissingGitObjects(directoryCID, objectsHashes, localPath) {

  for (let obj in objectsHashes) {
    await getGitObject(directoryCID, obj.substring(0, 2), obj.substring(2))
  }
}




async function addGitObject(directoryPath, innerDirectoryName, fileName) {


  filePath = "" + directoryPath + "/" + innerDirectoryName + "/" + fileName;
  const fileContent = fs.readFileSync(filePath);

  let file = {
    path: filePath,
    content: fileContent
  };

  cluster.add(
    file,
    {
      "replication-min": 1,
      "replication-max": 2,
      "recursive": true
    }
    , (err, result) => {
      err ? console.error(err) : console.log(result)

    })

}


async function addMissingGitObjects(directoryPath, objectsHashes) {


  for (let obj in objectsHashes) {
    await addGitObject(directoryPath, obj.substring(0, 2), obj.substring(2))
  }
}


async function getAllGitObjects(directoryCID, localPath) {

  for await (const file of ipfs.get(directoryCID)) {
    // console.log(file.path)
    console.log(file)

    if (!file.content) {

      if (!fs.existsSync(file.path)) {
        // Do something
        fs.mkdir(file.path,
          { recursive: true }, (err) => {
            if (err) {
              return console.error(err);
            }
            console.log('Directory created successfully!');
          });

      }
      continue;
    }

    const content = new BufferList()
    for await (const chunk of file.content) {
      content.append(chunk)
    }

    console.log(content)


    fs.writeFile(file.path, content, (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;

      // success case, the file was saved
      console.log('file saved!');
    });


  }

  if (localPath) {
    try {
      fs.renameSync('./' + directoryCID, localPath)
      console.log("Successfully renamed the directory.")
    } catch (err) {
      console.log(err)
    }
  }


}


async function getGitObject(directoryCID, innerDirectoryName, fileName) {

  // if (!localPath){
  //     localPath = ""
  // }

  // console.log(process.cwd())
  process.chdir('./.got');
  // console.log(process.cwd())

  try {
    const child = spawnSync("ipfs", ["get", directoryCID + '/' + innerDirectoryName + '/' + fileName]);
    console.log('error', child.error);
    console.log('stdout ', child.stdout);
    console.log('stderr ', child.stderr);
    // console.log("Doneeeeeeeeeeee")
  } catch (err) {
    console.log(err)
  }

  process.chdir('../');


}


/**
 * Encrypts a single file using a default key and then adds it to IPFS cluster
 * @param {string} directoryPaths - local file path
 * @returns {string} - IPFS Multihash of the uploaded file (CID) 
 */
async function addFileCluster(directoryPath) {

  console.log("Adding files to cluster")
  const fileContent = fs.readFileSync(directoryPath);


  let base64Content = new Buffer.from(fileContent, 'binary').toString('base64');

  const fileContentEnc = encryption.symmetricEnc(base64Content);

  const fileContentBuffer = Buffer.from(fileContentEnc, 'utf8');



  let response;

  try {

    response = await cluster.add(
      {
        path: directoryPath,
        content: fileContentBuffer
      },
      {
        "replication-min": 1,
        "replication-max": 2,
        "recursive": true
      });

    console.log(response)

    // const CID = response[0].hash;

    // cluster.status(CID, (err, res) => {
    //   err ? console.error(err) : console.log(res)
    // })

    return response[0].hash;


  } catch (e) {
    console.error(e);
  }

}


/**
 * Encrypts multiple files and then adds them to IPFS cluster
 * @param {Array<string>} directoryPaths - list of files paths to upload
 * @param {string} symmetricKey - key used for encryption of files
 * @returns {Object.<string, string>} a dictionary of objects IPFS CIDs (Key--> directoryPath, Value --> fileCID) 
 */
async function addFilesCluster(directoryPaths, symmetricKey) {

  let allContent = []

  let hashes = {}

  console.log("Adding files to cluster");
  for (var i = 0; i < directoryPaths.length; i++) {


    const fileContent = fs.readFileSync(directoryPaths[i]);

    let base64Content = new Buffer.from(fileContent, 'binary').toString('base64');
    const fileContentEnc = encryption.symmetricEnc(base64Content, symmetricKey);
    const fileContentBuffer = Buffer.from(fileContentEnc, 'utf8');

    allContent.push(
      {
        path: directoryPaths[i],
        content: fileContentBuffer
      });

  }



  let response;

  try {

    response = await cluster.add(
      allContent,
      {
        "replication-min": 1,
        "replication-max": 2,
        "recursive": true
      });

    // console.log(response)

    // const CID = response[0].hash;

    // cluster.status(CID, (err, res) => {
    //   err ? console.error(err) : console.log(res)
    // })

    for (let i = 0; i < directoryPaths.length; i++) {
      //  const element = response[i];

      hashes[directoryPaths[i]] = response[i].hash;

    }

    return hashes


  } catch (e) {
    console.error(e);
  }

}

/**
 * Function used to retrieve a single file from IPFS node
 * @param {string} CID - IPFS hash of the git object used (content identifier)
 * @param {string} localPath - Path used for saving the retrieved git object
 * @param {string} symmetricKey - key used for decrypting the retrieved file
 * @returns {void}
 */
async function getFileIPFS(CID, localPath, symmetricKey) {


  if (!localPath) {
    localPath = ""
  }

  for await (const file of ipfs.get(CID)) {
    // console.log(file.path)
    // console.log(file)

    if (!file.content) {

      if (!fs.existsSync(file.path)) {
        // Do something
        fs.mkdir(file.path,
          { recursive: true }, (err) => {
            if (err) {
              return console.error(err);
            }
            // console.log('Directory created successfully!');
          });

      }
      continue;
    }

    // const content = new BufferList()
    let contentStr = '';
    for await (const chunk of file.content) {
      // content.append(chunk)
      contentStr += chunk.toString('utf8');
    }

    // console.log(content)

    // console.log(contentStr);

    contentStrDec = encryption.symmetricDec(contentStr, symmetricKey);



    fs.mkdirSync(path.dirname(localPath), { recursive: true });


    fs.writeFile(localPath, contentStrDec, 'base64', (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;

      // success case, the file was saved
      console.log('file saved!');
    });

  }

}

/**
 * Function used to retrieve a single file from IPFS node
 * @param {Object.<string, string>} filesMap - a dictionary of objects IPFS CIDs (Key--> directoryPath, Value --> fileCID) 
 * @param {string} symmetricKey - key used for decryption of files
 * @returns {void}
 */
async function getFilesIPFS(filesMap, symmetricKey) {
  for (var filePath in filesMap) {
    await getFileIPFS(filesMap[filePath], filePath, symmetricKey);
  }
}



module.exports = {
  addAllGitObjects,
  addGitObject,
  addMissingGitObjects,
  listGitObjects,
  getAllGitObjects,
  getGitObject,
  getMissingGitObjects,
  addFileCluster,
  getFileIPFS,
  addFilesCluster,
  getFilesIPFS


};
