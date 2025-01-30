const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middleware/auth.middleware');
const { createOrder, getOrders, getOrderDetails, updateOrderStatus, getAllOrders, deleteOrder } = require("../controllers/orderController");

// Obtener todos los pedidos
router.get("/all/", verificarToken, verificarAdmin, getAllOrders); // Solo administradores pueden ver todos los pedidos


// Crear un pedido
router.post("/", verificarToken, createOrder); // Solo usuarios autenticados pueden comprar

// Obtener los pedidos de un usuario
router.get("/userOrder/", verificarToken, getOrders); // Solo usuarios autenticados pueden ver sus pedidos    

// Obtener los detalles de un pedido
router.get("/:id", verificarToken, getOrderDetails); // Solo usuarios autenticados pueden ver sus pedidos

// Cambiar el estado de un pedido
router.put("/:id", verificarToken, verificarAdmin, updateOrderStatus); // Solo administradores pueden actualizar pedidos

// Eliminar un pedido
router.delete("/:id", verificarToken, deleteOrder); // Administradores pueden eliminar pedidos y usuarios pueden eliminar sus propios pedidos-

module.exports = router;