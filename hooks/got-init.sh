git init
git --bare init .got
git remote add origin .got
git remote set-url origin .got
mkdir .gotconfig

#adding wallet info
cp -r $GOPATH/src/github.com/GitofTruth/GoT/profiles .gotconfig

#creating wallet
sudo got-wallet add acme Admin


rm -rf .go/objects
