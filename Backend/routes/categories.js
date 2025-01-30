const express = require("express");
const router = express.Router();
const { verificarToken, verificarAdmin } = require('../middleware/auth.middleware');
const { createCategory, getCategories, updateCategory,softDeleteCategory, restoreCategory } = require("../controllers/categoryController");

// Crear una nueva categoría
router.post("/", verificarToken, verificarAdmin, createCategory); // Solo admins pueden crear categorías

// Obtener todas las categorías
router.get("/", getCategories);

// Actualizar una categoría
router.put("/:id", verificarToken, verificarAdmin, updateCategory); // Solo admins pueden actualizar categorías


// Eliminar una categoría
router.delete("/:id", verificarToken, verificarAdmin, softDeleteCategory); // Solo admins pueden eliminar categorías

// Restaurar una categoría
router.put("/restore/:id", verificarToken, verificarAdmin, restoreCategory); // Solo admins pueden restaurar categorías

module.exports = router;
