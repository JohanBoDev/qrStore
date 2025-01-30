const express = require("express");
const router = express.Router();
const { verificarToken } = require('../middleware/auth.middleware');
const { addToCart, getCart, updateCartQuantity, deleteCartItem, clearCart } = require("../controllers/cartController");

// Agregar un producto al carrito
router.post("/", verificarToken, addToCart);

// Obtener el carrito del usuario autenticado
router.get("/", verificarToken, getCart);

// Actualizar la cantidad de un producto en el carrito
router.put("/:id", verificarToken, updateCartQuantity);

// Eliminar un producto del carrito
router.delete("/:id", verificarToken, deleteCartItem);

// Vaciar el carrito
router.delete("/", verificarToken, clearCart);

module.exports = router;
