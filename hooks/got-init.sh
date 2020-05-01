echo "Initializing GoT Repository..."

git init
git --bare init .got
git remote add origin .got
git remote set-url origin .got
# git push --set-upstream origin master
# git push --set-downstream origin master
mkdir .gotconfig

# echo ".got \n .gotconfig"  >> .gitignore

echo "Adding wallet info..."
cp -r $GOPATH/src/github.com/GitofTruth/GoT/profiles .gotconfig

#creating wallet
sudo got-wallet add acme Admin


# rm -rf .go/objects
