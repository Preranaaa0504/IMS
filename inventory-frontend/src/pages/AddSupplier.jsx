import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../api/axios';
import { Box, Typography, TextField, Button, Alert, Snackbar } from '@mui/material';

// Regex for validating Indian GST number format
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function AddSupplier() {
  const { id } = useParams(); // Get supplier ID from URL params (for edit mode)
  const [form, setForm] = useState({
    name: '',
    gst_number: '',
    email: '',
    phone: '',
    address: ''
  }); // Form state for supplier fields

  const [errors, setErrors] = useState({});      // Field-level and general errors
  const [loading, setLoading] = useState(false); // Loading state for submit button
  const [success, setSuccess] = useState(false); // Success message state
  const [gstError, setGstError] = useState(false); // GST format error flag
  const [authError, setAuthError] = useState(false); // Authentication error flag
  const navigate = useNavigate(); // Navigation hook

  // Fetch supplier data if in edit mode (id exists)
  useEffect(() => {
    if (id) {
      const fetchSupplier = async () => {
        try {
          const response = await API.get(`/suppliers/${id}/`);
          setForm(response.data); // Populate form with fetched data
        } catch (err) {
          if (err.response?.status === 401) {
            setAuthError(true); // Unauthorized: trigger auth error
          } else {
            setErrors({general: 'Failed to load supplier data'});
          }
        }
      };
      fetchSupplier();
    }
  }, [id]);

  // Handle input changes for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ['gst_number', 'name'].includes(name) ? value.toUpperCase() : value // Uppercase for GST and name
    }));

    // Validate GST in real-time as user types
    if (name === 'gst_number' && value) {
      setGstError(!GST_REGEX.test(value));
    }
  };

  // Handle form submission for add or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    // Client-side validation for required fields
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.address) newErrors.address = 'Address is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      // Prepare payload, converting empty optional fields to null
      const payload = {
        name: form.name,
        gst_number: form.gst_number || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address
      };

      if (id) {
        // Update existing supplier
        await API.put(`/suppliers/${id}/`, payload);
        setSuccess('Supplier updated successfully!');
      } else {
        // Create new supplier
        await API.post('/suppliers/', payload);
        setSuccess('Supplier added successfully!');
        // Reset form fields after adding
        setForm({
          name: '',
          gst_number: '',
          email: '',
          phone: '',
          address: ''
        });
      }
      // Redirect to home after a short delay
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError(true); // Unauthorized: show login prompt
      } else if (err.response?.data) {
        setErrors(err.response.data); // Show API validation errors
      } else {
        setErrors({general: err.message || 'An error occurred'});
      }
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Handle closing of authentication error snackbar
  const handleCloseAuthError = () => {
    setAuthError(false);
    // Redirect to login or refresh token
    navigate('/login');
  };

  return (
    <Box sx={styles.container}>
      <Typography variant="h4" sx={styles.title}>
        {id ? 'Edit Supplier' : 'Add New Supplier'} {/* Show appropriate title */}
      </Typography>
      
      {/* Show general error or success messages */}
      {errors.general && <Alert severity="error" sx={styles.alert}>{errors.general}</Alert>}
      {success && <Alert severity="success" sx={styles.alert}>{success}</Alert>}
      
      <Box component="form" onSubmit={handleSubmit} sx={styles.form}>
        {/* Render text fields for each form field */}
        {['name', 'gst_number', 'email', 'phone'].map(field => (
          <TextField
            key={field}
            label={field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} // Format label
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
        
        {/* Address field (multiline) */}
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
        
        {/* Submit button */}
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

      {/* Snackbar for session/authentication errors */}
      <Snackbar
        open={authError}
        autoHideDuration={6000}
        onClose={handleCloseAuthError}
        message="Session expired. Please log in again."
      />
    </Box>
  );
}

// Inline styles for the component using MUI's sx prop
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
