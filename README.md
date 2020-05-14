# GoT Client
This is a node js package for interfacing with the Git of Truth, a peer-to-peer Git-based version control 
system over blockchain.

# Installation of Dependencies

* Git
* Node.js with NPM
* Golang
* IPFS
    - IPFS is a peer-to-peer networking protocol for managing storage over a distributed file system

``` bash
sudo apt-get update
#install git, nodejs and npm
sudo apt-get install -y nodejs npm git

#install go lang
GOREL=go1.13.3.linux-amd64.tar.gz
wget -q https://dl.google.com/go/go1.13.3.linux-amd64.tar.gz
tar xfz $GOREL
sudo mv go /usr/local/go
rm -f $GOREL
PATH=$PATH:/usr/local/go/bin
echo 'PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'PATH=$PATH:/usr/local/go/bin' >> ~/.profile

#install ipfs
curl -LO https://dist.ipfs.io/go-ipfs/v0.4.23/go-ipfs_v0.4.23_linux-amd64.tar.gz
tar -zxvf go-ipfs_v0.4.23_linux-amd64.tar.gz
sudo mv go-ipfs/ipfs /usr/local/bin/

```

# GoT Installation over Debian-based Linux (Debian, Ubuntu, Pop!_OS, etc.)

## Install the got-client package

```bash
#Clone the got-client git repository 
git clone https://github.com/GitofTruth/got-client.git

#Go inside
cd got-client

#Install the got-client package globaly
sudo npm install -g

#Join the GoT IPFS Private Network
sudo chmod u+x *.sh
./add-ipfs.sh <linux-username>

```




# License, Acknowledgment

MIT License, see 'LICENSE'.
