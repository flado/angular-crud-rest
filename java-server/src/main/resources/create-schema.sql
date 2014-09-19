DROP SCHEMA IF EXISTS REF;

CREATE SCHEMA IF NOT EXISTS REF; 
 
drop table REF.stream if exists;

create table REF.stream (stream_id integer generated by default as identity, create_by varchar(40) not null, create_ts timestamp not null, db_create_ts timestamp, db_last_update_ts timestamp, last_update_by varchar(40), last_update_ts timestamp, code integer not null, dscr varchar(100) not null, primary key (stream_id));

