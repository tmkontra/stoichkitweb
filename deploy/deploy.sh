if [ -z $1 ] ; then
  echo "Need host!" && exit 1;
fi
export DEST=$1
export REMOTE_DIR="~/stoichkitweb"
mkdir _build
### API
docker build api
docker create --name stoichkitweb-api-build stoichkitweb:latest
docker cp stoichkitweb-api-build:/bin/stoichkitweb ./_build/stoichkitweb
docker rm stoichkitweb-api-build
### WEB
pushd web
export API_URL=API="https://stoichkitweb:3031"
npm ci --silent
npm install react-scripts@3.4.1 -g --silent
npm run build
popd
cp -r web/build ./_build/public
### SYSTEMD
cp deploy/stoichkitweb.service ./_build/
### UPLOAD
mkdir -p ./deploy/tarballs
export TARBALL="stoichkitweb-deploy-`date +%Y%m%dT%H%M%S`.tar.gz"
tar -czf ./deploy/tarballs/${TARBALL} ./_build
echo "scp tarball: ./deploy/tarballs/${TARBALL} to ${DEST}"
scp ./deploy/tarballs/${TARBALL} ${DEST}:${REMOTE_DIR}
### DEPLOY
ssh ${DEST} << EOF
    cd ${REMOTE_DIR}
    tar -xzf ${TARBALL}
    sudo cp -r _build/public/* /var/www/stoichkitweb.com/
    sudo systemctl stop stoichkitweb
    sudo cp _build/stoichkitweb /opt/stoichkitweb/stoichkitweb
    sudo chown stoichkitweb:stoichkitweb /opt/stoichkitweb/stoichkitweb
    sudo cp _build/stoichkitweb.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl restart stoichkitweb
EOF