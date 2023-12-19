const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
const port = 2115;

app.use(express.static(__dirname));

// PostgreSQL configuration
const pgPool = new Pool({
  user: 'user',
  host: 'postgres',
  database: 'data',
  password: 'user',
  port: 5432,
});

// Redis configuration
const redisHost = process.env.REDIS_HOST || 'redis';
const redisClient = redis.createClient({ host: redisHost, port: 6379 });

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/submit', async (req, res) => {
  const data1 = req.body.Username;
  const data2 = req.body.Mail;
  const data3 = req.body.MDP;

  console.log('Received data:', data1, data2, data3);

  try {
    // PostgreSQL
    const pgClient = await pgPool.connect();
    await pgClient.query('INSERT INTO utilisateur ("Username", "Mail") VALUES ($1, $2)', [data1, data2]);

    // Récupération de toutes les données depuis la base de données sous la bonne forme
    const allDataFromDB = (await pgClient.query('SELECT * FROM utilisateur')).rows;

    pgClient.release();

    // Redis
    // Ajout du mot de passe associé à l'utilisateur dans Redis
    redisClient.hset('userPasswords', `${data1}-${data2}`, data3);

    // Récupération de toutes les données depuis Redis sous la bonne forme
    const allDataFromRedis = await new Promise((resolve, reject) => {
      redisClient.smembers('data', (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Envoi des données au client en utilisant AJAX pour mettre à jour la page sans rechargement
    res.json({
      dataFromDB: allDataFromDB,
      dataFromRedis: allDataFromRedis
    });
  } catch (error) {
    res.status(500).send('Error submitting data to databases');
  }
});

app.get('/getUserData', async (req, res) => {
  try {
    // PostgreSQL
    const pgClient = await pgPool.connect();
    const allUserDataFromDB = (await pgClient.query('SELECT "Username", "Mail" FROM utilisateur')).rows;
    pgClient.release();

    console.log('Données utilisateur depuis PostgreSQL:', allUserDataFromDB);

    res.json(allUserDataFromDB);
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur depuis PostgreSQL:', error);
    res.status(500).send('Erreur lors de la récupération des données utilisateur');
  }
});

app.get('/getPassword', async (req, res) => {
  try {
    const Username = req.query.Username;
    const Mail = req.query.Mail;

    // Redis
    const passwordFromRedis = await new Promise((resolve, reject) => {
      redisClient.hget('userPasswords', `${Username}-${Mail}`, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    console.log(`Mot de passe récupéré depuis Redis pour ${Username} ${Mail}:`, passwordFromRedis);

    res.send(passwordFromRedis);
  } catch (error) {
    console.error('Erreur lors de la récupération du mot de passe depuis Redis:', error);
    res.status(500).send('Erreur lors de la récupération du mot de passe depuis Redis');
  }
});

app.delete('/deleteUser', async (req, res) => {
  try {
    const Username = req.query.Username;
    const Mail = req.query.Mail;

    // PostgreSQL
    const pgClient = await pgPool.connect();
    await pgClient.query('DELETE FROM utilisateur WHERE "Username" = $1 AND "Mail" = $2', [Username, Mail]);

    console.log(`Utilisateur ${Username} ${Mail} supprimé depuis PostgreSQL`);

    pgClient.release();

    res.send('Utilisateur supprimé avec succès depuis PostgreSQL');
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur depuis PostgreSQL:', error);
    res.status(500).send('Erreur lors de la suppression de l\'utilisateur depuis PostgreSQL');
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
