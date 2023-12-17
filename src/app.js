const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Eureka = require('eureka-js-client').Eureka;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour analyser les requêtes JSON
app.use(bodyParser.json());

// Utilisation du middleware CORS
app.use(cors());  // Ajoutez cette ligne pour permettre les requêtes CORS

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Accès refusé' });

    // Vérifier si le token est dans la liste noire
    if (tokenBlacklist.includes(token)) {
        return res.status(403).json({ message: 'Token invalide' });
    }

    jwt.verify(token, 'votre_clé_secrète', (err, user) => {
        if (err) return res.status(403).json({ message: 'Token non valide' });
        req.user = user;
        next();
    });
};


function generateAuthToken(user) {
    const token = jwt.sign({ _id: user._id, username: user.username }, 'votre_clé_secrète');
    return token;
}
// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/Education', { useNewUrlParser: true, useUnifiedTopology: true });

// Configuration d'Eureka Client
const client = new Eureka({
    instance: {
        app: 'sprint4', // Le nom de votre service
        hostName: 'localhost', // Adresse IP de votre service Node.js
        ipAddr: '127.0.0.1', // Adresse IP de votre service Node.js
        port: {
            '$': PORT,
            '@enabled': 'true',
        },
        vipAddress: 'app', // Le nom de votre service Eureka
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },
    eureka: {
        host: 'localhost',
        port: 8761,
        servicePath: '/eureka/apps/',
      },
});

app.get('/', (req, res) => {
    res.send('Bienvenue sur le microservice Node.js.');
});

client.logger.level('debug');
client.start();

client.on('started', () => {
    console.log('Service enregistré avec succès auprès d\'Eureka.');
});
const matiereSchema = new mongoose.Schema({
  nom: String,
  description: String,
});

const Matiere = mongoose.model('Matiere', matiereSchema);

// Définition du schéma pour Classe
const classeSchema = new mongoose.Schema({
  nom: String,
  niveau: Number,
});

const Classe = mongoose.model('Classe', classeSchema);

// Middleware pour parser le corps des requêtes en JSON
app.use(bodyParser.json());

app.get('/matieres', async (req, res) => {
  const matieres = await Matiere.find();
  res.json(matieres);
});

app.post('/matieres', async (req, res) => {
  const nouvelleMatiere = new Matiere(req.body);
  const matiereEnregistree = await nouvelleMatiere.save();
  res.json(matiereEnregistree);
});
app.get('/matieres/:id', async (req, res) => {
    const matiere = await Matiere.findById(req.params.id);
    res.json(matiere);
  });
  
  app.put('/matieres/:id', async (req, res) => {
    const matiere = await Matiere.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(matiere);
  });
  
  app.delete('/matieres/:id', async (req, res) => {
    const matiere = await Matiere.findByIdAndRemove(req.params.id);
    res.json(matiere);
  });
// Route pour la recherche de matières par nom
app.get('/matieres/search', async (req, res) => {
  try {
    const searchTerm = req.query.nom;

    // Utilisation d'une expression régulière insensible à la casse pour la recherche
    const result = await Matiere.find({ nom: { $regex: new RegExp(searchTerm, 'i') } });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la recherche des matières.' });
  }
});
app.get('/classes', async (req, res) => {
  const classes = await Classe.find();
  res.json(classes);
});

app.post('/classes', async (req, res) => {
  const nouvelleClasse = new Classe(req.body);
  const classeEnregistree = await nouvelleClasse.save();
  res.json(classeEnregistree);
});
app.get('/classes/:id', async (req, res) => {
    const classe = await Classe.findById(req.params.id);
    res.json(classe);
  });
  
  app.put('/classes/:id', async (req, res) => {
    const classe = await Classe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(classe);
  });
  // Route pour la recherche de classes par niveau
app.get('/classes/search', async (req, res) => {
  try {
    const searchNiveau = req.query.niveau;

    // Utilisation du niveau fourni pour la recherche
    const result = await Classe.find({ niveau: searchNiveau });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la recherche des classes.' });
  }
});

  app.delete('/classes/:id', async (req, res) => {
    const classe = await Classe.findByIdAndRemove(req.params.id);
    res.json(classe);
  });
  

  app.listen(PORT, () => {
    console.log(`Serveur en cours d'écoute sur le port ${PORT}`);
});

