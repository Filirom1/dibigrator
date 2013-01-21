exports.init = function(client, cb){
  client.query('CREATE TABLE IF NOT EXISTS dibigrator_version (id SERIAL NOT NULL PRIMARY KEY, version text NOT NULL)', function(err){
    if(err) return cb(err);
    client.query('SELECT version FROM dibigrator_version', function(err, result){
      if(err) return cb(err);
      if(result.rows.length) return cb();
      client.query("INSERT INTO dibigrator_version(version) VALUES('0.0.0');", cb);
    });
  });
};

exports.getCurrentVersion = function(client, cb){
  client.query('SELECT version FROM dibigrator_version ORDER BY id DESC LIMIT 1;', function(err, result){
    if(err) return cb(err);
    cb(null, result.rows[0].version);
  });
};

exports.setCurrentVersion = function(client, version, cb){
  client.query("INSERT INTO dibigrator_version(version) VALUES($1)", [version], function(err, result){
    if(err) return cb(err);
    if(result.rows.length === 0) return cb(null, '0.0.0');
    cb(null, result.rows[0].version);
  });
};

exports.execute = function(client, sql, cb){
  client.query(sql, cb);
};
