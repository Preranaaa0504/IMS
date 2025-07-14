import { 
  Button, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip 
} from '@mui/material';
import { CheckCircle, ArrowBack, Receipt } from '@mui/icons-material';
import { useLocation, useNavigate } from "react-router-dom";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const order = state?.order || {};

  const formatAmount = (amount) => {
    const num = typeof amount === 'number' ? amount : parseFloat(amount);
    return !isNaN(num) ? num.toFixed(2) : '0.00';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'DELIVERED': return 'success';
      case 'SHIPPED': return 'primary';
      case 'PROCESSING': return 'info';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <CheckCircle color="success" sx={styles.icon} />
        <Typography variant="h4" sx={styles.title}>
          Order Confirmed!
        </Typography>
        <Typography variant="body1" sx={styles.message}>
          Thank you for your purchase. Your order #{order.id || 'N/A'} has been received.
        </Typography>
        
        <Box sx={styles.statusChip}>
          <Chip 
            label={order.status || 'PENDING'} 
            color={getStatusColor(order.status)}
            variant="outlined"
          />
        </Box>
        
        <Box sx={styles.section}>
          <Typography variant="h6" sx={styles.sectionTitle}>Order Summary</Typography>
          
          <Box sx={styles.detailRow}>
            <Typography variant="body1" sx={styles.detailLabel}>Order Number:</Typography>
            <Typography variant="body1">{order.id || 'N/A'}</Typography>
          </Box>
          
          <Box sx={styles.detailRow}>
            <Typography variant="body1" sx={styles.detailLabel}>Order Date:</Typography>
            <Typography variant="body1">{formatDate(order.created_at)}</Typography>
          </Box>
          
          <Box sx={styles.detailRow}>
            <Typography variant="body1" sx={styles.detailLabel}>Subtotal:</Typography>
            <Typography variant="body1">₹{formatAmount(order.subtotal)}</Typography>
          </Box>
          
          {order.discounts?.length > 0 && (
            <>
              {order.discounts.map((discount, index) => (
                <Box key={index} sx={styles.detailRow}>
                  <Typography variant="body1" sx={styles.detailLabel}>
                    Discount {index + 1} ({discount.type === 'percentage' ? 'Percentage' : 'Fixed'}):
                  </Typography>
                  <Typography variant="body1" color="error.main">
                    -₹{formatAmount(
                      discount.type === 'percentage' 
                        ? order.subtotal * discount.value / 100 
                        : discount.value
                    )}
                    {discount.description && ` (${discount.description})`}
                  </Typography>
                </Box>
              ))}
            </>
          )}
          
          <Box sx={styles.detailRow}>
            <Typography variant="body1" sx={styles.detailLabel}>Total Amount:</Typography>
            <Typography variant="body1" sx={styles.amount}>₹{formatAmount(order.total_amount)}</Typography>
          </Box>
          
          <Box sx={styles.detailRow}>
            <Typography variant="body1" sx={styles.detailLabel}>Payment Status:</Typography>
            <Typography variant="body1" color="success.main">Paid</Typography>
          </Box>
        </Box>

        {order.delivery_address && (
          <Box sx={styles.section}>
            <Typography variant="h6" sx={styles.sectionTitle}>Delivery Information</Typography>
            <Typography variant="body1">{order.delivery_address}</Typography>
          </Box>
        )}

        {order.items?.length > 0 && (
          <Box sx={styles.section}>
            <Typography variant="h6" sx={styles.sectionTitle}>Ordered Items</Typography>
            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">₹{formatAmount(item.price)}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">₹{formatAmount(item.price * item.quantity)}</TableCell>
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell colSpan={3} align="right"><strong>Subtotal</strong></TableCell>
                    <TableCell align="right"><strong>₹{formatAmount(order.subtotal)}</strong></TableCell>
                  </TableRow>
                  
                  {order.discounts?.length > 0 && (
                    <>
                      {order.discounts.map((discount, index) => (
                        <TableRow key={`discount-${index}`}>
                          <TableCell colSpan={3} align="right">
                            <strong>
                              Discount {index + 1} ({discount.type === 'percentage' ? `${discount.value}%` : 'Fixed'})
                              {discount.description && ` (${discount.description})`}
                            </strong>
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>
                            <strong>
                              -₹{formatAmount(
                                discount.type === 'percentage' 
                                  ? order.subtotal * discount.value / 100 
                                  : discount.value
                              )}
                            </strong>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                  
                  <TableRow>
                    <TableCell colSpan={3} align="right"><strong>Total</strong></TableCell>
                    <TableCell align="right"><strong>₹{formatAmount(order.total_amount)}</strong></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        <Box sx={styles.buttonContainer}>
          <Button
            variant="contained"
            startIcon={<Receipt />}
            onClick={() => window.print()}
            sx={styles.button}
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
        </Box>
      </Paper>
    </Box>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    p: 2
  },
  paper: {
    padding: 4,
    maxWidth: '800px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 2
  },
  icon: {
    fontSize: '60px',
    mb: 2,
    color: '#4caf50'
  },
  title: {
    mb: 2,
    fontWeight: 'bold',
    color: '#2e7d32'
  },
  message: {
    mb: 3,
    fontSize: '1.1rem'
  },
  statusChip: {
    mb: 3,
    display: 'flex',
    justifyContent: 'center'
  },
  section: {
    backgroundColor: '#f9f9f9',
    p: 3,
    borderRadius: 1,
    mb: 3
  },
  sectionTitle: {
    mb: 2,
    fontWeight: 'bold'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    mb: 1
  },
  detailLabel: {
    fontWeight: 'bold'
  },
  amount: {
    fontWeight: 'bold',
    color: '#2e7d32'
  },
  tableContainer: {
    mt: 2,
    boxShadow: 'none',
    border: '1px solid #e0e0e0'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 2,
    mt: 3
  },
  button: {
    px: 4,
    py: 1.5
  }
};