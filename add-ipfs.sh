sudo rm -rf ~/.ipfs
sudo kill -9 $(sudo lsof -t -i:5001)
sudo kill -9 $(sudo lsof -t -i:4001)


ipfs init
ipfs bootstrap rm --all

sudo cp -a /var/local/swarm.key  ~/.ipfs/

ipfs config Addresses.API /ip4/0.0.0.0/tcp/5001
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

ipfs config show

# ipfs bootstrap add /ip4/23.96.46.70/tcp/4001/ipfs/QmYCi7C3jBdEbBKH5GbQAdZ1MuAuQGTS4sBNe99dS3AoxE
ipfs bootstrap add /ip4/10.0.0.4/tcp/4001/ipfs/QmcsW4sze6jiwpxLBADk781ZeDqFGFpFcChbWnZN2WKpwv

export LIBP2P_FORCE_PNET=1
sudo rm -rf /etc/systemd/system/ipfs.service

sudo kill -9 $(sudo lsof -t -i:5001)
sudo kill -9 $(sudo lsof -t -i:4001)

echo "[Unit]
 Description=IPFS Daemon
 After=syslog.target network.target remote-fs.target nss-lookup.target
 [Service]
 Type=simple
 ExecStart=/usr/local/bin/ipfs daemon --enable-namesys-pubsub
 User=$1
 [Install]
 WantedBy=multi-user.target" | sudo tee -a /etc/systemd/system/ipfs.service > /dev/null


sudo systemctl daemon-reload
sudo systemctl enable ipfs
sudo systemctl start ipfs
sudo systemctl status ipfs

