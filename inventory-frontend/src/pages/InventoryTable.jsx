import { useEffect, useState } from 'react';
import API from '../api/axios';

function InventoryTable() {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedItem, setEditedItem] = useState({});

  const fetchItems = async () => {
    try {
      const res = await API.get('/inventory/');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditedItem({ ...item });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedItem({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedItem({ ...editedItem, [name]: value });
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...editedItem,
        quantity: parseInt(editedItem.quantity),
        price: parseFloat(editedItem.price),
        threshold: parseInt(editedItem.threshold),
      };
      await API.put(`/inventory/${editingId}/`, payload);
      setEditingId(null);
      fetchItems();
    } catch (err) {
      alert('Update failed');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await API.delete(`/inventory/${id}/`);
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        alert('Failed to delete item');
        console.error(err);
      }
    }
  };

  const tableStyle = {
    width: '90%',
    margin: '20px auto',
    borderCollapse: 'collapse',
  };

  const thTdStyle = {
    border: '1px solid #ddd',
    padding: '10px',
    textAlign: 'center',
  };

  const btnStyle = {
    padding: '5px 10px',
    margin: '0 5px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Inventory</h2>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thTdStyle}>Name</th>
            <th style={thTdStyle}>SKU</th>
            <th style={thTdStyle}>Quantity</th>
            <th style={thTdStyle}>Price</th>
            <th style={thTdStyle}>Supplier</th>
            <th style={thTdStyle}>Ordered By</th>
            <th style={thTdStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              {editingId === item.id ? (
                <>
                  <td style={thTdStyle}><input name="name" value={editedItem.name} onChange={handleInputChange} /></td>
                  <td style={thTdStyle}><input name="sku" value={editedItem.sku} onChange={handleInputChange} /></td>
                  <td style={thTdStyle}><input name="quantity" value={editedItem.quantity} onChange={handleInputChange} /></td>
                  <td style={thTdStyle}><input name="price" value={editedItem.price} onChange={handleInputChange} /></td>
                  <td style={thTdStyle}><input name="supplier" value={editedItem.supplier} onChange={handleInputChange} /></td>
                  <td style={thTdStyle}>—</td> {/* Editing user not allowed */}
                  <td style={thTdStyle}>
                    <button style={{ ...btnStyle, backgroundColor: '#28a745', color: '#fff' }} onClick={handleSave}>Save</button>
                    <button style={{ ...btnStyle, backgroundColor: '#6c757d', color: '#fff' }} onClick={handleCancel}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td style={thTdStyle}>{item.name}</td>
                  <td style={thTdStyle}>{item.sku}</td>
                  <td style={thTdStyle}>{item.quantity}</td>
                  <td style={thTdStyle}>{item.price}</td>
                  <td style={thTdStyle}>{item.supplier}</td>
                  <td style={thTdStyle}>{item.user}</td> {/*  Show username */}
                  <td style={thTdStyle}>
                    <button style={{ ...btnStyle, backgroundColor: '#007BFF', color: '#fff' }} onClick={() => handleEditClick(item)}>Edit</button>
                    <button style={{ ...btnStyle, backgroundColor: '#DC3545', color: '#fff' }} onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;
