const db = require("../config/db"); // Conexión a MySQL con mysql2/promise
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// 📌 Registro de usuario
exports.register = async (req, res) => {
    try {
        // Validación de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, phone, address } = req.body;

        // Verificar si el usuario ya existe
        const [existingUser] = await db.query("SELECT * FROM qrstore.users WHERE email = ?", [email]);

        if (existingUser.length > 0) {
            return res.status(400).json({ error: "El usuario ya existe" });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario en la base de datos
        const query = `
            INSERT INTO qrstore.users (name, email, password, phone, address, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        const [result] = await db.query(query, [name, email, hashedPassword, phone, address]);

        res.status(201).json({ message: "Usuario registrado correctamente", user_id: result.insertId });

    } catch (error) {
        console.error("Error en el registro:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// 📌 Inicio de sesión
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Verificar si el usuario existe
        const [users] = await db.query("SELECT * FROM qrstore.users WHERE email = ?", [email]);

        if (users.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const user = users[0];

        // Verificar la contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: "Login exitoso",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
            },
        });

    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// 📌 Obtener todos los usuarios (solo admins)
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Acceso denegado" });
        }

        const [users] = await db.query("SELECT id, name, email, phone, address, role FROM qrstore.users");
        res.json(users);

    } catch (error) {
        console.error("Error obteniendo usuarios:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// 📌 Obtener un usuario por su ID (solo admins o el propio usuario)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: "Acceso denegado" });
        }

        const [user] = await db.query("SELECT id, name, email, phone, address, role FROM qrstore.users WHERE id = ?", [id]);

        if (user.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        res.json(user[0]);

    } catch (error) {
        console.error("Error obteniendo usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// 📌 Actualizar un usuario (solo admins o el propio usuario)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, address, role } = req.body;

        if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: "Acceso denegado" });
        }

        const query = "UPDATE qrstore.users SET name = ?, phone = ?, address = ?, role = ? WHERE id = ?";
        await db.query(query, [name, phone, address, role, id]);

        res.json({ message: "Usuario actualizado correctamente" });

    } catch (error) {
        console.error("Error actualizando usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// 📌 Actualizar la contraseña de un usuario (solo el propio usuario)
exports.updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: "Acceso denegado" });
        }

        if (!newPassword) {
            return res.status(400).json({ error: "La nueva contraseña es obligatoria" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const query = "UPDATE qrstore.users SET password = ? WHERE id = ?";
        await db.query(query, [hashedPassword, id]);

        res.json({ message: "Contraseña actualizada correctamente" });

    } catch (error) {
        console.error("Error actualizando contraseña:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// 📌 Eliminar un usuario (solo admins o el propio usuario)
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
            return res.status(403).json({ error: "Acceso denegado" });
        }

        const query = "DELETE FROM qrstore.users WHERE id = ?";
        await db.query(query, [id]);

        res.json({ message: "Usuario eliminado correctamente" });

    } catch (error) {
        console.error("Error eliminando usuario:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
