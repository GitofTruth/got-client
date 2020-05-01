git init

mkdir -p .got
cd .got
git --bare init remote
cd ..

git remote add origin .got/remote
git remote set-url origin .got/remote

#adding wallet info
mkdir -p .got/config/hyperledger
cp -r $GOPATH/src/github.com/GitofTruth/GoT/profiles .got/config/hyperledger

#creating wallet
got-wallet add acme Admin

rm -rf .go/objects
