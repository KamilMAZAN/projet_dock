-- init.sql
CREATE TABLE IF NOT EXISTS utilisateur (
    id serial PRIMARY KEY,
    "Username" VARCHAR (255) NOT NULL,
    "Mail" VARCHAR (255) NOT NULL
);
