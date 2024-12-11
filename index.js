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
      description: 'API CRUD pour gérer les données des chambres',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur local',
      },
    ],
    components: {
      schemas: {
        Room: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Identifiant unique', example: '64f74c8e524a1c0012a34567' },
            name: { type: 'string', description: 'Nom de la chambre', example: 'C400' },
            status: { type: 'string', description: 'Statut de la chambre', example: 'Occupé' },
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

// Modèle Mongoose pour les chambres
const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, required: true },
});

const Room = mongoose.model('Room', roomSchema);

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API Chambre! Visitez <a href="/api-docs">/api-docs</a> pour la documentation.');
});

// Routes pour les chambres

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Récupérer toutes les chambres
 *     description: Renvoie une liste de toutes les chambres dans la base de données.
 *     tags:
 *       - Chambres
 *     responses:
 *       200:
 *         description: Liste récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 */
app.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving rooms', error });
  }
});

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Ajouter une nouvelle chambre
 *     description: Crée une nouvelle chambre avec un nom et un statut.
 *     tags:
 *       - Chambres
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       201:
 *         description: Chambre créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 */
app.post('/rooms', async (req, res) => {
  try {
    const { name, status } = req.body;
    const newRoom = new Room({ name, status });
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating room', error });
  }
});

// Port et lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
