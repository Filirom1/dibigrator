var chai = require('chai');
assert = chai.assert;
chai.Assertion.includeStack = true;
var pg = require('pg');
var connString = process.env.DATABASE_URL || "tcp://postgres:1234@localhost/dibigrator";

var dibigrator;
var client;

beforeEach(function(done){
  client = new pg.Client(connString);
  dibigrator = require('../').postgresql(client, __dirname + '/fixture');
  client.connect(done);
});

afterEach(function(done){
  client.end();
  done();
});

beforeEach(function(done){
  client.query('DROP TABLE dibigrator_version', function(){ done(); });
});

beforeEach(function(done){
  client.query('DROP TABLE uuser', function(){ done(); });
});

describe('dibigrator', function(){

  it('should migrate up to 0.2.0', function(done){
    dibigrator.migrate('0.2.0', function(err, migrations) {
      if (err) return done(err);
      assert.equal(migrations.length, 2);
      assert.include(migrations[0], '0.1.0');
      assert.include(migrations[1], '0.2.0');
      dibigrator.getCurrentVersion(function(err, version){
        if (err) return done(err);
        assert.equal(version, '0.2.0');
        client.query('SELECT * FROM uuser', function(err, result){
          if(err) return done(err);
          var users = result.rows;
          assert.equal(users.length, 2);
          assert.isNotNull(users[0].name);
          assert.isNotNull(users[0].email);
          done();
        });
      });
    });
  });

  describe('given a DB with version 0.2.0', function(){
    beforeEach(function(done){
      dibigrator.migrate('0.2.0', done);
    });

    it('should migrate up to 0.2.1', function(done){
      dibigrator.migrate('0.2.1', function(err, migrations) {
        if (err) return done(err);
        assert.equal(migrations.length, 1);
        assert.include(migrations[0], '0.2.1');
        dibigrator.getCurrentVersion(function(err, version){
          if (err) return done(err);
          assert.equal(version, '0.2.1');
          client.query('SELECT * FROM uuser', function(err, result){
            if(err) return done(err);
            var users = result.rows;
            var user = users.filter(function(user){
              return /Foo.Bar@gmail.com/.test(user.email);
            })[0];
            assert.equal('foo bar', user.name);
            done();
          });
        });
      });
    });

    it('should migrate down to 0.1.0', function(done){
      dibigrator.migrate('0.1.0', function(err, migrations) {
        if (err) return done(err);
        assert.equal(migrations.length, 1);
        assert.include(migrations[0], "0.1.0");
        dibigrator.getCurrentVersion(function(err, version){
          if (err) return done(err);
          assert.equal(version, "0.1.0");
          done();
        });
      });
    });
  });
});
