git --bare init .got
git remote set-url origin .got
mkdir .gotconfig

#adding wallet info
cp -r $GOPATH/src/github.com/GitofTruth/GoT/profiles .gotconfig

#creating wallet
sudo got-wallet add acme Admin

