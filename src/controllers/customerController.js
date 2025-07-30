const CustomerModel = require('../models/customerModel');

const CustomerController = {
    // Membuat customer baru
    createCustomer: async (req, res) => {
        const { userId, name, email, phone, address } = req.body;

        if (!userId || !name || !email) {
            return res.status(400).json({ message: 'User ID, name, and email are required' });
        }

        try {
            const customerId = await CustomerModel.create(userId, name, email, phone, address);
            res.status(201).json({ message: 'Customer created successfully', customerId });
        } catch (error) {
            console.error('Error creating customer:', error);
            res.status(500).json({ message: 'Error creating customer' });
        }
    },

    // Mendapatkan customer berdasarkan ID
    getCustomerById: async (req, res) => {
        const { id } = req.params;

        try {
            const customer = await CustomerModel.findById(id);
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            res.status(200).json(customer);
        } catch (error) {
            console.error('Error getting customer by ID:', error);
            res.status(500).json({ message: 'Error getting customer' });
        }
    },

    // Mendapatkan customer berdasarkan User ID
    getCustomerByUserId: async (req, res) => {
        const { userId } = req.params;

        try {
            const customer = await CustomerModel.findByUserId(userId);
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found for this user ID' });
            }
            res.status(200).json(customer);
        } catch (error) {
            console.error('Error getting customer by user ID:', error);
            res.status(500).json({ message: 'Error getting customer' });
        }
    },

    // Update customer
    updateCustomer: async (req, res) => {
        const { id } = req.params;
        const { name, email, phone, address } = req.body;

        try {
            const affectedRows = await CustomerModel.update(id, name, email, phone, address);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Customer not found or no changes made' });
            }
            res.status(200).json({ message: 'Customer updated successfully' });
        } catch (error) {
            console.error('Error updating customer:', error);
            res.status(500).json({ message: 'Error updating customer' });
        }
    },

    // Hapus customer
    deleteCustomer: async (req, res) => {
        const { id } = req.params;

        try {
            const affectedRows = await CustomerModel.delete(id);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            res.status(200).json({ message: 'Customer deleted successfully' });
        } catch (error) {
            console.error('Error deleting customer:', error);
            res.status(500).json({ message: 'Error deleting customer' });
        }
    },

    // Mendapatkan semua customer
    getAllCustomers: async (req, res) => {
        try {
            const customers = await CustomerModel.getAll();
            res.status(200).json(customers);
        } catch (error) {
            console.error('Error getting all customers:', error);
            res.status(500).json({ message: 'Error getting all customers' });
        }
    }
};

module.exports = CustomerController;
