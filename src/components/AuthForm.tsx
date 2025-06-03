import React, { useState } from 'react';

interface AuthFormProps {
  onLoginSuccess: (profileId: number, userName: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null); // Changed from useState('')
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null); // This is now valid

    // Basic validation: if it's NOT login (i.e., registration) AND name is missing
    if (!username || !password || (!isLogin && !name)) {
      setError('All fields are required.');
      return;
    }

    // Determine URL and body based on whether it's login or registration
    const url = !isLogin ? 'http://localhost:3001/api/register' : 'http://localhost:3001/api/login';
    const body = !isLogin ? { name, username, password } : { username, password };

    console.log('Sending to backend:', body);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log('Response from backend:', data);

      if (!response.ok) {
        setError(data.message || 'An error occurred.');
        return;
      }

      setMessage(data.message);
      if (isLogin && data.user) { // If it IS login and user data exists
        onLoginSuccess(data.user.id, data.user.name || data.user.username);
      } else if (!isLogin) { // If it's NOT login (i.e., registration was successful)
        setMessage('Registration successful! Please login.');
        setIsLogin(true); // Switch to login form
        setName('');
        setUsername('');
        setPassword('');
      }

    } catch (err) {
      console.error('Auth error:', err);
      setError('Failed to connect to the server. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* And ensure you display the error */}
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <p style={{ marginTop: '15px', color: message && message.includes('successful') ? 'green' : 'red' }}>{message}</p>
      <button
        onClick={() => {
          setIsLogin(!isLogin);
          setError(null); // Clear error when switching forms
          setMessage(null); // Clear message when switching forms - changed from setMessage('')
        }}
        style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginTop: '10px' }}
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default AuthForm;