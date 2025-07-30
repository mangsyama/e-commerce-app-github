const UserModel = require('../models/userModel');
// Untuk password hashing, Anda bisa menggunakan bcrypt (npm install bcrypt)
// Contoh sederhana tanpa hashing untuk demo

const UserController = {
    registerUser: async (req, res) => {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        try {
            const userId = await UserModel.create(username, password, role || 'customer');
            res.status(201).json({ message: 'User registered successfully', userId });
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    },
    loginUser: async (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        try {
            const user = await UserModel.findByUsername(username);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            if (user.password !== password) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } });
        } catch (error) {
            console.error('Error logging in user:', error);
            res.status(500).json({ message: 'Error logging in user' });
        }
    },
    getUserById: async (req, res) => {
        const { id } = req.params;
        try {
            const user = await UserModel.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json(user);
        } catch (error) {
            console.error('Error getting user by ID:', error);
            res.status(500).json({ message: 'Error getting user' });
        }
    },
    updateUser: async (req, res) => {
        const { id } = req.params;
        const { username, password, role } = req.body;
        try {
            const affectedRows = await UserModel.update(id, username, password, role);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'User not found or no changes made' });
            }
            res.status(200).json({ message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ message: 'Error updating user' });
        }
    },
    deleteUser: async (req, res) => {
        const { id } = req.params;
        try {
            const affectedRows = await UserModel.delete(id);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Error deleting user' });
        }
    },
    getAllUsers: async (req, res) => {
        try {
            const users = await UserModel.getAll();
            res.status(200).json(users);
        } catch (error) {
            console.error('Error getting all users:', error);
            res.status(500).json({ message: 'Error getting all users' });
        }
    }
};

module.exports = UserController;