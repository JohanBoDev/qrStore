const db = require('../config/db');

// Crear un envío
const createShipment = async (req, res) => {
    try {
        const { order_id, tracking_number, shipping_company, estimated_delivery } = req.body;
        const user_role = req.user.role;

        // Solo administradores pueden crear envíos
        if (user_role !== "admin") {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden gestionar envíos." });
        }

        // Verificar si el pedido existe y su estado es "Enviado"
        const [order] = await db.query("SELECT * FROM qrstore.orders WHERE id = ? AND status = 'Enviado'", [order_id]);

        if (order.length === 0) {
            return res.status(400).json({ error: "El pedido no está en estado 'Enviado' o no existe." });
        }

        // Insertar el envío en la base de datos
        const [shipment] = await db.query(`
            INSERT INTO qrstore.shipments (order_id, tracking_number, shipping_company, estimated_delivery, status) 
            VALUES (?, ?, ?, ?, 'Pendiente')
        `, [order_id, tracking_number, shipping_company, estimated_delivery]);

        res.status(201).json({ message: "Envío creado con éxito", shipment_id: shipment.insertId });

    } catch (error) {
        console.error("Error creando envío:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Ver información de envío por ID de pedido
const getShipmentByOrder = async (req, res) => {
    try {
        const { order_id } = req.params;

        // Obtener información del envío
        const [shipment] = await db.query("SELECT * FROM qrstore.shipments WHERE order_id = ?", [order_id]);

        if (shipment.length === 0) {
            return res.status(404).json({ message: "Envío no encontrado." });
        }

        res.json(shipment[0]);

    } catch (error) {
        console.error("Error obteniendo envío:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Actualizar estado del envío
const updateShipmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user_role = req.user.role;

        // Solo admins pueden actualizar el estado del envío
        if (user_role !== "admin") {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden actualizar envíos." });
        }

        // Validar estado del envío
        const validStatuses = ["Pendiente", "En camino", "Entregado"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Estado inválido. Usa 'Pendiente', 'En camino' o 'Entregado'." });
        }

        // Verificar si el envío existe
        const [shipment] = await db.query("SELECT * FROM qrstore.shipments WHERE id = ?", [id]);

        if (shipment.length === 0) {
            return res.status(404).json({ message: "Envío no encontrado." });
        }

        // Actualizar el estado del envío
        await db.query("UPDATE qrstore.shipments SET status = ? WHERE id = ?", [status, id]);

        res.json({ message: `Estado del envío actualizado a '${status}' correctamente.` });

    } catch (error) {
        console.error("Error actualizando estado del envío:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};


// Eliminar envío
const deleteShipment = async (req, res) => {
    try {
        const { id } = req.params;
        const user_role = req.user.role;

        if (user_role !== "admin") {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden eliminar envíos." });
        }

        // Verificar si el envío existe
        const [shipment] = await db.query("SELECT * FROM qrstore.shipments WHERE id = ?", [id]);

        if (shipment.length === 0) {
            return res.status(404).json({ message: "Envío no encontrado." });
        }

        // Eliminar el envío
        await db.query("DELETE FROM qrstore.shipments WHERE id = ?", [id]);

        res.json({ message: "Envío eliminado correctamente." });

    } catch (error) {
        console.error("Error eliminando envío:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Obtener envíos de usuario autenticado
const getUserShipments = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Obtener todos los envíos de los pedidos del usuario autenticado
        const query = `
            SELECT s.id, s.order_id, s.tracking_number, s.shipping_company, 
                   s.estimated_delivery, s.status, o.total, o.created_at 
            FROM qrstore.shipments s
            JOIN qrstore.orders o ON s.order_id = o.id
            WHERE o.user_id = ?
            ORDER BY s.created_at DESC
        `;

        const [shipments] = await db.query(query, [user_id]);

        res.json({ total_shipments: shipments.length, shipments });

    } catch (error) {
        console.error("Error obteniendo envíos del usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Obtener todos los envíos (solo admin)
const getAllShipments = async (req, res) => {
    try {
        const user_role = req.user.role;

        if (user_role !== "admin") {
            return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden ver todos los envíos." });
        }

        // Obtener todos los envíos con detalles del pedido y usuario
        const query = `
            SELECT s.id, s.order_id, s.tracking_number, s.shipping_company, 
                   s.estimated_delivery, s.status, o.user_id, u.name AS user_name, 
                   o.total, o.created_at 
            FROM qrstore.shipments s
            JOIN qrstore.orders o ON s.order_id = o.id
            JOIN qrstore.users u ON o.user_id = u.id
            ORDER BY s.created_at DESC
        `;

        const [shipments] = await db.query(query);

        res.json({ total_shipments: shipments.length, shipments });

    } catch (error) {
        console.error("Error obteniendo todos los envíos:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};




module.exports = { createShipment, getShipmentByOrder, updateShipmentStatus, deleteShipment, getUserShipments, getAllShipments };
