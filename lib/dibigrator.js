var semver = require('semver');
var fs = require('fs');
var Path = require('path');
var async = require('async');

module.exports = function(client, driver, migrationPath){
  var isInitialized = false;

  function init(cb){
    if(isInitialized) return cb();
    fs.stat(migrationPath, function(err, stat){
      if(err) return cb(err);
      if(!stat.isDirectory()) return cb(new Error(migrationPath + ' is not a directory'));
      driver.init(client, function(err){
        if(err) return cb(err);
        isInitialized = true;
        cb();
      });
    });
  }

  function migrate(version, cb){
    if(!semver.valid(version)) return cb(new Error(version + ' is not a valid semver'));
    version = semver.valid(version);
    init(function(err){
      if(err) return cb(err);
      getCurrentVersion(function(err, currentVersion){
        if(err) return cb(err);
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
              driver.execute(client, sql, cb);
            });
          }, function(err){
            if(err) return cb(err);
            driver.setCurrentVersion(client, version, function(err){
              if(err) return cb(err);
              cb(null, migrationFiles);
            });
          });
        });
      });
    });
  }

  function getCurrentVersion(cb){
    driver.getCurrentVersion(client, cb);
  }

  return {
    migrate: migrate,
    getCurrentVersion: getCurrentVersion
  };
};
