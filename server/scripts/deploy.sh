#!/usr/bin/expect -f

set timeout -1

set PROJECT_NAME [lindex $argv 0]
set SERVER_IP [lindex $argv 1]
set USERNAME [lindex $argv 2]
set SSH_KEY [lindex $argv 3]

set prompt "$ "

spawn ssh -i $SSH_KEY $USERNAME@$SERVER_IP
expect $prompt

# install dependencies
send -- "sudo apt install unzip\r"
send -- "npm install -g pm2 env-cmd\r"
expect $prompt

# extract zip file
send -- "unzip -o $PROJECT_NAME.zip -d $PROJECT_NAME && cd $PROJECT_NAME\r"
expect $prompt

# install dependencies
send -- "rm -rf node_modules && npm install --production\r"
expect $prompt

# delete old deployment
send -- "pm2 delete $PROJECT_NAME\r"
expect $prompt

# start new deployment
send -- "env-cmd pm2 start index.js --name=\"$PROJECT_NAME\" && cd ..\r"
expect $prompt

# delete zip file
send -- "rm $PROJECT_NAME.zip\r"
expect $prompt
