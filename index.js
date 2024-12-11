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
            roomNumber: { type: 'string', description: 'Numéro de la chambre', example: 'C400' },
            type: { 
              type: 'string', 
              description: 'Type de chambre',
              enum: ['single', 'double', 'suite'],
              example: 'double'
            },
            price: { 
              type: 'number', 
              description: 'Prix par nuit',
              example: 150.00
            },
            isAvailable: {
              type: 'boolean',
              description: 'Disponibilité de la chambre',
              example: true
            },
            amenities: {
              type: 'array',
              items: { type: 'string' },
              description: 'Liste des équipements',
              example: ['TV', 'WiFi', 'Mini-bar']
            },
            capacity: {
              type: 'number',
              description: 'Capacité de la chambre',
              example: 2
            },
            floor: {
              type: 'number',
              description: 'Étage de la chambre',
              example: 4
            },
            description: {
              type: 'string',
              description: 'Description de la chambre',
              example: 'Chambre double confortable avec vue sur la ville'
            }
          },
        },
      },
    },
  },
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((error) => console.error('❌ MongoDB connection error:', error));

// Modèle Mongoose amélioré pour les chambres
const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    required: true,
    enum: ['single', 'double', 'suite']
  },
  price: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
  amenities: [String],
  capacity: { type: Number, required: true },
  description: String,
  floor: { type: Number, required: true }
}, {
  timestamps: true
});

const Room = mongoose.model('Room', roomSchema);

app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API Chambre! Visitez <a href="/api-docs">/api-docs</a> pour la documentation.');
});

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Récupérer toutes les chambres
 *     description: Renvoie une liste de toutes les chambres dans la base de données.
 *     tags:
 *       - Chambres
 *     parameters:
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filtrer par disponibilité
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrer par type de chambre
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
    const { available, type } = req.query;
    let query = {};
    
    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }
    if (type) {
      query.type = type;
    }
    
    const rooms = await Room.find(query);
    res.status(200).json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving rooms', error });
  }
});

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Récupérer une chambre par ID
 *     description: Renvoie les détails d'une chambre spécifique.
 *     tags:
 *       - Chambres
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la chambre
 *     responses:
 *       200:
 *         description: Chambre trouvée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       404:
 *         description: Chambre non trouvée
 */
app.get('/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving room', error });
  }
});

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Ajouter une nouvelle chambre
 *     description: Crée une nouvelle chambre avec tous les détails nécessaires.
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
    const newRoom = new Room(req.body);
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating room', error });
  }
});

/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     summary: Mettre à jour une chambre
 *     description: Met à jour les détails d'une chambre existante.
 *     tags:
 *       - Chambres
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la chambre
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Room'
 *     responses:
 *       200:
 *         description: Chambre mise à jour avec succès
 *       404:
 *         description: Chambre non trouvée
 */
app.put('/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating room', error });
  }
});

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Supprimer une chambre
 *     description: Supprime une chambre existante.
 *     tags:
 *       - Chambres
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la chambre
 *     responses:
 *       200:
 *         description: Chambre supprimée avec succès
 *       404:
 *         description: Chambre non trouvée
 */
app.delete('/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ message: 'Room deleted successfully', room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting room', error });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
