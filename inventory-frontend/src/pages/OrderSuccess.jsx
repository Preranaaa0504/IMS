import { Button, Typography, Box, Paper } from '@mui/material';
import { CheckCircle, ArrowBack, Receipt } from '@mui/icons-material';
import { useLocation, useNavigate } from "react-router-dom";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const order = state || {};

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <CheckCircle color="success" sx={styles.icon} />
        <Typography variant="h4" sx={styles.title}>
          Payment Successful!
        </Typography>
        <Typography variant="body1" sx={styles.message}>
          Your order #{order.id} has been confirmed.
        </Typography>
        
        <Box sx={styles.details}>
          <Typography variant="body1">
            <strong>Amount Paid:</strong> ₹{order.total_amount?.toFixed(2) || '0.00'}
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            <strong>Delivery Address:</strong> {order.delivery_address}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Receipt />}
          sx={{ ...styles.button, mr: 2 }}
          onClick={() => window.print()}
        >
          Print Receipt
        </Button>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/dashboard")}
          sx={styles.button}
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5'
  },
  paper: {
    padding: '32px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  icon: {
    fontSize: '60px',
    marginBottom: '16px',
    color: '#4caf50'
  },
  title: {
    marginBottom: '16px',
    fontWeight: 'bold',
    color: '#2e7d32'
  },
  message: {
    marginBottom: '24px',
    fontSize: '1.1rem'
  },
  details: {
    backgroundColor: '#f9f9f9',
    padding: '16px',
    borderRadius: '8px',
    margin: '24px 0',
    textAlign: 'left'
  },
  button: {
    marginTop: '16px',
    padding: '10px 24px'
  }
};
