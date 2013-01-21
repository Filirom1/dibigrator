var fs = require('fs');
var dibigrator = require('./lib/dibigrator');

var drivers = fs.readdirSync(__dirname + '/lib/drivers');
drivers.forEach(function(driverName){
  driverName = driverName.replace('.js', '');
  var driver = require('./lib/drivers/' + driverName);
  exports[driverName] = function(client, path){
    return dibigrator(client, driver, path);
  };
});
