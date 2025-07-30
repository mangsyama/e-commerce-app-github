require('dotenv').config();
const express = require('express');
const app = express();

const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to the E-commerce API!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access API at http://localhost:${PORT}`);
});