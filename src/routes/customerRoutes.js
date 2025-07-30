const express = require('express'); 
const router = express.Router(); 
const CustomerController = require('../controllers/customerController'); 

router.post('/', CustomerController.createCustomer); 
router.get('/:id', CustomerController.getCustomerById); 
router.get('/user/:userId', CustomerController.getCustomerByUserId);  

router.put('/:id', CustomerController.updateCustomer); 
router.delete('/:id', CustomerController.deleteCustomer); 
router.get('/', CustomerController.getAllCustomers); 

module.exports = router;