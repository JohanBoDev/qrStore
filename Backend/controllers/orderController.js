const db = require("../config/db");

// Crear un pedido
const createOrder = async (req, res) => {
    try {
        const user_id = req.user.id;

        // 1️⃣ Verificar si el carrito tiene productos
        const [cartItems] = await db.query(`
            SELECT c.product_id, c.quantity, p.price 
            FROM qrstore.cart c
            JOIN qrstore.products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [user_id]);

        if (cartItems.length === 0) {
            return res.status(400).json({ error: "El carrito está vacío." });
        }

        // 2️⃣ Calcular el total del pedido
        const total_price = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 3️⃣ Insertar el pedido en la tabla `orders`
        const [orderResult] = await db.query(`
            INSERT INTO qrstore.orders (user_id, total, status, created_at) 
            VALUES (?, ?, 'Pendiente', NOW())
        `, [user_id, total_price]);

        const order_id = orderResult.insertId;

        // 4️⃣ Insertar los productos en `order_items`
        for (let item of cartItems) {
            await db.query(`
                INSERT INTO qrstore.order_items (order_id, product_id, quantity, unit_price, subtotal) 
                VALUES (?, ?, ?, ?, ?)
            `, [order_id, item.product_id, item.quantity, item.price, item.price * item.quantity]);
        }

        // 5️⃣ Vaciar el carrito después de confirmar la compra
        await db.query("DELETE FROM qrstore.cart WHERE user_id = ?", [user_id]);

        res.json({ message: "Pedido creado con éxito", order_id });

    } catch (error) {
        console.error("Error creando el pedido:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Obtener los pedidos de un usuario
const getOrders = async (req, res) => {
    try {
        const user_id = req.user.id; // ID del usuario autenticado

        // Obtener los pedidos del usuario
        const query = `
            SELECT id, total, status, created_at 
            FROM qrstore.orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;

        const [orders] = await db.query(query, [user_id]);

        res.json({ total_orders: orders.length, orders });

    } catch (error) {
        console.error("Error obteniendo pedidos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Obtener los detalles de un pedido
const getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params; // ID del pedido
        const user_id = req.user.id; // ID del usuario autenticado

        // Verificar si el pedido pertenece al usuario
        const [order] = await db.query(
            "SELECT * FROM qrstore.orders WHERE id = ? AND user_id = ?", 
            [id, user_id]
        );

        if (order.length === 0) {
            return res.status(404).json({ message: "Pedido no encontrado." });
        }

        // Obtener los productos dentro del pedido
        const query = `
            SELECT oi.product_id, p.name, p.image_url, oi.unit_price, oi.quantity, oi.subtotal 
            FROM qrstore.order_items oi
            JOIN qrstore.products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `;

        const [orderItems] = await db.query(query, [id]);

        res.json({ order: order[0], items: orderItems });

    } catch (error) {
        console.error("Error obteniendo detalles del pedido:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

//Cambiar el estado de un pedido
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params; // ID del pedido
        const { status } = req.body;
        const user_role = req.user.role; // Verificar si el usuario es admin

        // Verificar si el usuario es administrador
        if (user_role !== "admin") {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden actualizar pedidos." });
        }

        // Verificar si el pedido existe
        const [order] = await db.query("SELECT * FROM qrstore.orders WHERE id = ?", [id]);

        if (order.length === 0) {
            return res.status(404).json({ message: "Pedido no encontrado." });
        }

        // Validar el nuevo estado del pedido
        const validStatuses = ["Pendiente", "Enviado", "Entregado"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Estado inválido. Usa 'Pendiente', 'Enviado' o 'Entregado'." });
        }

        // Actualizar el estado del pedido
        await db.query("UPDATE qrstore.orders SET status = ? WHERE id = ?", [status, id]);

        res.json({ message: `Pedido actualizado a '${status}' correctamente.` });

    } catch (error) {
        console.error("Error actualizando el estado del pedido:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Obtener todos los pedidos (solo para administradores)
const getAllOrders = async (req, res) => {
    try {
        const user_role = req.user.role;

        // Verificar si el usuario es administrador
        if (user_role !== "admin") {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden ver todos los pedidos." });
        }

        // Obtener todos los pedidos con información del usuario
        const query = `
            SELECT o.id, o.user_id, u.name AS user_name, o.total, o.status, o.created_at 
            FROM qrstore.orders o
            JOIN qrstore.users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `;

        const [orders] = await db.query(query);

        res.json({ total_orders: orders.length, orders });

    } catch (error) {
        console.error("Error obteniendo todos los pedidos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Eliminar pedido (para admin y usuario con pedidos propios)
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params; // ID del pedido
        const user_id = req.user.id;
        const user_role = req.user.role;

        // Verificar si el pedido pertenece al usuario o si es admin
        const [order] = await db.query("SELECT * FROM qrstore.orders WHERE id = ?", [id]);

        if (order.length === 0) {
            return res.status(404).json({ message: "Pedido no encontrado." });
        }

        if (order[0].user_id !== user_id && user_role !== "admin") {
            return res.status(403).json({ error: "Acceso denegado. No puedes eliminar este pedido." });
        }

        // Eliminar los productos asociados en order_items
        await db.query("DELETE FROM qrstore.order_items WHERE order_id = ?", [id]);

        // Eliminar el pedido
        await db.query("DELETE FROM qrstore.orders WHERE id = ?", [id]);

        res.json({ message: "Pedido eliminado correctamente." });

    } catch (error) {
        console.error("Error eliminando pedido:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

module.exports = { createOrder, getOrders, getOrderDetails, updateOrderStatus, getAllOrders, deleteOrder };