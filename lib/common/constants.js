#!/usr/bin/env node

const NETWORK_NAME = 'airlinechannel';
const USER_ID = 'Admin@acme.com';
const CONTRACT_ID = "GoT";

const REPO_PATH = '.';

const GOT_DIRECTORY_PATH = REPO_PATH + '/.got/'

const CONFIG_PATH = GOT_DIRECTORY_PATH + 'config/'
const REMOTE_PATH = GOT_DIRECTORY_PATH + 'remote/'

const HyperLedger_CONFIG_PATH = CONFIG_PATH + 'hyperledger/'
const IPFS_CONFIG_PATH = CONFIG_PATH + 'ipfs/'
const User_CONFIG_PATH = CONFIG_PATH + 'user.json'

const CONNECTION_PROFILE_PATH = HyperLedger_CONFIG_PATH + 'profiles/dev-connection.yaml';
const FILESYSTEM_WALLET_PATH = HyperLedger_CONFIG_PATH + 'user-wallet';

const ENCRYPTED_Objects_Path = IPFS_CONFIG_PATH + 'objects/'


module.exports ={
    NETWORK_NAME,
    USER_ID,
    CONTRACT_ID,
    
    REPO_PATH,
    GOT_DIRECTORY_PATH,

    CONFIG_PATH,
    REMOTE_PATH,

    HyperLedger_CONFIG_PATH,
    IPFS_CONFIG_PATH,
    User_CONFIG_PATH,

    CONNECTION_PROFILE_PATH,
    FILESYSTEM_WALLET_PATH,

    ENCRYPTED_Objects_Path
};