import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { Box, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel, Alert } from '@mui/material';

function AddItemUser() {
  const [form, setForm] = useState({
    name: '', sku: '', quantity: '', price: '',
    supplier_id: '', expiration_date: '', threshold: ''
  });

  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await API.get('/suppliers/');
        setSuppliers(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError('Error fetching pharmaceutical suppliers');
        }
      }
    };
    fetchSuppliers();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        quantity: parseInt(form.quantity, 10),
        price: parseFloat(form.price),
        threshold: parseInt(form.threshold, 10),
        expiration_date: form.expiration_date || null,
        supplier_id: parseInt(form.supplier_id, 10)
      };

      await API.post('/inventory/', payload);
      setSuccess(true);
      setForm({
        name: '', sku: '', quantity: '', price: '',
        supplier_id: '', expiration_date: '', threshold: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(err.response?.data?.detail || 'Failed to add pharmaceutical item');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={styles.container}>
      <Typography variant="h4" sx={styles.title}>
        Add Pharmaceutical Item
      </Typography>
      
      {error && (
        <Alert severity="error" sx={styles.alert}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={styles.alert}>
          Pharmaceutical item added successfully!
        </Alert>
      )}
      
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
          <InputLabel>Pharmaceutical Supplier</InputLabel>
          <Select
            name="supplier_id"
            value={form.supplier_id}
            onChange={handleChange}
            label="Pharmaceutical Supplier"
          >
            {suppliers.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
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
          {loading ? 'Processing...' : 'Add Pharmaceutical Item'}
        </Button>
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
  alert: {
    marginBottom: '20px'
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
  }
};

export default AddItemUser;