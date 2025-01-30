const db = require("../config/db"); // Conexión a MySQL


// Crear una nueva categoría
const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: "El nombre de la categoría es obligatorio." });
        }

        // Verificar si la categoría ya existe
        const [existingCategory] = await db.query("SELECT * FROM qrstore.categories WHERE name = ?", [name]);

        if (existingCategory.length > 0) {
            return res.status(400).json({ error: "La categoría ya existe." });
        }

        // Insertar la nueva categoría
        const query = "INSERT INTO qrstore.categories (name, description) VALUES (?, ?)";
        const [result] = await db.query(query, [name, description]);

        res.status(201).json({ message: "Categoría creada con éxito", category_id: result.insertId });

    } catch (error) {
        console.error("Error al crear categoría:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Obtener todas las categorías
const getCategories = async (req, res) => {
    try {
        // Excluir categorías eliminadas
        const query = "SELECT * FROM qrstore.categories WHERE deleted_at IS NULL ORDER BY name ASC";
        const [categories] = await db.query(query);

        res.json({ total: categories.length, categories });

    } catch (error) {
        console.error("Error obteniendo categorías:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Actualizar una categoría
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: "El nombre de la categoría es obligatorio." });
        }

        // Verificar si la categoría existe y no ha sido eliminada
        const [existingCategory] = await db.query("SELECT * FROM qrstore.categories WHERE id = ? AND deleted_at IS NULL", [id]);

        if (existingCategory.length === 0) {
            return res.status(404).json({ message: "Categoría no encontrada o ha sido eliminada." });
        }

        // Actualizar la categoría
        const query = "UPDATE qrstore.categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?";
        await db.query(query, [name, description, id]);

        res.json({ message: "Categoría actualizada con éxito" });

    } catch (error) {
        console.error("Error actualizando categoría:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Eliminar una categoría (Soft Delete)
const softDeleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si la categoría existe y no ha sido eliminada
        const [existingCategory] = await db.query("SELECT * FROM qrstore.categories WHERE id = ? AND deleted_at IS NULL", [id]);

        if (existingCategory.length === 0) {
            return res.status(404).json({ message: "Categoría no encontrada o ya ha sido eliminada." });
        }

        // Marcar como eliminada (Soft Delete)
        await db.query("UPDATE qrstore.categories SET deleted_at = NOW() WHERE id = ?", [id]);

        res.json({ message: "Categoría eliminada correctamente" });

    } catch (error) {
        console.error("Error eliminando categoría:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Restaurar una categoría eliminada
const restoreCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si la categoría existe y está eliminada
        const [existingCategory] = await db.query("SELECT * FROM qrstore.categories WHERE id = ? AND deleted_at IS NOT NULL", [id]);

        if (existingCategory.length === 0) {
            return res.status(404).json({ message: "Categoría no encontrada o ya está activa." });
        }

        // Restaurar la categoría (Soft Restore)
        await db.query("UPDATE qrstore.categories SET deleted_at = NULL WHERE id = ?", [id]);

        res.json({ message: "Categoría restaurada con éxito" });

    } catch (error) {
        console.error("Error restaurando categoría:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

module.exports = { createCategory, getCategories, updateCategory, softDeleteCategory, restoreCategory };
