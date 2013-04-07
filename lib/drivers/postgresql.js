exports.init = function(client, options, cb){
  client.query('CREATE TABLE IF NOT EXISTS ' + options.table + ' (id SERIAL NOT NULL PRIMARY KEY, version text NOT NULL)', function(err){
    if(err) return cb(err);
    client.query('SELECT version FROM ' + options.table, function(err, result){
      if(err) return cb(err);
      if(result.rows.length) return cb();
      client.query("INSERT INTO " + options.table + "(version) VALUES('0.0.0');", cb);
    });
  });
};

exports.getCurrentVersion = function(client, options, cb){
  client.query('SELECT version FROM ' + options.table + ' ORDER BY id DESC LIMIT 1;', function(err, result){
    if(err) return cb(err);
    cb(null, result.rows[0].version);
  });
};

exports.setCurrentVersion = function(client, version, options, cb){
  client.query("INSERT INTO " + options.table + "(version) VALUES($1)", [version], function(err, result){
    if(err) return cb(err);
    if(result.rows.length === 0) return cb(null, '0.0.0');
    cb(null, result.rows[0].version);
  });
};

exports.beginTransaction = function(client, options, cb){
  client.query('BEGIN;', cb);
};

exports.commit = function(client, options, cb){
  client.query("COMMIT;", cb);
};

exports.rollback = function(client, options, cb){
  client.query("ROLLBACK;", cb);
};

exports.execute = function(client, sql, options, cb){
  client.query(sql, cb);
};
