var fs = require('fs');
var dibigrator = require('./lib/dibigrator');

var drivers = fs.readdirSync(__dirname + '/lib/drivers');
drivers.forEach(function(driverName){
  driverName = driverName.replace('.js', '');

  // lazy load drivers
  exports.__defineGetter__(driverName, function(){
    return function(client, path){
      var driver = require('./lib/drivers/' + driverName);
      return dibigrator(client, driver, path);
    };
  });
});
