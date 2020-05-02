#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

const { Gateway, FileSystemWallet, DefaultEventHandlerStrategies, Transaction  } = require('fabric-network');

const gotClient = require('./lib/client')
const Constants = require('./lib/common/constants')

var gateway, network, contract;

async function setupGateway(){
    // 2.1 load the connection profile into a JS object
    let connectionProfile = yaml.safeLoad(fs.readFileSync(Constants.CONNECTION_PROFILE_PATH, 'utf8'));
  
    // 2.2 Need to setup the user credentials from wallet
    const wallet = new FileSystemWallet(Constants.FILESYSTEM_WALLET_PATH);
  
    // 2.3 Set up the connection options
    let connectionOptions = {
        identity: Constants.USER_ID,
        wallet: wallet,
        discovery: { enabled: false, asLocalhost: true }
    };
  
    await gateway.connect(connectionProfile, connectionOptions);
}


async function main(){
    gateway = new Gateway();
    await setupGateway();
    network = await gateway.getNetwork(Constants.NETWORK_NAME);
    contract = await network.getContract(Constants.CONTRACT_ID);

    var client = new gotClient.Client(contract);
    await client.loadCurrentRepo();
  
    console.log("entered command: ", process.argv[2])
  
    switch (process.argv[2]) {
      case "addRepo":
        await client.addRepo();
        break;
      
      case "testUser":
        // testing user update messages
        console.log("Testing User Creation")
        await client.createNewUser("mickey", "PublickKey", "PrivateKey")
        await client.createNewUser("mickey", "Another PublickKey", "PrivateKey")
        await client.queryUserPublicKey("mickey")
        console.log("\n\n")
        
        console.log("Testing UserName change")
        await client.changeUserName("NewMickey")
        await client.queryUserPublicKey("mickey")
        await client.queryUserPublicKey("NewMickey")
        console.log("\n\n")

        console.log("Testing publickey change")
        await client.generateNewKeys("AnotherNewerPK", "AnotherNewerPV")
        await client.queryUserPublicKey("mickey")
        await client.queryUserPublicKey("NewMickey")
        console.log("\n\n")

        console.log("Testing User removal")
        await client.removeUser();
        await client.queryUserPublicKey("mickey")
        await client.queryUserPublicKey("NewMickey")
        console.log("\n\n")

        break;

      
      case "testAccess":
        // testing user update messages
        console.log("Testing Adding Users and Repo")
        await client.createNewUser("User01", "PP", "PP")
        await client.createNewUser("User02", "PP", "PP")
        // await client.createNewUser("User03", "PP", "PP")
        // await client.createNewUser("User04", "PP", "PP")
        // await client.createNewUser("User05", "PP", "PP")
        await client.createNewUser("Admin01", "PP", "PP")
        await client.createNewUser("Admin02", "PP", "PP")
        // await client.createNewUser("Admin03", "PP", "PP")
        // await client.createNewUser("Admin04", "PP", "PP")
        // await client.createNewUser("Admin05", "PP", "PP")
        await client.createNewUser("Admin@acme.com", "PP", "PP")
        await client.addRepo()
        await client.queryCurrentEncryptionKey()
        await client.queryUsersAccess()
        console.log("\n\n")

        // A01
        // U02
        console.log("Adding Collaborators")
        await client.updateUserAccess("Admin01", gotClient.UserAccess.CollaboratorAccess, "enc2")
        await client.createNewUser("Admin01", "PP", "PP", false)
        await client.updateUserAccess("User02", gotClient.UserAccess.ReadWriteAccess, "enc2")
        await client.updateUserAccess("Admin02", gotClient.UserAccess.CollaboratorAccess, "enc2")
        await client.queryCurrentEncryptionKey()
        await client.queryUsersAccess()
        console.log("\n\n")

        // // A01, 
        // // U02, U01,
        // console.log("Adding Read/Write")
        // await client.createNewUser("Admin@acme.com", "PP", "PP", false)
        // await client.updateUserAccess("User01", gotClient.UserAccess.ReadWriteAccess, "enc3")
        // await client.createNewUser("User01", "PP", "PP", false)
        // await client.updateUserAccess("User03", gotClient.UserAccess.ReadWriteAccess, "enc3")
        // await client.updateUserAccess("Admin03", gotClient.UserAccess.CollaboratorAccess, "enc3")
        // await client.queryCurrentEncryptionKey()
        // await client.queryUsersAccess()
        // console.log("\n\n")

        // // A01, A04, A05
        // // U02, U01, U04, U05
        // console.log("Changing Ownership")
        // await client.createNewUser("Admin@acme.com", "PP", "PP", false)
        // await client.updateUserAccess("Admin01", gotClient.UserAccess.OwnerAccess, "enc4")
        // await client.updateUserAccess("User04", gotClient.UserAccess.ReadWriteAccess, "enc4")
        // await client.updateUserAccess("Admin04", gotClient.UserAccess.CollaboratorAccess, "enc4")
        // await client.createNewUser("Admin01", "PP", "PP", false)
        // await client.updateUserAccess("User05", gotClient.UserAccess.ReadWriteAccess, "enc5")
        // await client.updateUserAccess("Admin05", gotClient.UserAccess.CollaboratorAccess, "enc5")
        // await client.queryCurrentEncryptionKey()
        // await client.queryUsersAccess()
        // console.log("\n\n")

        break;
  
  
      case "push":
        await client.push();
        break;
  
      case "pull":
        await client.pull();
        break;
  
      case "clone":
        // TO DO : check number of arguments
        await client.cloneRepo(process.argv[3], process.argv[4]);
        break;
  
      default:
        console.log("undefined command: ", process.argv, "  !");
    }
  
    process.exit();
}
  
main();