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
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classe' }],
});

const Matiere = mongoose.model('Matiere', matiereSchema);

// Définition du schéma pour Classe
const classeSchema = new mongoose.Schema({
  nom: String,
  niveau: Number,
  matieres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Matiere' }],
});

const Classe = mongoose.model('Classe', classeSchema);


const classMatiereSchema = new mongoose.Schema({
  classeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classe' },
  matiereId: { type: mongoose.Schema.Types.ObjectId, ref: 'Matiere' },
  // Autres propriétés de la table d'association si nécessaire
});

const ClassMatiere = mongoose.model('ClassMatiere', classMatiereSchema);
// Create a new association between Classe and Matiere
app.post('/classMatieres', async (req, res) => {
  try {
    const { classeId, matiereId } = req.body;
    const classMatiere = new ClassMatiere({ classeId, matiereId });
    const savedClassMatiere = await classMatiere.save();
    res.json(savedClassMatiere);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'association.' });
  }
});
// Get all associations between Classe and Matiere
app.get('/classMatieres', async (req, res) => {
  try {
    const allClassMatieres = await ClassMatiere.find();
    res.json(allClassMatieres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des associations.' });
  }
});
// Get a specific association by ID
app.get('/classMatieres/:id', async (req, res) => {
  try {
    const classMatiere = await ClassMatiere.findById(req.params.id);
    res.json(classMatiere);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'association.' });
  }
});
// Update an association by ID
app.put('/classMatieres/:id', async (req, res) => {
  try {
    const { classeId, matiereId } = req.body;
    const updatedClassMatiere = await ClassMatiere.findByIdAndUpdate(
      req.params.id,
      { classeId, matiereId },
      { new: true }
    );
    res.json(updatedClassMatiere);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'association.' });
  }
});
// Delete an association by ID
app.delete('/classMatieres/:id', async (req, res) => {
  try {
    const deletedClassMatiere = await ClassMatiere.findByIdAndRemove(req.params.id);
    res.json(deletedClassMatiere);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'association.' });
  }
});

module.exports = ClassMatiere;
// Middleware pour parser le corps des requêtes en JSON
app.use(bodyParser.json());


// Get matieres with associated classes
app.get('/matieres', async (req, res) => {
  try {
    const matieres = await Matiere.find().populate('classes');
    res.json(matieres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des matières.' });
  }
});

// Create a new Matiere and associate with classes
// Create a new Matiere and associate with classes
app.post('/matieres', async (req, res) => {
  try {
    const nouvelleMatiere = new Matiere(req.body);
    const matiereEnregistree = await nouvelleMatiere.save();

    // Assuming req.body.classes is an array of class IDs to associate with the matiere
    const classeIds = req.body.classes || [];
    
    // Create an array to store the associations
    const associations = [];

    // Loop through each class ID and create an association
    await Promise.all(classeIds.map(async (classeId) => {
      const classMatiere = new ClassMatiere({ classeId, matiereId: matiereEnregistree._id });
      await classMatiere.save();
      associations.push(classMatiere);
    }));

    // Send the matiereEnregistree and associations in the response
    res.json({ matiere: matiereEnregistree, associations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de la matière.' });
  }
});

// Get a matiere with associated classes
app.get('/matieres/:id', async (req, res) => {
  try {
    const matiere = await Matiere.findById(req.params.id).populate('classes');
    res.json(matiere);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la matière.' });
  }
});

// Update a matiere
app.put('/matieres/:id', async (req, res) => {
  try {
    const matiere = await Matiere.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(matiere);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la matière.' });
  }
});

// Delete a matiere
app.delete('/matieres/:id', async (req, res) => {
  try {
    const matiere = await Matiere.findByIdAndRemove(req.params.id);

    // Remove associated entries in ClassMatiere
    await ClassMatiere.deleteMany({ matiereId: req.params.id });

    res.json(matiere);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la matière.' });
  }
});

app.get('/classes', async (req, res) => {
  const classes = await Classe.find();
  res.json(classes);
});

// Create a new Classe and associate with matieres
app.post('/classes', async (req, res) => {
  try {
    const nouvelleClasse = new Classe(req.body);
    const classeEnregistree = await nouvelleClasse.save();

    // Assuming req.body.matieres is an array of matiere IDs to associate with the classe
    const matiereIds = req.body.matieres || [];
    await Promise.all(matiereIds.map(async (matiereId) => {
      const classMatiere = new ClassMatiere({ classeId: classeEnregistree._id, matiereId });
      await classMatiere.save();
    }));

    res.json(classeEnregistree);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création de la classe.' });
  }
});

app.get('/classes/:id', async (req, res) => {
    const classe = await Classe.findById(req.params.id);
    res.json(classe);
  });
  
  app.put('/classes/:id', async (req, res) => {
    const classe = await Classe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(classe);
  });
  
  app.delete('/classes/:id', async (req, res) => {
    const classe = await Classe.findByIdAndRemove(req.params.id);
    res.json(classe);
  });
  

  app.listen(PORT, () => {
    console.log(`Serveur en cours d'écoute sur le port ${PORT}`);
});

