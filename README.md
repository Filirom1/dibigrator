# dibigrator
[![Build Status](https://travis-ci.org/openruko/dibigrator.png)](https://travis-ci.org/openruko/dibigrator)

A database migration tools using plain SQL scripts and [semver](https://npmjs.org/doc/semver.html);

## Usage

Write some migrations scripts in a folder. Take a look at test/fixture:

    $ ls test/fixture/
    0.1.0.do.user.sql  0.1.0.undo.user.sql  0.2.0.do.user.sql  0.2.0.undo.user.sql  0.2.1.do.user.sql

    $ tail test/fixture/*
    ==> test/fixture/0.1.0.do.user.sql <==
    CREATE TABLE uuser(
      id serial NOT NULL,
      email text NOT NULL,
      password_encrypted text NOT NULL,
      CONSTRAINT users_pkey PRIMARY KEY (id),
      CONSTRAINT users_email_key UNIQUE (email)
    );

    INSERT INTO uuser(email, password_encrypted) VALUES('Foo@gmail.com', '1234');
    INSERT INTO uuser(email, password_encrypted) VALUES('Foo.Bar@gmail.com', '1234');

    ==> test/fixture/0.1.0.undo.user.sql <==
    DROP TABLE IF EXISTS uuser;

    ==> test/fixture/0.2.0.do.user.sql <==
    ALTER TABLE uuser ADD COLUMN name varchar(50);

    -- Fill name values. email: 'foo.bar@email.com' will give name: 'foo bar'
    UPDATE uuser SET name = replace(substring(email from '(.*)@'), '.', ' ');

    ==> test/fixture/0.2.0.undo.user.sql <==
    ALTER TABLE uuser DROP COLUMN name RESTRICT;

    ==> test/fixture/0.2.1.do.user.sql <==
    UPDATE uuser SET name=lower(name);

Then plug your postgresql connection to dibigrator, and call the migrate function.

    var client = new pg.Client("tcp://USER:PASSWORD@localhost/postgres");
    client.connect();
    var dibigrator = require('dibigrator').postgresql(client, '/path/to/my/migration/files');
    dibigrator.migrate('0.2.1', function(err, migrations){
      if(err) return console.error(err);
      ...
    });

Migrations scripts will be executed ;)

## Test

    $ export DATABASE_URL="tcp://USER:PASSWORD@localhost/postgres"
    $ npm test

## Thanks to

<https://github.com/redidas/postgrator> for inspiration

## LICENSE (MIT)

Copyright (C) 2012 <Filirom1@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
