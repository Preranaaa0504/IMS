import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { 
  Box, Typography, Button, TextField, Select, MenuItem, InputLabel, FormControl, 
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  IconButton, Tooltip, Alert, LinearProgress, Card, CardContent, Tabs, Tab,
  Checkbox
} from '@mui/material';
import { 
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, 
  FileDownload as FileDownloadIcon, Logout as LogoutIcon,
  LocalPharmacy as PharmacyIcon, Warning as WarningIcon,
  People as PeopleIcon, Inventory as InventoryIcon
} from '@mui/icons-material';

function Dashboard() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: "", sku: "", quantity: "", price: "",
    supplier_id: "", expiration_date: "", threshold: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const navigate = useNavigate();

  const tabLabels = ["Dashboard", "Inventory", "Add Product", "Suppliers", "Low Stock"];

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, inventoryRes, supplierRes] = await Promise.all([
          API.get("/me/"),
          API.get("/inventory/"),
          API.get("/suppliers/")
        ]);
        
        setIsAdmin(userRes.data.is_staff);
        setItems(inventoryRes.data);
        setFilteredItems(inventoryRes.data);
        setSuppliers(supplierRes.data);
      } catch (err) {
        setError("Failed to load data. Please try again.");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Filter inventory items
  useEffect(() => {
    let filtered = [...items];
    if (searchProduct) {
      filtered = filtered.filter((i) =>
        i.name.toLowerCase().includes(searchProduct.toLowerCase())
      );
    }
    if (selectedSupplier) {
      filtered = filtered.filter((i) => i.supplier_name === selectedSupplier);
    }
    if (filterDate) {
      filtered = filtered.filter((i) => i.created_at?.slice(0, 10) === filterDate);
    }
    setFilteredItems(filtered);
  }, [searchProduct, selectedSupplier, filterDate, items]);

  // Low stock items
  const lowStockItems = items.filter((item) => item.quantity < item.threshold);

  // Order functionality
  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  const handleProceedToOrder = () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one item to order");
      return;
    }
    const selectedProducts = items.filter(item => selectedItems.includes(item.id));
    navigate("/order", { state: { items: selectedProducts } });
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        threshold: parseInt(formData.threshold),
      };
      
      if (editingId) {
        await API.put(`/inventory/${editingId}/`, payload);
      } else {
        await API.post("/inventory/", payload);
      }
      
      const res = await API.get("/inventory/");
      setItems(res.data);
      setFilteredItems(res.data);
      setFormData({
        name: "", sku: "", quantity: "", price: "",
        supplier_id: "", expiration_date: "", threshold: "",
      });
      setEditingId(null);
      setActiveTab(1);
    } catch (err) {
      setError("Failed to save product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      supplier_id: item.supplier?.id || "",
      expiration_date: item.expiration_date || "",
      threshold: item.threshold,
    });
    setEditingId(item.id);
    setActiveTab(2);
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await API.delete(`/inventory/${id}/`);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError("Failed to delete item.");
    }
  };

  // Handle download report
  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/inventory-report/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "pharmacy_inventory.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Failed to download report.");
    }
  };

  // Handle supplier edit
  const handleEditSupplier = (supplier) => {
    navigate(`/edit-supplier/${supplier.id}`);
  };

  // Handle supplier delete
  const handleDeleteSupplier = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await API.delete(`/suppliers/${id}/`);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError("Failed to delete supplier.");
    }
  };

  // Calculate stats
  const totalStock = filteredItems.length;
  const totalQuantity = filteredItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = filteredItems.reduce((sum, i) => sum + (i.quantity * i.price), 0);
  const lowStockCount = lowStockItems.length;

  return (
    <Box sx={styles.container}>
      {/* App Bar */}
      <Paper elevation={3} sx={styles.appBar}>
        <Box sx={styles.appBarContent}>
          <Box sx={styles.brand}>
            <PharmacyIcon sx={styles.icon} />
            <Typography variant="h6" sx={styles.title}>
              PharmaStock {isAdmin ? "Admin" : "User"} Dashboard
            </Typography>
          </Box>
          
          <Box sx={styles.actions}>
            <Button 
              variant="contained" 
              color={isOrderMode ? "success" : "primary"}
              startIcon={<AddIcon />}
              onClick={() => {
                setIsOrderMode(!isOrderMode);
                if (!isOrderMode) setSelectedItems([]);
              }}
              sx={styles.actionButton}
            >
              {isOrderMode ? "Cancel Order" : "Order Now"}
            </Button>

            {isAdmin && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate("/add-supplier")}
                sx={styles.actionButton}
              >
                Add Supplier
              </Button>
            )}
            
            <Button 
              variant="contained" 
              color="warning"
              startIcon={<WarningIcon />}
              onClick={() => setActiveTab(4)}
              sx={styles.actionButton}
            >
              Low Stock ({lowStockCount})
            </Button>
            
            <Tooltip title="Logout">
              <IconButton 
                color="error" 
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login");
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Box sx={styles.tabsContainer}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabLabels.map((label, index) => (
            <Tab 
              key={label} 
              label={label} 
              icon={index === 0 ? <PharmacyIcon /> : 
                   index === 1 ? <InventoryIcon /> : 
                   index === 4 ? <WarningIcon /> : 
                   index === 3 ? <PeopleIcon /> : <AddIcon />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Loading Indicator */}
      {loading && <LinearProgress />}

      {/* Error Message */}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={styles.alert}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Box sx={styles.content}>
        {/* Dashboard Tab */}
        {activeTab === 0 && (
          <Box sx={styles.dashboardTab}>
            {/* Stats Cards */}
            <Box sx={styles.statsContainer}>
              <Card sx={styles.statCard}>
                <CardContent>
                  <Typography variant="h5" color="primary">
                    {totalStock}
                  </Typography>
                  <Typography variant="body2">
                    Total Products
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={styles.statCard}>
                <CardContent>
                  <Typography variant="h5" color="primary">
                    {totalQuantity}
                  </Typography>
                  <Typography variant="body2">
                    Total Quantity
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={styles.statCard}>
                <CardContent>
                  <Typography variant="h5" color="primary">
                    ₹{totalValue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Total Value
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ ...styles.statCard, backgroundColor: '#fff8e1' }}>
                <CardContent>
                  <Typography variant="h5" color="warning.main">
                    {lowStockCount}
                  </Typography>
                  <Typography variant="body2">
                    Low Stock Items
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Recent Items */}
            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    {isOrderMode && <TableCell>Select</TableCell>}
                    <TableCell>Product Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Supplier</TableCell>
                    {isAdmin && <TableCell>Ordered By</TableCell>}
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.slice(0, 5).map((item) => (
                    <TableRow key={item.id}>
                      {isOrderMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            color="primary"
                          />
                        </TableCell>
                      )}
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>
                        <Box sx={{ 
                          color: item.quantity < item.threshold ? 'error.main' : 'inherit',
                          fontWeight: item.quantity < item.threshold ? 'bold' : 'normal'
                        }}>
                          {item.quantity}
                        </Box>
                      </TableCell>
                      <TableCell>₹{item.price}</TableCell>
                      <TableCell>{item.supplier_name || "—"}</TableCell>
                      {isAdmin && <TableCell>{item.user || "—"}</TableCell>}
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(item)}>
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(item.id)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Inventory Tab */}
        {activeTab === 1 && (
          <Box>
            {/* Filters */}
            <Paper elevation={2} sx={styles.filterContainer}>
              <Box sx={styles.filterRow}>
                <TextField
                  label="Search Products"
                  variant="outlined"
                  size="small"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  sx={styles.filterInput}
                />
                
                <FormControl size="small" sx={styles.filterInput}>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    label="Supplier"
                  >
                    <MenuItem value="">All Suppliers</MenuItem>
                    {suppliers.map((s) => (
                      <MenuItem key={s.id} value={s.name}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Date"
                  type="date"
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  sx={styles.filterInput}
                />
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchProduct("");
                    setSelectedSupplier("");
                    setFilterDate("");
                  }}
                  sx={styles.filterButton}
                >
                  Clear
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<FileDownloadIcon />}
                  onClick={handleDownloadReport}
                  sx={styles.filterButton}
                >
                  Export
                </Button>

                {isOrderMode && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleProceedToOrder}
                    disabled={selectedItems.length === 0}
                    sx={styles.filterButton}
                  >
                    Proceed to Order ({selectedItems.length})
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Inventory Table */}
            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    {isOrderMode && <TableCell>Select</TableCell>}
                    <TableCell>Product Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    {isAdmin && <TableCell>Ordered By</TableCell>}
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      {isOrderMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            color="primary"
                          />
                        </TableCell>
                      )}
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>
                        <Box sx={{ 
                          color: item.quantity < item.threshold ? 'error.main' : 'inherit',
                          fontWeight: item.quantity < item.threshold ? 'bold' : 'normal'
                        }}>
                          {item.quantity}
                        </Box>
                      </TableCell>
                      <TableCell>₹{item.price}</TableCell>
                      <TableCell>{item.supplier_name || "—"}</TableCell>
                      <TableCell>{item.expiration_date || "—"}</TableCell>
                      {isAdmin && <TableCell>{item.user || "—"}</TableCell>}
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(item)}>
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(item.id)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Add Product Tab */}
        {activeTab === 2 && (
          <Paper elevation={3} sx={styles.formContainer}>
            <Typography variant="h5" sx={styles.formTitle}>
              {editingId ? "Edit Product" : "Add New Product"}
            </Typography>
            
            <Box component="form" onSubmit={handleFormSubmit} sx={styles.form}>
              <Box sx={styles.formRow}>
                <TextField
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  fullWidth
                  margin="normal"
                />
                
                <TextField
                  label="SKU"
                  name="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  required
                  fullWidth
                  margin="normal"
                />
              </Box>
              
              <Box sx={styles.formRow}>
                <TextField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                  margin="normal"
                  sx={styles.numberInput}
                />
                
                <TextField
                  label="Price (₹)"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                  margin="normal"
                  sx={styles.numberInput}
                />
                
                <TextField
                  label="Threshold"
                  name="threshold"
                  type="number"
                  value={formData.threshold}
                  onChange={(e) => setFormData({...formData, threshold: e.target.value})}
                  required
                  margin="normal"
                  sx={styles.numberInput}
                />
              </Box>
              
              <TextField
                label="Expiration Date"
                name="expiration_date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.expiration_date}
                onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                fullWidth
                margin="normal"
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Supplier</InputLabel>
                <Select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                  label="Supplier"
                >
                  <MenuItem value="">Select Supplier</MenuItem>
                  {suppliers.map((s) => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={styles.formButtons}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={styles.submitButton}
                  disabled={loading}
                >
                  {editingId ? "Update Product" : "Add Product"}
                </Button>
                
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    setFormData({
                      name: "", sku: "", quantity: "", price: "",
                      supplier_id: "", expiration_date: "", threshold: "",
                    });
                    setEditingId(null);
                    setActiveTab(1);
                  }}
                  sx={styles.cancelButton}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Suppliers Tab */}
        {activeTab === 3 && (
          <Box>
            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Supplier Name</TableCell>
                    <TableCell>GST Number</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Address</TableCell>
                    {isAdmin && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.gst_number || "—"}</TableCell>
                      <TableCell>{s.mobile || "—"}</TableCell>
                      <TableCell>{s.email || "—"}</TableCell>
                      <TableCell>{s.address || "—"}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton onClick={() => handleEditSupplier(s)}>
                              <EditIcon color="primary" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton onClick={() => handleDeleteSupplier(s.id)}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Low Stock Tab */}
        {activeTab === 4 && (
          <Box>
            <Typography
              variant="h6"
              color="error"
              sx={{
                ...styles.sectionTitle,
                textAlign: 'center',
                display: 'block',
                width: '100%',
              }}
            >
              Low Stock Products ({lowStockCount})
            </Typography>

            
            <TableContainer component={Paper} sx={styles.tableContainer}>
              <Table>
                <TableHead>
                  <TableRow>
                    {isOrderMode && <TableCell>Select</TableCell>}
                    <TableCell>Product Name</TableCell>
                    <TableCell>Current Qty</TableCell>
                    <TableCell>Threshold</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      {isOrderMode && (
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            color="primary"
                          />
                        </TableCell>
                      )}
                      <TableCell>{item.name}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                        {item.quantity}
                      </TableCell>
                      <TableCell>{item.threshold}</TableCell>
                      <TableCell>₹{item.price}</TableCell>
                      <TableCell>{item.supplier_name || "—"}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleEdit(item)}>
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDelete(item.id)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
    </Box>
  );
}

const styles = {
  container: {
    display: 'flex',
    overflowX: 'hidden',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  appBar: {
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '12px 24px',
    borderRadius: 0
  },
  appBarContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '32px'
  },
  title: {
    fontWeight: 'bold'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  actionButton: {
    textTransform: 'none',
    fontWeight: 'bold'
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0'
  },
  alert: {
    margin: '16px'
  },
  content: {
    flex: 1,
    padding: '24px 16px', // Added equal horizontal padding
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box' // Added for proper width calculations
  },
  dashboardTab: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px'
  },
  statCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    transition: 'transform 0.3s',
    '&:hover': {
      transform: 'translateY(-5px)'
    }
  },
  sectionTitle: {
    marginBottom: '16px',
    fontWeight: 'bold'
  },
  filterContainer: {
    padding: '16px',
    marginBottom: '16px',
    // Removed the right margin
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  filterInput: {
    minWidth: '200px',
    flex: 1
  },
  filterButton: {
    height: '40px'
  },
  tableContainer: {
    margin: '16px 0', // Equal top/bottom margin
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    width: '100%' // Ensure full width within container
  },
  formContainer: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  formTitle: {
    marginBottom: '24px',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formRow: {
    display: 'flex',
    gap: '16px',
    '& > *': {
      flex: 1
    }
  },
  numberInput: {
    maxWidth: '150px'
  },
  formButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    marginTop: '24px'
  },
  submitButton: {
    padding: '10px 24px',
    fontWeight: 'bold'
  },
  cancelButton: {
    padding: '10px 24px'
  }
};

export default Dashboard;