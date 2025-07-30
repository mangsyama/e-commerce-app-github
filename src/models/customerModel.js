const pool = require('../config/db');


const CustomerModel = {
      findById: async (id) => {
       const [rows] = await pool.execute(
           'SELECT * FROM customers WHERE id = ?',
           [id]
       );
       return rows[0];
   },
};


module.exports = CustomerModel;