#!/bin/bash

# this will restart app/server on instance reboot
crontab -l | { cat; echo "@reboot pm2 start /var/www/bot.js -i 0 --name \"anon-ask\""; } | crontab -
sudo pm2 stop anon-ask
# actually start the server
sudo pm2 start /var/www/bot.js -i 0 --name "anon-ask"
