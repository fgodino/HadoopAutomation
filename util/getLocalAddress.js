var os = require('os');

module.exports = function(){
  
  var ifaces = os.networkInterfaces();
  
  var result = {};

  for(var ifname in ifaces){
    
    var iface = ifaces[ifname];
    
    for(var i = 0; i < iface.length; i++){
      if ('IPv4' === iface[i].family) {
        result[ifname] = iface[i].address
        break;
      }
    }
  }

  return result;

};