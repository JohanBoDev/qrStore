const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middleware/auth.middleware');


// Ruta para registrar un usuario
router.post('/register',  authController.register);

// Ruta para iniciar sesión
router.post('/login', authController.login);

// Obtener todos los usuarios (requiere autenticación)
router.get('/', verificarToken, verificarAdmin, authController.getAllUsers); 

// Obtener un usuario por ID
router.get('/:id', verificarToken, verificarAdmin, authController.getUserById);

// Actualizar datos de usuario
router.put('/:id', verificarToken, authController.updateUser);

// Cambiar contraseña
router.put('/:id/password', verificarToken, verificarAdmin, authController.updatePassword);

// Eliminar usuario
router.delete('/:id', verificarToken, verificarAdmin, authController.deleteUser);

module.exports = router;
