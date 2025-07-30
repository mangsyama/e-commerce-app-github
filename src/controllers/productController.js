const ProductModel = require('../models/productModel');

const ProductController = {
    // Membuat produk baru
    createProduct: async (req, res) => {
        const { name, description, price, stock, imageUrl } = req.body;

        if (!name || !price || !stock) {
            return res.status(400).json({ message: 'Name, price, and stock are required' });
        }

        try {
            const productId = await ProductModel.create(name, description, price, stock, imageUrl);
            res.status(201).json({ message: 'Product created successfully', productId });
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ message: 'Error creating product' });
        }
    },

    // Mendapatkan produk berdasarkan ID
    getProductById: async (req, res) => {
        const { id } = req.params;

        try {
            const product = await ProductModel.findById(id);
            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.status(200).json(product);
        } catch (error) {
            console.error('Error getting product by ID:', error);
            res.status(500).json({ message: 'Error getting product' });
        }
    },

    // Update produk
    updateProduct: async (req, res) => {
        const { id } = req.params;
        const { name, description, price, stock, imageUrl } = req.body;

        try {
            const affectedRows = await ProductModel.update(id, name, description, price, stock, imageUrl);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Product not found or no changes made' });
            }
            res.status(200).json({ message: 'Product updated successfully' });
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ message: 'Error updating product' });
        }
    },

    // Hapus produk
    deleteProduct: async (req, res) => {
        const { id } = req.params;

        try {
            const affectedRows = await ProductModel.delete(id);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Product not found' });
            }
            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ message: 'Error deleting product' });
        }
    },

    // Mendapatkan semua produk
    getAllProducts: async (req, res) => {
        try {
            const products = await ProductModel.getAll();
            res.status(200).json(products);
        } catch (error) {
            console.error('Error getting all products:', error);
            res.status(500).json({ message: 'Error getting all products' });
        }
    }
};

module.exports = ProductController;
