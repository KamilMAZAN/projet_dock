-- init.sql
CREATE TABLE IF NOT EXISTS utilisateur (
    id serial PRIMARY KEY,
    "Prenom" VARCHAR (255) NOT NULL,
    "Nom" VARCHAR (255) NOT NULL
);
