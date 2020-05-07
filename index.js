#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');

const { Gateway, FileSystemWallet, DefaultEventHandlerStrategies, Transaction  } = require('fabric-network');

const gotClient = require('./lib/client')
const Constants = require('./lib/common/constants')

const simpleGit = require('simple-git/promise')(Constants.REPO_PATH);



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

    // console.log("BEFORE CREATE CLIENT")
    var client = new gotClient.Client(contract);
    // console.log("AFTER CREATE CLIENT")
    await client.loadCurrentRepo();

    let branchName = client.GotReader.getCurrentBranchName();
     

    // console.log("entered command: ", JSON.stringify(process.argv))

    switch (process.argv[2]) {
      case "addRepo":
        await simpleGit.push("origin", branchName);
        await client.addRepo();
        break;

      case "clone":
        // TO DO : check number of arguments
        await client.cloneRepo(process.argv[3], process.argv[4]);
        await simpleGit.pull("origin", branchName);
        break;

      case "push":
        await client.push();
        break;

      case "pull":
        await client.pull();
        break;

      case "user":
        switch(process.argv[3]){
          case "create":
            if (process.argv.length == 5){
              await client.createNewUser(process.argv[4])
            } else if (process.argv.length == 7){
              await client.createNewUser(process.argv[4], process.argv[5], process.argv[6])
            }else {
              console.log("Error! number of arguments did not match the expected for subcommand, expected: 5 or 7")
            }
            break;

          case "username":
            await client.changeUserName(process.argv[4])
            break;

          case "keys":
            if (process.argv.length == 4){
              await client.generateNewKeys()
            } else if (process.argv.length == 6){
              await client.generateNewKeys(process.argv[4], process.argv[5])
            }else {
              console.log("Error! number of arguments did not match the expected for subcommand, expected: 4 or 6")
            }
            break;

          case "remove":
            await client.removeUser()
            break;

          default:
            console.log("sub Command not found: " + process.argv[3])
        }
      break;

      case "authorize":
        if (process.argv.length == 5){
          switch(process.argv[4]){
            case "read-write":
              await client.updateUserAccess(process.argv[3], gotClient.UserAccess.ReadWriteAccess)
            break;

            case "collaborator":
              await client.updateUserAccess(process.argv[3], gotClient.UserAccess.CollaboratorAccess)
            break;

            case "owener":
              await client.updateUserAccess(process.argv[3], gotClient.UserAccess.OwnerAccess)
            break;

            case "revoked":
              await client.updateUserAccess(process.argv[3], gotClient.UserAccess.ReovkedAccess)
            break;

            default:
              console.log("auhtorization type could not be matched: " + process.argv[4])
          }

        }else {
          console.log("Error! number of arguments did not match the expected for subcommand, expected: 5")
        }
      break;

      case "queryRepo":
        await client.queryRepo()
        break;

      case "queryUsersAccess":
        await client.queryUsersAccess()
        break;

      case "testOne":
        //creating users
        console.log("Testing Adding Users and Repo")
        await client.createNewUser("User01", "PP", "PP")
        await client.createNewUser("User02", "PP", "PP")
        await client.createNewUser("Admin01", "PP", "PP")
        await client.createNewUser("Admin02", "PP", "PP")
        console.log("\n\n")

        console.log("Testing Adding a New Repo")
        await client.createNewUser("Admin@acme.com", "PP", "PP")
        await client.addRepo()
        await client.updateUserAccess("Admin01", gotClient.UserAccess.CollaboratorAccess, "enc2")
        await client.queryCurrentEncryptionKey()
        await client.queryUsersAccess()
        console.log("\n\n")
        break;

      case "testTwo":

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

      default:
        console.log("undefined command: ", process.argv, "  !");
    }

    process.exit();
}

main();
