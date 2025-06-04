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
    <div className="form-card auth-container">
      <h2 className="auth-title">{isLogin ? 'Login' : 'Register'}</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <div className="form-group auth-form-group">
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
        <div className="form-group auth-form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group auth-form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-submit-btn">
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      <p className={`auth-message ${message?.includes('successful') ? 'success' : 'error'}`}>
        {message}
      </p>
      <button
        onClick={() => {
          setIsLogin(!isLogin);
          setError(null);
          setMessage(null);
        }}
        className="auth-switch-btn"
      >
        {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
      </button>
    </div>
  );
};

export default AuthForm;