import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Auth status
  const [prList, setPrList] = useState([]);                        // Pull Requests list
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [username, setUsername] = useState('');                     // GitHub username
  const [repoName, setRepoName] = useState('');                     // GitHub repository name
  const [errorMessage, setErrorMessage] = useState('');             // Error handling for input

  // Step 1: Check if the user is authenticated
  useEffect(() => {
    axios.get('http://localhost:5000/')  // Backend call to check auth
      .then(response => {
        if (Object.keys(response.data).length > 0) {
          setIsAuthenticated(true);  // Authenticated if tokens exist
        }
      })
      .catch(error => {
        console.error('Error fetching authentication status:', error);
      });
  }, []);

  // Step 2: Handle GitHub Authentication
  const handleGitHubAuth = () => {
    window.location.href = 'http://localhost:5000/auth/github';  // Redirect to GitHub OAuth
  };

  // Step 3: Fetch recent Pull Requests using the username and repository name from the form
  const fetchPullRequests = async () => {
    if (!username || !repoName) {
      setErrorMessage('Please enter both the GitHub username and repository name.');
      return;
    }
    setErrorMessage('');
    setLoadingPRs(true);

    try {
      const response = await axios.post('http://localhost:5000/webhook', {
        owner: username,
        repo: repoName,
      });
      setPrList(response.data);
      setLoadingPRs(false);
    } catch (error) {
      console.error('Error fetching PRs:', error);
      setLoadingPRs(false);
    }
  };

  return (
    <div className="App">
      <h1 className="header">GitHub PR Review System</h1>

      {isAuthenticated ? (
        <div className="auth-container">
          <div className="input-group">
            <label htmlFor="username">GitHub Username:</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your GitHub username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={errorMessage ? 'input-error' : ''}
            />
          </div>
          <div className="input-group">
            <label htmlFor="repoName">Repository Name:</label>
            <input
              type="text"
              id="repoName"
              placeholder="Enter your GitHub repository name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className={errorMessage ? 'input-error' : ''}
            />
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button onClick={fetchPullRequests} disabled={loadingPRs} className="fetch-button">
            {loadingPRs ? 'Loading PRs...' : 'Fetch Pull Requests'}
          </button>

          {/* Step 4: Display the list of Pull Requests */}
          {prList.length > 0 && (
            <div className="pr-list">
              <h2>Pull Requests</h2>
              <ul>
                {prList.map(pr => (
                  <div key={pr.id} className="pr-item">
                    <label>Title:</label>
                    <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
                      {pr.title}
                    </a>
                    <br />
                    <label>Body/Description:</label>
                    <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
                      {pr.body || 'No description provided.'}
                    </a>
                  </div>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="auth-container">
          <button onClick={handleGitHubAuth} className="auth-button">Login with GitHub</button>
        </div>
      )}
    </div>
  );
}

export default App;
