ALTER TABLE uuser ADD COLUMN name varchar(50);

-- Fill name values. email: 'foo.bar@email.com' will give name: 'foo bar'
UPDATE uuser SET name = replace(substring(email from '(.*)@'), '.', ' ');
