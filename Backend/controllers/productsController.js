const db = require('../config/db'); // Conexión a MySQL
const { get } = require('../routes/products');

const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category_id, brand, image_url } = req.body;

        // Validación básica
        if (!name || !price || !stock || !category_id) {
            return res.status(400).json({ error: 'Todos los campos requeridos deben ser proporcionados.' });
        }

        // Query corregida con `db.query()` y la estructura adecuada
        const query = `
            INSERT INTO qrstore.products (name, description, price, stock, category_id, brand, image_url, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await db.query(query, [name, description, price, stock, category_id, brand, image_url]);

        res.status(201).json({ message: 'Producto creado con éxito', product_id: result.insertId });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getProducts = async (req, res) => {
    try {
        let { page, category_id, min_price, max_price, in_stock, brand, sort, search } = req.query;
        const limit = 10;
        page = parseInt(page) || 1;
        const offset = (page - 1) * limit;

        // Construcción dinámica de la consulta SQL
        let query = "SELECT * FROM qrstore.products WHERE deleted_at IS NULL"; // 🔹 Excluir eliminados
        let queryParams = [];

        // 🔹 Filtro por categoría
        if (category_id) {
            query += " AND category_id = ?";
            queryParams.push(category_id);
        }

        // 🔹 Filtro por rango de precios
        if (min_price) {
            query += " AND price >= ?";
            queryParams.push(min_price);
        }
        if (max_price) {
            query += " AND price <= ?";
            queryParams.push(max_price);
        }

        // 🔹 Filtro por stock (si `in_stock=1` solo muestra productos con stock disponible)
        if (in_stock === "1") {
            query += " AND stock > 0";
        }

        // 🔹 Filtro por marca
        if (brand) {
            query += " AND brand = ?";
            queryParams.push(brand);
        }

        // 🔹 Filtro de búsqueda (por nombre o descripción)
        let searchTerm = null;
        if (search) {
            searchTerm = `%${search}%`; // Agregar % para coincidencias parciales
            query += " AND (name LIKE ? OR description LIKE ?)";
            queryParams.push(searchTerm, searchTerm);
        }

        // 🔹 Ordenamiento (sort: `price_asc`, `price_desc`, `latest`)
        if (sort === "price_asc") {
            query += " ORDER BY price ASC";
        } else if (sort === "price_desc") {
            query += " ORDER BY price DESC";
        } else if (sort === "latest") {
            query += " ORDER BY created_at DESC";
        }

        // Agregar paginación
        query += " LIMIT ? OFFSET ?";
        queryParams.push(limit, offset);

        // Ejecutar consulta
        const [products] = await db.query(query, queryParams);

        // Obtener el total de productos sin paginación
        let countQuery = "SELECT COUNT(*) AS total FROM qrstore.products WHERE deleted_at IS NULL"; // 🔹 Excluir eliminados
        let countParams = [];

        if (search) {
            countQuery += " AND (name LIKE ? OR description LIKE ?)";
            countParams.push(searchTerm, searchTerm);
        }

        const [totalResult] = await db.query(countQuery, countParams.length > 0 ? countParams : undefined);
        const totalProducts = totalResult[0].total;
        const totalPages = Math.ceil(totalProducts / limit);

        res.json({
            currentPage: page,
            totalPages,
            totalProducts,
            products
        });

    } catch (error) {
        console.error("Error obteniendo productos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        // Consulta para obtener el producto con su categoría
        const query = `
            SELECT p.*, c.name AS category_name 
            FROM qrstore.products p
            LEFT JOIN qrstore.categories c ON p.category_id = c.id
            WHERE p.id = ?
        `;

        const [product] = await db.query(query, [id]);

        if (product.length === 0) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        res.json(product[0]);

    } catch (error) {
        console.error("Error obteniendo producto:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Actualizar un producto
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, category_id, brand, image_url } = req.body;

        // Verificar si el producto existe antes de actualizar
        const [existingProduct] = await db.query("SELECT * FROM qrstore.products WHERE id = ?", [id]);

        if (existingProduct.length === 0) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        // Construir la consulta de actualización dinámicamente
        let query = "UPDATE qrstore.products SET";
        let queryParams = [];

        if (name) {
            query += " name = ?,";
            queryParams.push(name);
        }
        if (description) {
            query += " description = ?,";
            queryParams.push(description);
        }
        if (price) {
            query += " price = ?,";
            queryParams.push(price);
        }
        if (stock) {
            query += " stock = ?,";
            queryParams.push(stock);
        }
        if (category_id) {
            query += " category_id = ?,";
            queryParams.push(category_id);
        }
        if (brand) {
            query += " brand = ?,";
            queryParams.push(brand);
        }
        if (image_url) {
            query += " image_url = ?,";
            queryParams.push(image_url);
        }

        // Eliminar la última coma y agregar WHERE
        query = query.slice(0, -1) + " WHERE id = ?";
        queryParams.push(id);

        // Ejecutar la actualización
        await db.query(query, queryParams);

        res.json({ message: "Producto actualizado correctamente" });

    } catch (error) {
        console.error("Error actualizando producto:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Eliminar un producto (Soft Delete)
const softDeleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el producto existe
        const [existingProduct] = await db.query("SELECT * FROM qrstore.products WHERE id = ?", [id]);

        if (existingProduct.length === 0) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        // Verificar si el producto ya está eliminado
        if (existingProduct[0].deleted_at) {
            return res.status(400).json({ message: "El producto ya está eliminado" });
        }

        // Marcar como eliminado (Soft Delete)
        await db.query("UPDATE qrstore.products SET deleted_at = NOW() WHERE id = ?", [id]);

        res.json({ message: "Producto marcado como eliminado" });

    } catch (error) {
        console.error("Error en Soft Delete:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Restaurar un producto eliminado
const restoreProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el producto existe y está eliminado
        const [existingProduct] = await db.query("SELECT * FROM qrstore.products WHERE id = ? AND deleted_at IS NOT NULL", [id]);

        if (existingProduct.length === 0) {
            return res.status(404).json({ message: "Producto no encontrado o ya activo" });
        }

        // Restaurar el producto
        await db.query("UPDATE qrstore.products SET deleted_at = NULL WHERE id = ?", [id]);

        res.json({ message: "Producto restaurado con éxito" });

    } catch (error) {
        console.error("Error restaurando producto:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};


module.exports = { createProduct, getProducts, getProductById, updateProduct, softDeleteProduct, restoreProduct };
