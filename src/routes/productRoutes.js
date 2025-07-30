const express = require('express'); 
const router = express.Router(); 
const ProductController = require('../controllers/productController'); 
 
router.post('/', ProductController.createProduct); 
router.get('/:id', ProductController.getProductById); 
router.put('/:id', ProductController.updateProduct); 
router.delete('/:id', ProductController.deleteProduct); 
router.get('/', ProductController.getAllProducts); 
 
module.exports = router; 