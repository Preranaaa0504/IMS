import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Box, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel } from '@mui/material';

function AddItemAdmin() {
  const [form, setForm] = useState({
    name: '', sku: '', quantity: '', price: '',
    supplier_id: '', user_id: '', expiration_date: '', threshold: ''
  });

  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, usersRes] = await Promise.all([
          API.get('/suppliers/'),
          API.get('/user-profiles/')
        ]);
        setSuppliers(suppliersRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        quantity: parseInt(form.quantity),
        price: parseFloat(form.price),
        threshold: parseInt(form.threshold),
      };
      await API.post('/inventory/', payload);
      setSuccess(true);
      setForm({
        name: '', sku: '', quantity: '', price: '',
        supplier_id: '', user_id: '', expiration_date: '', threshold: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={styles.container}>
      <Typography variant="h4" sx={styles.title}>
        Admin Product Management
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
        {['name', 'sku'].map(field => (
          <TextField
            key={field}
            label={field.charAt(0).toUpperCase() + field.slice(1)}
            name={field}
            value={form[field]}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
            variant="outlined"
          />
        ))}
        
        <Box sx={styles.row}>
          <TextField
            label="Quantity"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            required
            sx={styles.numberField}
            margin="normal"
            variant="outlined"
          />
          
          <TextField
            label="Price"
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            required
            sx={styles.numberField}
            margin="normal"
            variant="outlined"
            InputProps={{
              startAdornment: '₹'
            }}
          />
          
          <TextField
            label="Threshold"
            name="threshold"
            type="number"
            value={form.threshold}
            onChange={handleChange}
            required
            sx={styles.numberField}
            margin="normal"
            variant="outlined"
          />
        </Box>
        
        <TextField
          label="Expiration Date"
          name="expiration_date"
          type="date"
          value={form.expiration_date}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          fullWidth
          margin="normal"
          variant="outlined"
        />
        
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Supplier</InputLabel>
          <Select
            name="supplier_id"
            value={form.supplier_id}
            onChange={handleChange}
            label="Supplier"
          >
            <MenuItem value="">
              <em>Select Supplier</em>
            </MenuItem>
            {suppliers.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Assign to User</InputLabel>
          <Select
            name="user_id"
            value={form.user_id}
            onChange={handleChange}
            label="Assign to User"
          >
            <MenuItem value="">
              <em>Select User</em>
            </MenuItem>
            {users.map(u => (
              <MenuItem key={u.user.id} value={u.user.id}>
                {u.user.username} ({u.mobile || 'No contact'})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={styles.button}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Add Pharmaceutical Product'}
        </Button>
        
        {success && (
          <Typography color="success.main" sx={styles.successMessage}>
            Product added successfully!
          </Typography>
        )}
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '30px',
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#2c3e50',
    fontWeight: 'bold'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  row: {
    display: 'flex',
    gap: '16px',
    '& > *': {
      flex: 1
    }
  },
  numberField: {
    minWidth: '120px'
  },
  button: {
    marginTop: '24px',
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '8px'
  },
  successMessage: {
    textAlign: 'center',
    marginTop: '16px',
    fontWeight: 'bold'
  }
};

export default AddItemAdmin;