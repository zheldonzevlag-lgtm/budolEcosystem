const { updateNetworkConfig } = require('./network-util.js');
const ip = updateNetworkConfig();
console.log(`Ecosystem network configuration updated to: ${ip}`);
