#!/bin/bash
# update yum
yum update -y
# get node into yum
curl --silent --location https://rpm.nodesource.com/setup_10.x | bash -
# install node and npm
yum install -y nodejs
# install pm2 to restart node app
npm i -g pm2@2.4.3