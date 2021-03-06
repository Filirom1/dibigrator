var semver = require('semver');
var fs = require('fs');
var Path = require('path');
var async = require('async');
var verror = require('verror');

module.exports = function(client, driver, migrationPath, options){
  var isInitialized = false;

  // default options
  options = options || {};
  options.table = options.table || 'dibigrator_version';

  function init(cb){
    if(isInitialized) return cb();
    fs.stat(migrationPath, function(err, stat){
      if(err) return cb(err);
      if(!stat.isDirectory()) return cb(new Error(migrationPath + ' is not a directory'));
      driver.init(client, options, function(err){
        if(err) return cb(new verror.VError(err, 'Fail to init db driver.'));
        isInitialized = true;
        cb();
      });
    });
  }

  function migrate(version, finalCallback){
    if(!semver.valid(version)) return finalCallback(new Error(version + ' is not a valid semver'));
    version = semver.valid(version);

    function cb(err, migrations){
      if(!err) {
        driver.commit(client, options, function(err){
          if(err) return finalCallback(new verror.VError(err, 'fail to commit migrations'));
          return finalCallback(null, migrations);
        });
        return;
      }
      driver.rollback(client, options, function(rollbackErr){
        finalCallback(new verror.VError(err, 'unable to rollback'));
      });
    }

    driver.beginTransaction(client, options, function(err){
      if(err) return cb(err);
      init(function(err){
        if(err) return cb(err);
        getCurrentVersion(function(err, currentVersion){
          if(err) return cb(new verror.VError(err, 'Fail to get current version in the db'));
          fs.readdir(migrationPath, function(err, files){
            if(err) return cb(err);
            var migrationFiles = [];
            if(semver.lt(currentVersion, version)){
              var doRegExp = /(.*)\.do\..*\..*sql/;
              migrationFiles = files.filter(function(file){
                // only keep xxxxxx.do.xxxxx.xxsql files
                var regExpMatches = doRegExp.exec(file);
                if (!regExpMatches) return false;
                var fileVersion = regExpMatches[1];
                if(semver.gte(currentVersion, fileVersion)) return false;
                if(semver.lt(version, fileVersion)) return false;
                return true;
              });
              migrationFiles = migrationFiles.sort(function(fileA,fileB){
                var versionA = doRegExp.exec(fileA)[1];
                var versionB = doRegExp.exec(fileB)[1];
                return semver.compare(versionA, versionB);
              });
            }
            if(semver.gt(currentVersion, version)){
              var undoRegExp = /(.*)\.undo\..*\..*sql/;
              migrationFiles = files.filter(function(file){
                // only keep xxxxxx.undo.xxxxx.xxsql files
                var regExpMatches = undoRegExp.exec(file);
                if (!regExpMatches) return false;
                var fileVersion = regExpMatches[1];
                if(semver.lte(currentVersion, fileVersion)) return false;
                if(semver.gt(version, fileVersion)) return false;
                return true;
              });
              migrationFiles = migrationFiles.sort(function(fileE,fileB){
                var versionA = doRegExp.exec(fileA)[1];
                var versionB = doRegExp.exec(fileB)[1];
                return semver.rcompare(versionA, versionB);
              });
            }
            if(!migrationFiles.length) return cb();
            async.forEachSeries(migrationFiles, function(migrationFile, cb){
              fs.readFile(Path.join(migrationPath, migrationFile), function(err, data){
                if(err) return cb(err);
                var sql = data.toString();
                driver.execute(client, sql, options, cb);
              });
            }, function(err){
              if(err) return cb(new verror.VError(err, 'migration fails'));
              driver.setCurrentVersion(client, version, options, function(err){
                if(err) return cb(new verror.VError(err, 'fail to set current version in the db'));
                cb(null, migrationFiles);
              });
            });
          });
        });
      });
    });
  }

  function getCurrentVersion(cb){
    driver.getCurrentVersion(client, options, cb);
  }

  return {
    migrate: migrate,
    getCurrentVersion: getCurrentVersion
  };
};
