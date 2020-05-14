/**
 * Module for traversal of the Git Objects Tree
 * @module walk-git-tree 
 */
const fs = require('fs');

const Constants = require('../common/constants')

const simpleGit = require('simple-git/promise')(Constants.REPO_PATH);


/**
 * Function that gets a list of all tree objects hashes under a certain tree hash
 * @param {string} treeHash hash of a tree hash object
 * @returns {Array<string>} list of tree objects hashes 
 */
async function getTreeHashes(treeHash) {

    let args = [ "-p", treeHash ];
    let result = await simpleGit.catFile(args);

    let treeHashes = [];

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

/**
 * Checks if a git object hash is a tree hash or not
 * @param {string} hash git object hash
 * @returns {boolean} true if tree hash and false otherwise
 */
async function isTreeHash(hash) {

    let args = [
        '-t',
        hash
    ];
    let result = await simpleGit.catFile(args);
    // console.log(result)
    return (result.substring(0, 4) == "tree")
}

/**
 * Checks if a git object hash is a commit hash or not
 * @param {string} hash git object hash
 * @returns {boolean} true if commit hash and false otherwise
 */
async function isCommitHash(hash) {

    let args = [
        '-t',
        hash
    ]
    let result = await simpleGit.catFile(args)
    // console.log(result)
    return (result.substring(0, 6) == "commit")
}

/**
 * Gets the root of the git objects tree of a certain commit
 * @param {string} commitHash git commit object hash
 * @returns {string} commit tree root hash
 */
async function getCommitTreeHash(commitHash) {

    let args = [
        '-p',
        commitHash
    ]
    let result = await simpleGit.catFile(args)

    return result.substring(5, 45)
}


/**
 * Function that takes a commit hash and traverses the git tree recursively
 * to get a list of all git objects hashes under this commit hash 
 * @param {string} inputHash - commit hash which points to the Git tree root 
 * @param {Array<string>} allCommitObjectsHashes - a list of all objects hashes 
 * @returns {void}
 */
async function getCommitObjectsHashes(inputHash, allCommitObjectsHashes) {

    var treeHash = '';


    if (await isCommitHash(inputHash))
        {
            allCommitObjectsHashes.push(inputHash)
            treeHash = await getCommitTreeHash(inputHash);
        }
    else
        treeHash = inputHash


    allCommitObjectsHashes.push(treeHash)

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


