
const ipfsClient = require('ipfs-http-client');
const ipfsCluster = require('ipfs-cluster-api');
const { exec } = require("child_process");


// const bodyParser = require('body-parser');
const fs = require('fs');

const BufferList = require('bl/BufferList')
const save = require('save-file')

 
const cluster =  ipfsCluster(
    { 
        host: '0.0.0.0', 
        port: '9094',
        protocol: 'http' 
    }
    );

    var ipfs = new ipfsClient(
        {
            host: '0.0.0.0',
            port: '5001',
            protocol: 'http'
        }
    );
    



// addAllGitObjects(process.argv[2])


async function addAllGitObjects(directoryPath){

  // const file =  fs.readFileSync(directoryPath);
  var allFiles=[];
  var allHashes={};


  fs.readdirSync(directoryPath).forEach(function(innerDirName) {

      innerDirPath =  "" + directoryPath + "/" + innerDirName;

      fs.readdirSync(innerDirPath).forEach(function(file)
      {

      filePath =  "" + innerDirPath + "/" + file;
      const fileContent = fs.readFileSync(filePath);

      allFiles.push({
          path: filePath,
          content: fileContent
      });
  })
    });

    let response;

    try{

      console.log(allFiles)

      response = await cluster.add(
      allFiles,
    {
      "replication-min" : 1,
      "replication-max" : 2,
      "recursive": true
      });

      // console.log(response)

  
      for (var i = 0; i < response.length; i++) {
        console.log(response[i]);
      
        if(fs.lstatSync(response[i].path).isFile())
          // TODO : only hash name
          allHashes[response[i].path] = response[i].hash;
      }

      // const CID = response[response.length-1].hash;

      // cluster.status(CID, (err, res) => {
      //     err ? console.error(err) : console.log(res)
      // })

      return allHashes;
      

    }catch(e){
      console.error(e);
      }

}







// (async () => {
//     console.log(await listGitObjects(process.argv[2]))
//   })();


async function listGitObjects(cid){
    let allFiles=[];
    let allDirs=[];
    let allHashes =[];

    for await (const dir of ipfs.ls(cid)) {
        // console.log(file.path)
        console.log(dir)

        allDirs.push(dir.name);
      
        // console.log(content.toString())

        for await (const file of ipfs.ls(dir.path))
        {
            console.log(file)

            allFiles.push(file.name)
            allHashes.push(dir.name+file.name)
        }
      }

      return {
        allDirsNames: allDirs,
        allFilesNames: allFiles,
        allObjectsHashes: allHashes
      };
    
}



// getGitObject(process.argv[2], process.argv[3], process.argv[4], process.argv[5])





async function getMissingGitObjects(directoryCID, objectsHashes, localPath){

    for (let obj in objectsHashes){
        await getGitObject(directoryCID, obj.substring(0,2), obj.substring(2))  
    }
}



// addGitObject(process.argv[2], process.argv[3], process.argv[4])

async function addGitObject(directoryPath, innerDirectoryName, fileName){


    filePath =  "" + directoryPath + "/" + innerDirectoryName + "/" + fileName;
    const fileContent = fs.readFileSync(filePath);

    let file = {
        path: filePath,
        content: fileContent
    };

    cluster.add(
        file,
      {
        "replication-min" : 1,
        "replication-max" : 2,
        "recursive": true
        }
      , (err, result) => {
        err ? console.error(err) : console.log(result)

      })

}


async function addMissingGitObjects(directoryPath, objectsHashes){


    for (let obj in objectsHashes){
        await addGitObject(directoryPath, obj.substring(0,2), obj.substring(2))  
    }
}


// getAllGitObjects(process.argv[2], process.argv[3])



// async function getAllGitObjects(cid, localPath){

//     if (!localPath){
//         localPath = ""
//     }

//     for await (const file of ipfs.get(cid)) {
//         // console.log(file.path)
//         console.log(file)
        
//         if (!file.content) continue;
      
//         const content = new BufferList()
//         for await (const chunk of file.content) {
//           content.append(chunk)
//         }
//         await save(content, localPath+file.path)
      
//         // console.log(content.toString())
//       }
    
// }



// getFile(process.argv[2], process.argv[3]);



const { spawnSync } = require( 'child_process' );


async function getAllGitObjects(cid, localPath){

  // console.log(process.cwd())
  process.chdir('./.got');
  // console.log(process.cwd())

  try{
    const child = spawnSync( "ipfs",  ["get", cid]  );
    console.log('error', child.error);
    console.log('stdout ', child.stdout);
    console.log('stderr ', child.stderr);
    // console.log("Doneeeeeeeeeeee")
  } catch(err){
    console.log(err)
  }

  // console.log(process.cwd())

  try {
    fs.renameSync('./' + cid, './objects')
    console.log("Successfully renamed the directory.")
  } catch(err) {
    console.log(err)
  }

  process.chdir('../');
  // console.log(process.cwd())
}


// async function getGitObject(directoryCID, innerDirectoryName, fileName, localPath){

//   if (!localPath){
//       localPath = ""
//   }

//   for await (const file of ipfs.get(directoryCID + '/' + innerDirectoryName + '/'+ fileName)) {
//       // console.log(file.path)
//       console.log(file)
      
//       if (!file.content) continue;
    
//       const content = new BufferList()
//       for await (const chunk of file.content) {
//         content.append(chunk)
//       }
//       await save(content, localPath+file.path)
    
//       // console.log(content.toString())
//     }
  

// }

async function getGitObject(directoryCID, innerDirectoryName, fileName){

  // if (!localPath){
  //     localPath = ""
  // }

    // console.log(process.cwd())
    process.chdir('./.got');
    // console.log(process.cwd())
  
    try{
      const child = spawnSync( "ipfs",  ["get", directoryCID+'/'+innerDirectoryName+'/'+fileName]  );
      console.log('error', child.error);
      console.log('stdout ', child.stdout);
      console.log('stderr ', child.stderr);
      // console.log("Doneeeeeeeeeeee")
    } catch(err){
      console.log(err)
    }

    process.chdir('../');


}

async function addFileCluster(directoryPath){

  // const file =  fs.readFileSync(directoryPath);
  var allFiles=[];

  const fileContent = fs.readFileSync(directoryPath);


    let response;

    try{

      response = await cluster.add(
      {
          path: directoryPath,
          content: fileContent
      },
    {
      "replication-min" : 1,
      "replication-max" : 2,
      "recursive": true
          });

      console.log(response)

      const CID = response[0].hash;

      cluster.status(CID, (err, res) => {
          err ? console.error(err) : console.log(res)
      })

      return response[0].hash;
      

    }catch(e){
      console.error(e);
      }

}

async function addFilesCluster(paths){
  var hashes = {}
  for (var i = 0; i < paths.length; i++){
    hashes[paths[i]] = await addFileCluster(paths[i])
  }
  return hashes
}

async function getFileIPFS(CID, localPath){

  if (!localPath){
      localPath = ""
  }

  for await (const file of ipfs.get(CID)) {
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
      // await save(content, localPath+file.path)


     

      fs.writeFile(localPath+file.path, content, (err) => {
          // throws an error, you could also catch it here
          if (err) throw err;
      
          // success case, the file was saved
          console.log('file saved!');
      });

      // fs.createReadStream(file.path)
      //     .pipe(BufferListStream((err, content) => { // note 'new' isn't strictly required
      //     // `data` is a complete Buffer object containing the full data
      //     //  console.log(content.toString())
      //  }))
    
      // console.log(content.toString())
    }
  
}

async function getFilesIPFS(filesMap){
  for (var filePath in filesMap){
    await getFileIPFS(filesMap[filePath],filePath);
  }
}





module.exports ={
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

