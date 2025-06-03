import { useState, useEffect } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard'; // Import the Dashboard component


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  
  // Check for stored login info on initial load
  useEffect(() => {
    const storedProfileId = localStorage.getItem('profileId');
    const storedUserName = localStorage.getItem('userName');
    if (storedProfileId && storedUserName) {
      setCurrentProfileId(parseInt(storedProfileId, 10));
      setCurrentUserName(storedUserName);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (profileId: number, userName: string) => {
    localStorage.setItem('profileId', profileId.toString());
    localStorage.setItem('userName', userName);
    setCurrentProfileId(profileId);
    setCurrentUserName(userName);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('profileId');
    localStorage.removeItem('userName');
    setCurrentProfileId(null);
    setCurrentUserName(null);
    setIsLoggedIn(false);
  };

  return (
    <>
      <div className="app-header">
        <h1>Finance Tracker</h1>
        {isLoggedIn && currentProfileId && (
          <div className="user-header-group">
            <span className="welcome-message">Welcome, {currentUserName || 'User'}!</span>
            <button onClick={handleLogout} className="logout-btn">
              <span className="logout-icon" style={{verticalAlign: 'middle', marginRight: '4px'}}>
                {/* Simple logout SVG icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </span>
              Logout
            </button>
          </div>
        )}
      </div>
      {isLoggedIn && currentProfileId ? (
        <Dashboard profileId={currentProfileId} onLogout={handleLogout} />
      ) : (
        <AuthForm onLoginSuccess={handleLoginSuccess} />
      )}
      
      
    </>
  );
}

export default App;
