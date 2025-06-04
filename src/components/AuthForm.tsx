import React, { useState } from 'react';

interface AuthFormProps {
  onLoginSuccess: (profileId: number, userName: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!username || !password || (!isLogin && !name)) {
      setError('All fields are required.');
      return;
    }

    const url = !isLogin ? 'http://localhost:3001/api/register' : 'http://localhost:3001/api/login';
    const body = !isLogin ? { name, username, password } : { username, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'An error occurred.');
        return;
      }

      setMessage(data.message);
      if (isLogin && data.user) {
        onLoginSuccess(data.user.id, data.user.name || data.user.username);
      } else if (!isLogin) {
        setMessage('Registration successful! Please login.');
        setIsLogin(true);
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
    <div className="form-card" style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{isLogin ? 'Login' : 'Register'}</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        {!isLogin && (
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" style={{ width: '100%', marginBottom: '1rem' }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <p style={{ 
        textAlign: 'center', 
        marginTop: '1rem',
        color: message && message.includes('successful') ? '#10b981' : '#ef4444'
      }}>
        {message}
      </p>
      <button
        onClick={() => {
          setIsLogin(!isLogin);
          setError(null);
          setMessage(null);
        }}
        style={{
          width: '100%',
          background: 'transparent',
          color: '#6366f1',
          boxShadow: 'none',
          border: '2px solid #6366f1',
        }}
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default AuthForm;