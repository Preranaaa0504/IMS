import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import {
  Box, Typography, Button, TextField, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert
} from '@mui/material';
import { Check as CheckIcon, ArrowBack as BackIcon } from '@mui/icons-material';

function OrderConfirmation({ selectedItems, items, onBack }) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const orderedItems = items.filter(item => selectedItems.includes(item.id));
  const totalAmount = orderedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      setError("Please enter delivery address");
      return;
    }

    setLoading(true);
    try {
      await API.post("/orders/", {
        items: selectedItems,
        delivery_address: address,
        total_amount: totalAmount
      });
      navigate("/orders-success");
    } catch (err) {
      setError("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <Button
          startIcon={<BackIcon />}
          onClick={onBack}
          sx={styles.backButton}
        >
          Back to Inventory
        </Button>

        <Typography variant="h5" sx={styles.title}>
          Confirm Your Order
        </Typography>

        {error && (
          <Alert severity="error" sx={styles.alert}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} sx={styles.tableContainer}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderedItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>₹{item.price}</TableCell>
                  <TableCell>₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6" sx={styles.total}>
          Total Amount: ₹{totalAmount.toFixed(2)}
        </Typography>

        <TextField
          label="Delivery Address"
          multiline
          rows={4}
          fullWidth
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          sx={styles.addressField}
          required
        />

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<CheckIcon />}
          onClick={handlePlaceOrder}
          disabled={loading}
          sx={styles.submitButton}
        >
          Place Order
        </Button>
      </Paper>
    </Box>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px'
  },
  paper: {
    padding: '32px',
    maxWidth: '800px',
    width: '100%'
  },
  title: {
    marginBottom: '24px',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  tableContainer: {
    margin: '24px 0'
  },
  total: {
    textAlign: 'right',
    margin: '16px 0',
    fontWeight: 'bold'
  },
  addressField: {
    margin: '16px 0'
  },
  submitButton: {
    marginTop: '16px',
    padding: '12px 24px',
    float: 'right'
  },
  backButton: {
    marginBottom: '16px'
  },
  alert: {
    marginBottom: '16px'
  }
};

export default OrderConfirmation;