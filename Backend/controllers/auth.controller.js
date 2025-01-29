const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Registro de usuario
exports.register = (req, res) => {
    const { name, email, password, phone, address } = req.body;

    // Verificar si el usuario ya existe
    User.getByEmail(email, (err, results) => {
        if (results.length > 0) return res.status(400).json({ error: 'El usuario ya existe' });

        // Hashear la contraseña antes de guardarla
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = { name, email, password: hashedPassword, phone, address };

        // Guardar usuario en la base de datos
        User.create(newUser, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'Usuario registrado correctamente' });
        });
    });
};

// Inicio de sesión
exports.login = (req, res) => {
    const { email, password } = req.body;

    User.getByEmail(email, (err, results) => {
        if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

        const user = results[0];

        // Verificar la contraseña
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({ message: 'Login exitoso', token, user: { name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role } });
    });
};

// Obtener todos los usuarios
exports.getAllUsers = (req, res) => {
    User.getAll((err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Obtener un usuario por su ID
exports.getUserById = (req, res) => {
    const { id } = req.params;
    
    User.getById(id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(result[0]);
    });
};

// Actualizar un usuario
exports.updateUser = (req, res) => {
    const { id } = req.params;
    const { name, phone, address, role } = req.body;

    const updatedData = { name, phone, address, role };

    User.update(id, updatedData, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Usuario actualizado correctamente' });
    });
};

// Actualizar la contraseña de un usuario
exports.updatePassword = (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) return res.status(400).json({ error: 'La nueva contraseña es obligatoria' });

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    User.updatePassword(id, hashedPassword, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Contraseña actualizada correctamente' });
    });
};

// Eliminar un usuario
exports.deleteUser = (req, res) => {
    const { id } = req.params;

    User.delete(id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Usuario eliminado correctamente' });
    });
};
