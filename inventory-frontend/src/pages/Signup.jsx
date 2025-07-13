import { useState } from 'react';
import API from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const navigate = useNavigate();

  const validateForm = () => {
    const mobileRegex = /^[0-9]{10}$/;
    const ageInt = parseInt(age);

    if (!username || !email || !password || !mobile || !age || !gender || !address) {
      alert('Please fill all fields');
      return false;
    }
    if (!mobileRegex.test(mobile)) {
      alert('Mobile number must be 10 digits');
      return false;
    }
    if (isNaN(ageInt) || ageInt < 1 || ageInt > 120) {
      alert('Enter a valid age between 1 and 120');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      alert('Enter a valid email address');
      return false;
    }
    if (address.trim().length < 5) {
      alert('Address must be at least 5 characters long');
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await API.post('/register/', {
        username,
        email,
        password,
        mobile,
        age,
        gender,
        address,
      });
      alert('Signup successful! Please login.');
      navigate('/login');
    } catch (error) {
      if (error.response?.status === 409) {
        alert('User with this mobile already exists. Redirecting to login...');
        navigate('/login');
      } else {
        alert(error.response?.data?.error || 'Signup failed');
      }
    }
  };

  const inputStyle = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '50px auto',
      padding: '30px',
      border: '1px solid #ccc',
      borderRadius: '10px',
      backgroundColor: '#f9f9f9',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Signup</h2>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
        <input type="tel" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} style={inputStyle} required />
        <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} required />
        <select value={gender} onChange={(e) => setGender(e.target.value)} style={inputStyle} required>
          <option value="">Select Gender</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
        </select>
        <textarea placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} rows="3" required />
        <button type="submit" style={{ ...inputStyle, backgroundColor: '#28a745', color: '#fff', cursor: 'pointer', fontWeight: 'bold', border: 'none' }}>
          Signup
        </button>
        <p style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;
