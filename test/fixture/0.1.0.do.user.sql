CREATE TABLE uuser(
  id serial NOT NULL,
  email text NOT NULL,
  password_encrypted text NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);

INSERT INTO uuser(email, password_encrypted) VALUES('Foo@gmail.com', '1234');
INSERT INTO uuser(email, password_encrypted) VALUES('Foo.Bar@gmail.com', '1234');
