#!/usr/bin/expect -f

set timeout -1

set FILE [lindex $argv 0]
set SERVER_IP [lindex $argv 1]
set USERNAME [lindex $argv 2]
set SSH_KEY [lindex $argv 3]

spawn sftp -i $SSH_KEY $USERNAME@$SERVER_IP
expect "sftp>"

send -- "put $FILE\r"
expect "sftp>"
