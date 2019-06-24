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
expect $prompt

# extract zip file
send -- "unzip -o $PROJECT_NAME.zip -d $PROJECT_NAME\r"
expect $prompt

# copy the build
send -- "sudo rm -rf /var/www/html/* && sudo cp -r $PROJECT_NAME/build/* /var/www/html/\r"
expect $prompt

# delete zip file
send -- "rm $PROJECT_NAME.zip\r"
expect $prompt
