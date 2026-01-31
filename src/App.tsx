import { useState } from 'react';
import './App.css';

function App() {
  const [canvasUrl, setCanvasUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserData = () => {
    if (!canvasUrl || !accessToken) {
      setError('Please provide both Canvas URL and Access Token.');
      return;
    }

    setLoading(true);
    setError(null);
    setUserData(null);

    // Construct the API URL
    const apiUrl = `${canvasUrl}/api/v1/users/self`;

    // Make the API call
    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      setUserData(data);
      setLoading(false);
    })
    .catch(error => {
      setError(error.message);
      setLoading(false);
    });
  };

  return (
    <div className="container">
      <h1>Get Canvas User Info</h1>
      <div className="form">
        <input
          type="text"
          placeholder="Canvas URL (e.g., https://canvas.instructure.com)"
          value={canvasUrl}
          onChange={(e) => setCanvasUrl(e.target.value)}
        />
        <input
          type="password"
          placeholder="Access Token"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
        />
        <button onClick={fetchUserData} disabled={loading}>
          {loading ? 'Fetching...' : 'Get User Info'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {userData && (
        <div className="user-data">
          <h2>User Data</h2>
          <pre>{JSON.stringify(userData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default App;