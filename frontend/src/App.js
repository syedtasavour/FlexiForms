import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link, Switch } from 'react-router-dom';
import FormBuilder from './components/FormBuilder';
import FormPreview from './components/FormPreview';
import FormSubmissions from './components/FormSubmissions';
import FormEdit from './components/FormEdit';
import SharedFormView from './components/SharedFormView';
import Login from './components/Login';
import Register from './components/Register';
import UserForms from './components/UserForms';
import UserSubmissions from './components/UserSubmissions';
import EditSubmission from './components/EditSubmission';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        <nav className="bg-gray-800 p-4">
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="text-white hover:text-gray-300">Home</Link>
            </li>
            {!isAuthenticated && (
              <>
                <li>
                  <Link to="/login" className="text-white hover:text-gray-300">Login</Link>
                </li>
                <li>
                  <Link to="/register" className="text-white hover:text-gray-300">Register</Link>
                </li>
              </>
            )}
            {isAuthenticated && (
              <>
                <li>
                  <button onClick={logout} className="text-white hover:text-gray-300">Logout</button>
                </li>
                <li>
                  <Link to="/submissions" className="text-white hover:text-gray-300">My Submissions</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login onLogin={login} />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register onLogin={login} />} />
          <Route 
            path="/" 
            element={isAuthenticated ? <UserForms /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/forms/new" 
            element={isAuthenticated ? <FormBuilder /> : <Navigate to="/login" />} 
          />
          <Route path="/forms/:id" element={<FormPreview />} />
          <Route 
            path="/forms/:id/submissions" 
            element={isAuthenticated ? <FormSubmissions /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/forms/:id/edit" 
            element={isAuthenticated ? <FormEdit /> : <Navigate to="/login" />} 
          />
          <Route path="/shared/:customLink" element={<SharedFormView />} />
          <Route 
            path="/submissions" 
            element={isAuthenticated ? <UserSubmissions /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/submissions/:id/edit" 
            element={isAuthenticated ? <EditSubmission /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
