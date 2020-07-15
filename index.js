const https = require('https');
const fs = require('fs');
const path = require('path');

require('dotenv').config()
const port = parseInt(process.env.PORT || '443');
const proxyHost = process.env.PROXY_HOST || 'www.baidu.com';
const proxyPort = parseInt(process.env.PROXY_PORT || '443');
const dataPath = path.resolve(__dirname, process.env.DATA_PATH || 'data');
const certPath = path.resolve(__dirname, process.env.CERT_PATH || 'cert');
const privateKey  = fs.readFileSync(path.join(certPath, 'cert.key'), 'utf8');
const certificate = fs.readFileSync(path.join(certPath, 'cert.crt'), 'utf8');

function multiplePipe(src, ...dsts) {
  src.on('data', (chunk) => {
    dsts.forEach((dst) => dst.write(chunk));
  });
  src.on('end', () => {
    dsts.forEach((dst) => dst.end());
  });
}

const server = https.createServer({ key: privateKey, cert: certificate }, (req, res) => {
  const reqName = `${proxyHost}.${new Date().valueOf()}`;
  fs.mkdirSync(dataPath, {
    recursive: true,
  });
  const reqStream = fs.createWriteStream(`./data/${reqName}.req.txt`);
  const resStream = fs.createWriteStream(`./data/${reqName}.res.txt`);
  const infoStream = fs.createWriteStream(`./data/${reqName}.info.txt`);
  function writeInfo(s) {
    infoStream.write(s + '\n');
    console.log(s);
  }
  function writeHeaders(headers) {
    writeInfo(`  HEADERS:`);
    for (let i = 0; i < headers.length; i += 2) {
      writeInfo(`    ${headers[i]}: ${headers[i + 1]}`);
    }
  }
  writeInfo(`# ${new Date().toISOString()}`);
  writeInfo(`${req.method} ${req.url}`);
  writeHeaders(req.rawHeaders);
  const request = https.request({
    hostname: proxyHost,
    port: proxyPort,
    path: req.url,
    headers: req.headers,
    method: req.method,
  }, (response) => {
    res.writeHead(response.statusCode, response.headers);
    multiplePipe(response, res, resStream);
    writeInfo(`STATUS CODE: ${response.statusCode}`);
    writeHeaders(response.rawHeaders);
  });
  multiplePipe(req, request, reqStream);
});

server.listen(port);
console.log(`listening on https://127.0.0.1:${port}`);
