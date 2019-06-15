SERVER_IP=$1
USERNAME=$2
SSH_KEY=$3

PROJECT_NAME=$(cat package.json \
  | grep name \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

# build the project locally
rm -rf build
env-cmd npm run build

# archive the build
zip -r -9 -q "$PROJECT_NAME.zip" build

# upload zip file to server
scripts/upload "$(pwd)/$PROJECT_NAME.zip" $SERVER_IP $USERNAME $SSH_KEY

# deploy server
scripts/deploy $PROJECT_NAME $SERVER_IP $USERNAME $SSH_KEY

# delete zip file and build folder
rm -rf "$PROJECT_NAME.zip" build
