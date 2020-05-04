
const fs = require('fs');

const Constants = require('./lib/common/constants')

const simpleGit = require('simple-git/promise')(Constants.REPO_PATH);


// (async () => {

//     //    await getTreeHashes(process.argv[2])

//     // let isTree = await isTreeHash(process.argv[2])
//     // console.log(isTree)

//     // let isCommit = await isCommitHash(process.argv[2])
//     // console.log(isCommit)


//     let allHashes = [];
//     await getCommitObjectsHashes(process.argv[2], allHashes)
//     console.log(allHashes)


// })();


async function getTreeHashes(treeHash) {

    let arguments = [
        '-p',
        treeHash
    ]
    let result = await simpleGit.catFile(arguments)

    let treeHashes = []

    for (let i = 0; i < result.length; i++) {
        const c = result[i];
        let hash = '';
        if (i == 0) {

            hash = result.substring(12, 52)
            if (hash != '')
                treeHashes.push(hash)
        }
        if (c == '\n') {

            hash = result.substring(i + 13, i + 53)
            if (hash != '')
                treeHashes.push(hash)
        }
    }
    // console.log(result.substring(12*2,12*2+40))
    // console.log(treeHashes)
    return treeHashes

}

async function isTreeHash(hash) {

    let arguments = [
        '-t',
        hash
    ]
    let result = await simpleGit.catFile(arguments)
    // console.log(result)
    return (result.substring(0, 4) == "tree")
}

async function isCommitHash(hash) {

    let arguments = [
        '-t',
        hash
    ]
    let result = await simpleGit.catFile(arguments)
    // console.log(result)
    return (result.substring(0, 6) == "commit")
}

async function getCommitTreeHash(commitHash) {

    let arguments = [
        '-p',
        commitHash
    ]
    let result = await simpleGit.catFile(arguments)

    return result.substring(5, 45)
}


async function getCommitObjectsHashes(inputHash, allCommitObjectsHashes) {

    var treeHash = '';
    // var allCommitObjectsHashes = [];


    if (await isCommitHash(inputHash))
        treeHash = await getCommitTreeHash(inputHash);
    else
        treeHash = inputHash


    // allCommitObjectsHashes.push(treeHash)

    var treeHashes = await getTreeHashes(treeHash);

    await Promise.all(treeHashes.map(async (hash) => {
        allCommitObjectsHashes.push(hash)
        // console.log(hash)
        let isTree = await isTreeHash(hash)
        if (isTree) {
            // console.log(hash)
           await getCommitObjectsHashes(hash, allCommitObjectsHashes)
        }
    }));



    return


}

module.exports = {
    getCommitObjectsHashes
}


