require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const db = require('./config/db');
const productsRoutes = require('./routes/products');


const app = express();

// Middleware de seguridad
app.use(express.json());
app.use(cookieParser()); // Necesario para CSRF
app.use(helmet()); // Protección de cabeceras HTTP
app.use(morgan('dev')); // Registro de solicitudes en consola

// Configurar CORS (Restringido)
const corsOptions = {
    origin: ['http://localhost:3000', 'https://tu-dominio.com'],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true
};
app.use(cors(corsOptions));


// Rate Limiting (evita abuso de la API)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 solicitudes por IP
    message: { error: "Demasiadas solicitudes, intenta más tarde" }
});
app.use('/api/', limiter);

// Rutas
app.use('/api/users', require('./routes/auth.routes'));
app.use('/api/products', productsRoutes);
// Ruta principal
app.get('/', (req, res) => {
    res.send('API de QrStore funcionando 🚀');
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
