-- UP

alter table POSTS modify created_at TIMESTAMP default utc_timestamp();
alter table POSTS modify updated_at TIMESTAMP default utc_timestamp();

alter table ATTACHMENTS modify created_at TIMESTAMP default utc_timestamp();
alter table QUOTES modify created_at TIMESTAMP default utc_timestamp();
alter table TAGS modify created_at TIMESTAMP default utc_timestamp();
alter table USERS modify created_at TIMESTAMP default utc_timestamp();
alter table USERS modify updated_at TIMESTAMP default utc_timestamp();


-- DOWN

alter table POSTS modify created_at TIMESTAMP default current_timestamp();
alter table POSTS modify updated_at TIMESTAMP default current_timestamp();

alter table ATTACHMENTS modify created_at TIMESTAMP default current_timestamp();
alter table QUOTES modify created_at TIMESTAMP default current_timestamp();
alter table TAGS modify created_at TIMESTAMP default current_timestamp();
alter table USERS modify created_at TIMESTAMP default current_timestamp();
alter table USERS modify updated_at TIMESTAMP default current_timestamp();