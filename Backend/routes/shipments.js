const express = require('express');
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middleware/auth.middleware');
const { createShipment, getShipmentByOrder, updateShipmentStatus, deleteShipment, getUserShipments, getAllShipments } = require('../controllers/shipmentsController');

router.post("/", verificarToken, verificarAdmin, createShipment); // Crear un envío (Admin)
router.get("/:order_id", verificarToken, getShipmentByOrder); // Obtener envío por pedido (Usuario/Admin)
router.put("/:id", verificarToken, verificarAdmin, updateShipmentStatus); // Actualizar estado del envío (Admin)
router.delete("/:id", verificarToken, verificarAdmin, deleteShipment); // Eliminar envío (Admin)
router.get("/user/:user_id", verificarToken, getUserShipments); // Obtener envíos de usuario (Usuario/Admin)
router.get("/", verificarToken, verificarAdmin, getAllShipments); // Obtener todos los envíos (Admin)


module.exports = router;