require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');


const app = express();
app.use(express.json());
app.use(cors());


//Rutas
app.use('/api/users', require('./routes/auth.routes'));

app.get('/', (req, res) => {
    res.send('API de QrStore funcionando 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
