var http = require('http');
var os = require('os');
var httpProxy = require('http-proxy');
var { program } = require('commander');
var finalhandler = require('finalhandler');
var serveStatic = require('serve-static');
const httpStringParser = require('http-string-parser');


program
  .requiredOption('-i, --ikamand <host or ip>', 'The IP or hostname for iKamand')
  .option('-p, --port <post>', 'The server port', 3000);
program.parse();

function getLocalNetworkUrls(port) {
  return Object.entries(os.networkInterfaces())
    .flatMap(([name, networkInterfaces]) => {
      return networkInterfaces.map((networkInterface) => ({ name, networkInterface }));
    })
    .filter((networkInterface) => {
      var name = networkInterface.name.toLowerCase();

      return networkInterface.networkInterface
        && networkInterface.networkInterface.family === "IPv4"
        && !networkInterface.networkInterface.internal
        && !name.includes("vethernet")
        && !name.includes("virtualbox")
        && !name.includes("vmware")
        && !name.includes("bluetooth");
    })
    .map((networkInterface) => {
      return {
        name: networkInterface.name,
        url: `http://${networkInterface.networkInterface.address}:${port}/#`
      };
    });
}

function logStartupInstructions(port, ikamand) {
  var networkUrls = getLocalNetworkUrls(port);

  console.log(`Starting server on port '${port}' and forwarding to '${ikamand}'`);
  console.log(`Local computer: http://localhost:${port}/#`);

  if (networkUrls.length) {
    console.log("Other devices on the same network:");
    console.log("Use the address for the network your phone/computer is connected to.");
    networkUrls.forEach((networkUrl) => console.log(`  ${networkUrl.name}: ${networkUrl.url}`));
  } else {
    console.log("Other devices: no active network address found.");
  }
}

logStartupInstructions(program.opts().port, program.opts().ikamand);

var serve = serveStatic("public");

var proxy = httpProxy.createProxyServer({});

http.createServer(function (req, res) {
  if (req.url.startsWith("/cgi-bin")) {
    proxy.web(req, res, { target: `http://${program.opts().ikamand}` }, (e) => {
      try {
        // The iKamand returns malformed packets; attempt to salvage them manually:
        const parsedRequest = httpStringParser.parseRequest(e.rawPacket.toString());
        res.write(parsedRequest.body);
        res.end();
      }
      catch (e) {
        console.error(e);
        res.end();
      }
    });
  } else {
    var done = finalhandler(req, res);
    serve(req, res, done);
  }
}).listen(program.opts().port);

