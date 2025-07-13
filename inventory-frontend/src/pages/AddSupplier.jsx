import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import { Box, Typography, TextField, Button, Alert, Snackbar } from '@mui/material';

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function AddSupplier() {
  const { id } = useParams();
  const [form, setForm] = useState({
    name: '',
    gst_number: '',
    email: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [gstError, setGstError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      const fetchSupplier = async () => {
        try {
          const response = await API.get(`/suppliers/${id}/`);
          setForm(response.data);
        } catch (err) {
          if (err.response?.status === 401) {
            setAuthError(true);
          } else {
            setErrors({general: 'Failed to load supplier data'});
          }
        }
      };
      fetchSupplier();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ['gst_number', 'name'].includes(name) ? value.toUpperCase() : value
    }));

    // Validate GST in real-time
    if (name === 'gst_number' && value) {
      setGstError(!GST_REGEX.test(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Validate required fields
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.address) newErrors.address = 'Address is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        gst_number: form.gst_number || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address
      };

      if (id) {
        await API.put(`/suppliers/${id}/`, payload);
        setSuccess('Supplier updated successfully!');
      } else {
        await API.post('/suppliers/', payload);
        setSuccess('Supplier added successfully!');
        setForm({
          name: '',
          gst_number: '',
          email: '',
          phone: '',
          address: ''
        });
      }
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError(true);
      } else if (err.response?.data) {
        setErrors(err.response.data);
      } else {
        setErrors({general: err.message || 'An error occurred'});
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAuthError = () => {
    setAuthError(false);
    // Redirect to login or refresh token
    navigate('/login');
  };

  return (
    <Box sx={styles.container}>
      <Typography variant="h4" sx={styles.title}>
        {id ? 'Edit Supplier' : 'Add New Supplier'}
      </Typography>
      
      {errors.general && <Alert severity="error" sx={styles.alert}>{errors.general}</Alert>}
      {success && <Alert severity="success" sx={styles.alert}>{success}</Alert>}
      
      <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
        {['name', 'gst_number', 'email', 'phone'].map(field => (
          <TextField
            key={field}
            label={field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            name={field}
            value={form[field]}
            onChange={handleChange}
            required={field === 'name'}
            fullWidth
            margin="normal"
            variant="outlined"
            error={!!errors[field] || (field === 'gst_number' && gstError)}
            helperText={
              errors[field] || 
              (field === 'gst_number' && gstError && 'Invalid GST format (22AAAAA0000A1Z5)')
            }
            type={field === 'email' ? 'email' : 'text'}
            inputProps={{
              style: { textTransform: ['gst_number', 'name'].includes(field) ? 'uppercase' : 'none' }
            }}
          />
        ))}
        
        <TextField
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          required
          fullWidth
          margin="normal"
          variant="outlined"
          multiline
          rows={4}
          error={!!errors.address}
          helperText={errors.address}
        />
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={styles.button}
          disabled={loading || gstError}
        >
          {loading ? 'Processing...' : (id ? 'Update Supplier' : 'Add Supplier')}
        </Button>
      </Box>

      <Snackbar
        open={authError}
        autoHideDuration={6000}
        onClose={handleCloseAuthError}
        message="Session expired. Please log in again."
      />
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
  button: {
    marginTop: '24px',
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '8px'
  }
};

export default AddSupplier;