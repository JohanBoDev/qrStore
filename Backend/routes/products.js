const express = require('express');
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middleware/auth.middleware');
const {createProduct, getProducts, getProductById, updateProduct} = require('../controllers/productsController');

// Crear un nuevo producto
router.post('/create', verificarToken, verificarAdmin, createProduct);

// Obtener todos los productos
router.get('/', getProducts);

// Obtener un producto por ID
router.get('/:id', getProductById);

// Actualizar un producto por ID
router.put('/:id', verificarToken, verificarAdmin, updateProduct);

module.exports = router;