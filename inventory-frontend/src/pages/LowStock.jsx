import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios'; // Axios instance with token

function LowStock() {
  const [lowStockItems, setLowStockItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const res = await API.get('/low-stock/');
        setLowStockItems(res.data);
      } catch (err) {
        console.error('Error fetching low stock items:', err);
        navigate('/login');
      }
    };

    fetchLowStock();
  }, [navigate]);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '30px', color: '#dc3545' }}>LOW STOCK ITEMS</h1>

      {lowStockItems.length === 0 ? (
        <p style={{ fontSize: '18px' }}>All stock levels are sufficient ✅</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ background: '#007BFF', color: 'white' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>SKU</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Threshold</th>
              <th style={thStyle}>Supplier</th>
              <th style={thStyle}>Expiration</th>
              <th style={thStyle}>Added By</th>
            </tr>
          </thead>
          <tbody>
            {lowStockItems.map(item => (
              <tr key={item.id}>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.sku}</td>
                <td style={tdStyle}>{item.quantity}</td>
                <td style={tdStyle}>{item.threshold}</td>
                <td style={tdStyle}>{item.supplier}</td>
                <td style={tdStyle}>{item.expiration_date}</td>
                <td style={tdStyle}>{item.user || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const thStyle = {
  padding: '12px',
  border: '1px solid #ccc',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  fontSize: '14px',
};

const tdStyle = {
  padding: '10px',
  border: '1px solid #eee',
  textAlign: 'center',
  fontSize: '15px',
};

export default LowStock;
