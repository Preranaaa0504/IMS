import { useState } from 'react';
import API from '../api/axios'; //  Custom Axios instance with token support

function AddItem() {
  //  Initial form state
  const initialForm = {
    name: '',
    sku: '',
    quantity: '',
    price: '',
    supplier: '',
    expiration_date: '',
    threshold: ''
  };

  //  React state to manage form data
  const [form, setForm] = useState(initialForm);

  //  Handles input changes and updates state
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //  Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form reload

    try {
      //  Prepare payload with parsed numbers
      const payload = {
        ...form,
        quantity: parseInt(form.quantity),
        price: parseFloat(form.price),
        threshold: parseInt(form.threshold)
      };

      //  POST to the API to create a new inventory item
      await API.post('/inventory/', payload);

      alert('Item added successfully!');
      setForm(initialForm); // ✅ Reset the form after success
    } catch (err) {
      const errorData = err?.response?.data;

      //  Show SKU-specific validation error
      if (errorData?.detail && errorData.detail.includes('SKU')) {
        alert(errorData.detail);
      } else {
        alert('Failed to add item. Please check your input.');
      }

      console.error('Add item error:', errorData);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '20px auto' }}>
      {/*  Dynamically render form fields based on keys */}
      {Object.keys(form).map((key) => (
        <div key={key} style={{ marginBottom: '10px' }}>
          <input
            name={key}
            value={form[key]}
            onChange={handleChange}
            placeholder={key.replace('_', ' ').toUpperCase()} // Format placeholder text
            required
            style={{
              padding: '10px',
              width: '100%',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}
          />
        </div>
      ))}

      {/*  Submit button */}
      <button
        type="submit"
        style={{
          padding: '8px 16px',
          width: 'auto',
          backgroundColor: '#28a745',
          color: '#fff',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          display: 'block',
          margin: '20px auto 0 auto' // Centered button with spacing
        }}
      >
        Add Item
      </button>
    </form>
  );
}

export default AddItem;
