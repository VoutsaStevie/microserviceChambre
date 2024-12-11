require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Microservice',
      version: '1.0.0',
      description: 'API CRUD pour gérer les données',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur local',
      },
    ],
    components: {
      schemas: {
        Entity: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Identifiant unique', example: '64f74c8e524a1c0012a34567' },
            name: { type: 'string', description: 'Nom de l\'entité', example: 'Example Name' },
          },
        },
      },
    },
  },
  apis: ['./index.js'], // Fichiers contenant les annotations Swagger
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Initialisation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => console.error('❌ MongoDB connection error:', error));

// Exemple de modèle Mongoose
const entitySchema = new mongoose.Schema({
  name: { type: String, required: true },
});
const Entity = mongoose.model('Entity', entitySchema);

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API Chambre! Visitez <a href="/api-docs">/api-docs</a> pour la documentation.');
});

// Exemple de routes documentées avec Swagger

/**
 * @swagger
 * /entities:
 *   get:
 *     summary: Récupérer toutes les entités
 *     description: Renvoie une liste de toutes les entités dans la base de données.
 *     tags:
 *       - Entités
 *     responses:
 *       200:
 *         description: Liste récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Entity'
 */
app.get('/entities', async (req, res) => {
  try {
    const entities = await Entity.find();
    res.status(200).json(entities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving entities', error });
  }
});

/**
 * @swagger
 * /entities:
 *   post:
 *     summary: Ajouter une nouvelle entité
 *     description: Crée une nouvelle entité avec un nom.
 *     tags:
 *       - Entités
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom de l'entité
 *                 example: New Entity
 *     responses:
 *       201:
 *         description: Entité créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Entity'
 */
app.post('/entities', async (req, res) => {
  try {
    const { name } = req.body;
    const newEntity = new Entity({ name });
    await newEntity.save();
    res.status(201).json(newEntity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating entity', error });
  }
});

// Port et lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
