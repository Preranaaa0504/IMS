import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, TextField, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Alert, LinearProgress,
  Stepper, Step, StepLabel
} from '@mui/material';
import { Payment as PaymentIcon } from '@mui/icons-material';
import API from "../api/axios";

const steps = ['Delivery', 'Billing', 'Confirmation'];

export default function OrderPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    phone: ""
  });
  const [billingInfo, setBillingInfo] = useState({
    sameAsDelivery: true,
    name: "",
    address: "",
    taxId: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const orderedItems = state?.items || [];
  const totalAmount = orderedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleNext = () => {
    if (activeStep === 0) {
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode) {
        setError("Please fill all delivery address fields");
        return;
      }
    }
    setActiveStep(activeStep + 1);
    setError("");
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleBillingSameAsDelivery = (e) => {
    const isSame = e.target.checked;
    setBillingInfo({
      ...billingInfo,
      sameAsDelivery: isSame,
      address: isSame ? 
        `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}` 
        : ""
    });
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await API.post("/orders/", {
        items: orderedItems.map(item => ({
          id: item.id,
          quantity: item.quantity
        })),
        delivery_address: `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}`,
        billing_address: billingInfo.sameAsDelivery ? 
          `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zipCode}` :
          billingInfo.address,
        total_amount: totalAmount,
        billing_name: billingInfo.name,
        tax_id: billingInfo.taxId
      });
      navigate("/order-success", { state: res.data });
    } catch (err) {
      setError("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {activeStep === 0 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Delivery Information
            </Typography>
            <Box sx={styles.form}>
              <TextField
                label="Street Address"
                fullWidth
                value={deliveryAddress.street}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                sx={styles.inputField}
                required
              />
              <Box sx={styles.row}>
                <TextField
                  label="City"
                  value={deliveryAddress.city}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                  sx={{...styles.inputField, flex: 2}}
                  required
                />
                <TextField
                  label="State"
                  value={deliveryAddress.state}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, state: e.target.value})}
                  sx={{...styles.inputField, flex: 1}}
                  required
                />
                <TextField
                  label="ZIP Code"
                  value={deliveryAddress.zipCode}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, zipCode: e.target.value})}
                  sx={{...styles.inputField, flex: 1}}
                  required
                />
              </Box>
              <TextField
                label="Phone Number"
                fullWidth
                value={deliveryAddress.phone}
                onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                sx={styles.inputField}
              />
              <Box sx={styles.buttonGroup}>
                <Button variant="outlined" onClick={() => navigate(-1)} sx={styles.button}>Cancel</Button>
                <Button variant="contained" onClick={handleNext} sx={styles.button}>Continue to Billing</Button>
              </Box>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Billing Information
            </Typography>
            <Box sx={styles.form}>
              <Box sx={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="sameAsDelivery"
                  checked={billingInfo.sameAsDelivery}
                  onChange={handleBillingSameAsDelivery}
                />
                <label htmlFor="sameAsDelivery">Same as delivery address</label>
              </Box>

              {!billingInfo.sameAsDelivery && (
                <>
                  <TextField
                    label="Billing Name"
                    fullWidth
                    value={billingInfo.name}
                    onChange={(e) => setBillingInfo({...billingInfo, name: e.target.value})}
                    sx={styles.inputField}
                    required
                  />
                  <TextField
                    label="Billing Address"
                    multiline
                    rows={3}
                    fullWidth
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                    sx={styles.inputField}
                    required
                  />
                </>
              )}

              <TextField
                label="Tax ID (GSTIN)"
                fullWidth
                value={billingInfo.taxId}
                onChange={(e) => setBillingInfo({...billingInfo, taxId: e.target.value})}
                sx={styles.inputField}
              />

              <Box sx={styles.buttonGroup}>
                <Button variant="outlined" onClick={handleBack} sx={styles.button}>Back</Button>
                <Button variant="contained" onClick={handleNext} sx={styles.button}>Review Order</Button>
              </Box>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Order Confirmation
            </Typography>
            <Box sx={styles.orderSummary}>
              <Typography variant="h6" sx={{ mb: 2 }}>Order Summary</Typography>
              <TableContainer component={Paper} sx={styles.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Qty</TableCell>
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
              <Box sx={styles.summarySection}>
                <Typography variant="h6" sx={styles.total}>
                  Total Amount: ₹{totalAmount.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <Box sx={styles.addressSection}>
              <Typography variant="h6" sx={{ mb: 1 }}>Delivery Address:</Typography>
              <Typography>
                {deliveryAddress.street}, {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.zipCode}
              </Typography>
              {deliveryAddress.phone && <Typography>Phone: {deliveryAddress.phone}</Typography>}
            </Box>

            <Box sx={styles.addressSection}>
              <Typography variant="h6" sx={{ mb: 1 }}>Billing Address:</Typography>
              {billingInfo.sameAsDelivery ? (
                <Typography>Same as delivery address</Typography>
              ) : (
                <>
                  <Typography>{billingInfo.name}</Typography>
                  <Typography>{billingInfo.address}</Typography>
                </>
              )}
              {billingInfo.taxId && <Typography>Tax ID: {billingInfo.taxId}</Typography>}
            </Box>

            <Box sx={styles.buttonGroup}>
              <Button variant="outlined" onClick={handleBack} sx={styles.button}>Back</Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PaymentIcon />}
                onClick={handlePlaceOrder}
                disabled={loading}
                sx={styles.button}
              >
                Confirm & Pay
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  paper: {
    padding: '32px',
    maxWidth: '800px',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '8px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputField: {
    marginBottom: '16px'
  },
  row: {
    display: 'flex',
    gap: '16px'
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px'
  },
  button: {
    padding: '10px 24px',
    minWidth: '150px'
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  orderSummary: {
    marginBottom: '24px'
  },
  tableContainer: {
    margin: '16px 0'
  },
  summarySection: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px'
  },
  total: {
    fontWeight: 'bold'
  },
  addressSection: {
    margin: '16px 0',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  }
};
