import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import InventoryTable from './pages/InventoryTable';
import AddItem from './pages/AddItem';
import AddItemAdmin from './pages/AddItemAdmin';
import AddItemUser from './pages/AddItemUser';
import AddSupplier from './pages/AddSupplier';
import Login from './pages/login';
import Signup from './pages/Signup';
import LowStock from './pages/LowStock';
import ReportDownload from './pages/ReportDownload';
import PrivateRoute from './utils/PrivateRoute';
import OrderPage from './pages/OrderPage';
import OrderSuccess from './pages/OrderSuccess';
import './styles/app.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><InventoryTable /></PrivateRoute>} />
      <Route path="/add-item" element={<PrivateRoute><AddItem /></PrivateRoute>} />
      <Route path="/add-item-admin" element={<PrivateRoute><AddItemAdmin /></PrivateRoute>} />
      <Route path="/add-item-user" element={<PrivateRoute><AddItemUser /></PrivateRoute>} />

      {/* ✅ Supplier Routes */}
      <Route path="/add-supplier" element={<PrivateRoute><AddSupplier /></PrivateRoute>} />
      <Route path="/edit-supplier/:id" element={<PrivateRoute><AddSupplier /></PrivateRoute>} />

      {/* ✅ Order Routes */}
      <Route path="/order" element={<PrivateRoute><OrderPage /></PrivateRoute>} />
      <Route path="/order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />

      {/* Auth & Utility */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/low-stock" element={<PrivateRoute><LowStock /></PrivateRoute>} />
      <Route path="/report" element={<PrivateRoute><ReportDownload /></PrivateRoute>} />
    </Routes>
  );
}

export default App;
