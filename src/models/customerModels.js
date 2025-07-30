const pool = require('../config/db');

const CustomerModel = {
    create: async (userId, name, email, phone, address) => {
        const [result] = await pool.execute(
            'INSERT INTO customers (user_id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
            [userId, name, email, phone, address]
        );
        return result.insertId;
    },
    findById: async (id) => {
        const [rows] = await pool.execute('SELECT * FROM customers WHERE id = ?', [id]);
        return rows[0];
    },
    findByUserId: async (userId) => {
        const [rows] = await pool.execute('SELECT * FROM customers WHERE user_id = ?', [userId]);
        return rows[0];
    },
    update: async (id, name, email, phone, address) => {
        const [result] = await pool.execute(
            'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name, email, phone, address, id]
        );
        return result.affectedRows;
    },
    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM customers WHERE id = ?', [id]);
        return result.affectedRows;
    },
    getAll: async () => {
        const [rows] = await pool.execute('SELECT * FROM customers');
        return rows;
    }
};

module.exports = CustomerModel;