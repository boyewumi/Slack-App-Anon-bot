#!/bin/bash

cd /var/www && npm install

aws ssm get-parameters --region us-east-2 --names anon-ask-env --output text --query Parameters[0].Value > .env