git init

mkdir -p .got
cd .got
git --bare init remote
cd ..

git remote add origin .got/remote
git remote set-url origin .got/remote

#adding wallet info
mkdir -p .got/config/hyperledger
# cp -r $GOPATH/src/github.com/GitofTruth/GoT/profiles .got/config/hyperledger
wget -r -nH -q -P ./.got/config/hyperledger -R "index.html*" http://13.95.171.119/profiles/
# wget -r -nH -q -P ./.got/config/hyperledger -R "index.html*" http://13.95.171.119/crypto-config/
wget -r -nH -q -P ./.got/config/hyperledger -R "index.html*" http://13.95.171.119/crypto-config.zip
unzip -q ./.got/config/hyperledger/crypto-config.zip -d ./.got/config/hyperledger

#creating wallet
got-wallet add acme Admin

rm -rf .go/objects
