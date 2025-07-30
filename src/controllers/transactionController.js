const TransactionModel = require('../models/transactionModel');
const ProductModel = require('../models/productModel');
const CustomerModel = require('../models/customerModel'); 
const db = require('../config/db');

/**
 * Helper function untuk mengelompokkan item transaksi.
 * Menghindari duplikasi kode di beberapa fungsi.
 * @param {Array} transactionItems - Array flat dari item hasil join table.
 * @returns {Array} - Array transaksi yang sudah dikelompokkan.
 */
const groupTransactions = (transactionItems) => {
    if (!transactionItems || transactionItems.length === 0) {
        return [];
    }
    
    const transactionsMap = new Map();
    transactionItems.forEach(item => {
        if (!transactionsMap.has(item.id)) {
            transactionsMap.set(item.id, {
                id: item.id,
                customer_id: item.customer_id,
                customer_name: item.customer_name, // Menambahkan data customer untuk frontend
                total_amount: item.total_amount,
                status: item.status,
                transaction_date: item.transaction_date,
                items: []
            });
        }
        transactionsMap.get(item.id).items.push({
            item_id: item.item_id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price_per_item: item.price_per_item
        });
    });
    return Array.from(transactionsMap.values());
};


const TransactionController = {
    /**
     * Membuat transaksi baru menggunakan database transaction
     * untuk memastikan atomicity (semua berhasil atau semua gagal).
     */
    createTransaction: async (req, res) => {
        const { customerId, items } = req.body;

        if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
            console.error('[VALIDATION ERROR] customerId/items missing:', { customerId, items });
            return res.status(400).json({ message: 'Customer ID and transaction items are required' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Validasi customer
            const [customerRows] = await connection.execute(
                'SELECT * FROM customers WHERE id = ?', [customerId]
            );
            if (customerRows.length === 0) {
                console.error('[CUSTOMER ERROR] Customer not found:', customerId);
                await connection.rollback();
                connection.release();
                return res.status(404).json({ message: 'Customer not found' });
            }

            // 2. Ambil semua data produk
            const productIds = items.map(item => item.productId);
            const [products] = await connection.query(
                `SELECT * FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`, productIds
            );
            if (!products || products.length === 0) {
                console.error('[PRODUCT ERROR] No products found for IDs:', productIds);
                await connection.rollback();
                connection.release();
                return res.status(404).json({ message: 'No products found' });
            }
            const productsMap = new Map(products.map(p => [p.id.toString(), p]));

            let totalAmount = 0;
            const processedItems = [];

            // 3. Validasi setiap item
            for (const item of items) {
                const product = productsMap.get(item.productId.toString());
                if (!product) {
                    console.error('[PRODUCT ERROR] Product not found:', item.productId);
                    await connection.rollback();
                    connection.release();
                    return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
                }
                if (product.stock < item.quantity) {
                    console.error('[STOCK ERROR] Not enough stock:', { product: product.name, available: product.stock, requested: item.quantity });
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ message: `Not enough stock for product ${product.name}. Available: ${product.stock}` });
                }
                totalAmount += product.price * item.quantity;
                processedItems.push({ 
                    productId: product.id, 
                    quantity: item.quantity, 
                    pricePerItem: product.price 
                });
            }

            // 4. Buat entry transaksi utama
            const [transactionResult] = await connection.execute(
                'INSERT INTO transactions (customer_id, total_amount, status) VALUES (?, ?, ?)',
                [customerId, totalAmount, 'pending']
            );
            const transactionId = transactionResult.insertId;
            if (!transactionId) {
                console.error('[TRANSACTION ERROR] Failed to create transaction');
                await connection.rollback();
                connection.release();
                return res.status(500).json({ message: 'Failed to create transaction' });
            }

            // 5. Tambahkan item transaksi dan update stok
            for (const item of processedItems) {
                await connection.execute(
                    'INSERT INTO transaction_items (transaction_id, product_id, quantity, price_per_item) VALUES (?, ?, ?, ?)',
                    [transactionId, item.productId, item.quantity, item.pricePerItem]
                );
                await connection.execute(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.productId]
                );
            }

            // 6. Commit transaksi
            await connection.commit();
            connection.release();
            res.status(201).json({ message: 'Transaction created successfully', transactionId });

        } catch (error) {
            await connection.rollback();
            connection.release();
            console.error('[UNCAUGHT ERROR] Error creating transaction:', error);
            res.status(500).json({ message: 'Error creating transaction', error: error.message, stack: error.stack });
        }
    },

    getTransactionById: async (req, res) => {
        const { id } = req.params;
        try {
            const transactionItems = await TransactionModel.findById(id);
            const grouped = groupTransactions(transactionItems);
            
            if (grouped.length === 0) {
                return res.status(404).json({ message: 'Transaction not found' });
            }
            
            res.status(200).json(grouped[0]); // findById seharusnya hanya mengembalikan satu transaksi
        } catch (error) {
            console.error('Error getting transaction by ID:', error);
            res.status(500).json({ message: 'Error getting transaction' });
        }
    },

    getTransactionsByCustomerId: async (req, res) => {
        const { customerId } = req.params;
        try {
            const transactionItems = await TransactionModel.findByCustomerId(customerId);
            const groupedTransactions = groupTransactions(transactionItems);

            if (groupedTransactions.length === 0) {
                return res.status(404).json({ message: 'No transactions found for this customer' });
            }

            res.status(200).json(groupedTransactions);
        } catch (error) {
            console.error('Error getting transactions by customer ID:', error);
            res.status(500).json({ message: 'Error getting transactions' });
        }
    },

    getAllTransactions: async (req, res) => {
        try {
            const transactionItems = await TransactionModel.getAll();
            const groupedTransactions = groupTransactions(transactionItems);
            res.status(200).json(groupedTransactions);
        } catch (error) {
            console.error('Error getting all transactions:', error);
            res.status(500).json({ message: 'Error getting all transactions' });
        }
    },
    
    updateTransactionStatus: async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        // ⚠️ PENTING: Jika status diubah menjadi 'cancelled', kembalikan stok produk.
        if (status === 'cancelled') {
            const trx = await db.transaction();
            try {
                const items = await TransactionModel.findItemsByTransactionId(id, trx);
                if (items.length === 0) {
                    await trx.rollback();
                    return res.status(404).json({ message: 'Transaction not found or already processed.' });
                }

                const stockRestorePromises = items.map(item => 
                    ProductModel.increaseStock(item.product_id, item.quantity, trx)
                );
                await Promise.all(stockRestorePromises);
                
                await TransactionModel.updateStatus(id, status, trx);

                await trx.commit();
                return res.status(200).json({ message: 'Transaction cancelled and stock restored.' });

            } catch (error) {
                await trx.rollback();
                console.error('Error cancelling transaction:', error);
                return res.status(500).json({ message: 'Error cancelling transaction' });
            }
        }

        // Untuk status lain (pending, completed)
        try {
            const affectedRows = await TransactionModel.updateStatus(id, status);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Transaction not found or no changes made' });
            }
            res.status(200).json({ message: 'Transaction status updated successfully' });
        } catch (error) {
            console.error('Error updating transaction status:', error);
            res.status(500).json({ message: 'Error updating transaction status' });
        }
    },

    /**
     * ⚠️ Menghapus transaksi tidak disarankan karena akan menghilangkan data historis.
     * Lebih baik menggunakan update status menjadi 'cancelled' atau 'archived'.
     * Jika tetap harus ada, pastikan stok dikembalikan.
     */
    deleteTransaction: async (req, res) => {
        const { id } = req.params;

        const trx = await db.transaction(); // Gunakan transaksi untuk memastikan semua operasi terkait berhasil
        try {
            // 1. Ambil item dari transaksi yang akan dihapus untuk mengembalikan stok
            const itemsToRestore = await TransactionModel.findItemsByTransactionId(id, trx);
            if (itemsToRestore.length === 0) {
                // Mungkin transaksi tidak ada atau tidak punya item, tetap coba hapus headernya
                const affectedRows = await TransactionModel.delete(id, trx);
                if (affectedRows === 0) {
                    await trx.rollback();
                    return res.status(404).json({ message: 'Transaction not found' });
                }
                await trx.commit();
                return res.status(200).json({ message: 'Transaction deleted successfully (no items to restore).' });
            }
            
            // 2. Kembalikan stok produk
            const stockRestorePromises = itemsToRestore.map(item =>
                ProductModel.increaseStock(item.product_id, item.quantity, trx)
            );
            await Promise.all(stockRestorePromises);

            // 3. Hapus transaksi (item dan header)
            const affectedRows = await TransactionModel.delete(id, trx); // Model delete harus menghapus item & header
            if (affectedRows === 0) {
                await trx.rollback(); // Seharusnya tidak terjadi jika itemsToRestore ditemukan
                return res.status(404).json({ message: 'Transaction not found during deletion' });
            }

            await trx.commit();
            res.status(200).json({ message: 'Transaction deleted and stock restored successfully' });

        } catch (error) {
            await trx.rollback();
            console.error('Error deleting transaction:', error);
            res.status(500).json({ message: 'Error deleting transaction' });
        }
    },
};

module.exports = TransactionController;