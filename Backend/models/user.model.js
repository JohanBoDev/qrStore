const db = require('../config/db');

const User = {

    // Función para obtener un usuario por su email
    getByEmail: (email, callback) => {
        db.query('SELECT * FROM users WHERE email = ?', [email], callback);
    },
    // Función para registrar un nuevo usuario
    create: (data, callback) => {
        db.query('INSERT INTO users SET ?', data, callback);
    },

    // Función para obtener todos los usuarios
    getAll: callback => {
        db.query('SELECT id, name, email, phone, address, profile_picture FROM users', callback);
    }, 

    // Función para obtener un usuario por su ID
    getById: (id, callback) => {
        db.query('SELECT id, name, email, phone, address, profile_picture FROM users WHERE id = ?', [id], callback);
    },

    // Función para actualizar un usuario 
    update: (id, data, callback) => {
        db.query('UPDATE users SET ? WHERE id = ?', [data, id], callback);
    },

    // Función para actualizar la contraseña de un usuario
    updatePassword: (id, password, callback) => {
        db.query('UPDATE users SET password = ? WHERE id = ?', [password, id], callback);
    },

    // Función para eliminar un usuario
    delete: (id, callback) => {
        db.query('DELETE FROM users WHERE id = ?', [id], callback);
    }
};

module.exports = User;
