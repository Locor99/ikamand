var os = require("os");

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
  console.log("");
  console.log("Open the dashboard from this computer:");
  console.log(`  http://localhost:${port}/#`);

  if (networkUrls.length) {
    console.log("");
    console.log("Open the dashboard from another phone/computer on the same home network:");
    networkUrls.forEach((networkUrl) => console.log(`  ${networkUrl.name}: ${networkUrl.url}`));
    console.log("");
    console.log("This works when this computer is connected to the iKamand Wi-Fi and also");
    console.log("connected to your home network, for example with Ethernet. The other");
    console.log("device must use the home-network address shown above.");
  } else {
    console.log("Other devices: no active network address found.");
  }
}

module.exports = {
  getLocalNetworkUrls,
  logStartupInstructions
};
