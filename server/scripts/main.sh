SERVER_IP=$1
USERNAME=$2
SSH_KEY=$3

PROJECT_NAME=$(cat package.json \
  | grep name \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

# archive project directory
git archive -o "$PROJECT_NAME.zip" HEAD

# upload zip file to server
./upload.sh "$(pwd)/$PROJECT_NAME.zip" $SERVER_IP $USERNAME $SSH_KEY

# deploy app on server
./deploy.sh $PROJECT_NAME $SERVER_IP $USERNAME $SSH_KEY

# delete zip file
rm "$PROJECT_NAME.zip"
