const pool = require('../config/db');

const TransactionModel = {
    createTransaction: async (customerId, totalAmount, status = 'pending') => {
        const [result] = await pool.execute(
            'INSERT INTO transactions (customer_id, total_amount, status) VALUES (?, ?, ?)',
            [customerId, totalAmount, status]
        );
        return result.insertId;
    },
    addTransactionItem: async (transactionId, productId, quantity, pricePerItem) => {
        const [result] = await pool.execute(
            'INSERT INTO transaction_items (transaction_id, product_id, quantity, price_per_item) VALUES (?, ?, ?, ?)',
            [transactionId, productId, quantity, pricePerItem]
        );
        return result.insertId;
    },
    findById: async (id) => {
        const [rows] = await pool.execute(`
            SELECT t.*, ti.id AS item_id, ti.product_id, ti.quantity, ti.price_per_item, p.name AS product_name
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transaction_id
            JOIN products p ON ti.product_id = p.id
            WHERE t.id = ?
        `, [id]);
        return rows;
    },
    findByCustomerId: async (customerId) => {
        const [rows] = await pool.execute(`
            SELECT t.*, ti.id AS item_id, ti.product_id, ti.quantity, ti.price_per_item, p.name AS product_name
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transaction_id
            JOIN products p ON ti.product_id = p.id
            WHERE t.customer_id = ?
            ORDER BY t.transaction_date DESC
        `, [customerId]);
        return rows;
    },
    updateStatus: async (id, status) => {
        const [result] = await pool.execute('UPDATE transactions SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows;
    },
    delete: async (id) => {
        const [result] = await pool.execute('DELETE FROM transactions WHERE id = ?', [id]);
        return result.affectedRows;
    },
    getAll: async () => {
        const [rows] = await pool.execute(`
            SELECT t.*, ti.id AS item_id, ti.product_id, ti.quantity, ti.price_per_item, p.name AS product_name
            FROM transactions t
            JOIN transaction_items ti ON t.id = ti.transaction_id
            JOIN products p ON ti.product_id = p.id
            ORDER BY t.transaction_date DESC
        `);
        return rows;
    }
};

module.exports = TransactionModel;