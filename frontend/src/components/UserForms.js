import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const UserForms = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    console.log('UserForms component mounted');
    fetchForms();
  }, []);

  const fetchForms = async () => {
    console.log('Fetching forms...');
    try {
      setLoading(true);
      const response = await api.get('/forms');
      console.log('Forms response:', response.data);
      setForms(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching forms:', error.response || error);
      setError('Failed to fetch forms. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    console.log('Navigating to form creation page');
    navigate('/forms/new');
  };

  const handleViewSubmissions = (formId) => {
    console.log('Viewing submissions for form:', formId);
    navigate(`/forms/${formId}/submissions`);
  };

  const handleEditForm = (formId) => {
    console.log('Editing form:', formId);
    navigate(`/forms/${formId}/edit`);
  };

  const handleDeleteForm = async (formId) => {
    console.log('Attempting to delete form:', formId);
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        await api.delete(`/forms/${formId}`);
        console.log('Form deleted successfully:', formId);
        setForms(forms.filter(form => form._id !== formId));
      } catch (error) {
        console.error('Error deleting form:', error);
        setError('Failed to delete form. Please try again.');
      }
    }
  };

  const handleShareForm = (form) => {
    const url = form.customLink 
      ? `${window.location.origin}/shared/${form.customLink}`
      : `${window.location.origin}/shared/${form._id}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url).then(() => {
      console.log('Share link copied to clipboard');
      alert('Share link copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const handleSetExpiry = async (formId, expiryType) => {
    console.log('Setting expiry for form:', formId, 'Expiry type:', expiryType);
    try {
      let expiryDate;
      switch (expiryType) {
        case '12hours':
          expiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
          break;
        case '24hours':
          expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
          break;
        case '1':
        case '7':
        case '30':
          expiryDate = new Date(Date.now() + parseInt(expiryType) * 24 * 60 * 60 * 1000);
          break;
        case 'never':
          expiryDate = null;
          break;
        default:
          throw new Error('Invalid expiry type');
      }
      await api.put(`/forms/${formId}`, { expiryDate });
      console.log('Expiry set successfully');
      fetchForms(); // Refresh the forms list
    } catch (error) {
      console.error('Error setting form expiry:', error);
      setError('Failed to set form expiry. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatExpiryDate = (expiryDate) => {
    if (!expiryDate) return 'Never';
    const date = new Date(expiryDate);
    const now = new Date();
    const diffHours = (date - now) / (1000 * 60 * 60);
    if (diffHours <= 12) {
      return '12 hours';
    } else if (diffHours <= 24) {
      return '24 hours';
    } else {
      return formatDate(expiryDate);
    }
  };

  const isExpired = (expiryDate) => {
    return expiryDate && new Date() > new Date(expiryDate);
  };

  const handleExpireNow = async (formId) => {
    console.log('Attempting to expire form now:', formId);
    if (window.confirm('Are you sure you want to expire this form now?')) {
      try {
        await api.put(`/forms/${formId}/expire`);
        console.log('Form expired successfully');
        fetchForms(); // Refresh the forms list
      } catch (error) {
        console.error('Error expiring form:', error);
        setError('Failed to expire form. Please try again.');
      }
    }
  };

  const handlePublishAgain = async (formId) => {
    console.log('Attempting to publish form again:', formId);
    try {
      const response = await api.put(`/forms/${formId}/publish`, { published: true });
      console.log('Form published successfully:', response.data);
      setForms(forms.map(form => 
        form._id === formId ? { ...form, published: true, expiryDate: null } : form
      ));
      setError(null);
    } catch (error) {
      console.error('Error publishing form:', error);
      setError('Failed to publish form. Please try again.');
    }
  };

  if (loading) {
    console.log('Rendering loading state');
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    console.log('Rendering error state:', error);
    return <div className="p-4 text-red-500">{error}</div>;
  }

  console.log('Rendering UserForms component');
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Forms</h2>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      <button 
        onClick={handleCreateForm}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Create New Form
      </button>
      {forms.length === 0 ? (
        <p>You haven't created any forms yet.</p>
      ) : (
        <ul>
          {forms.map((form) => (
            <li key={form._id} className="mb-4 p-4 border rounded">
              <h3 className="text-xl font-bold">{form.title}</h3>
              <p className="text-sm text-gray-500">Created: {formatDate(form.createdAt)}</p>
              {form.lastEditedAt && (
                <p className="text-sm text-gray-500">Last edited: {formatDate(form.lastEditedAt)}</p>
              )}
              <p className="text-sm text-gray-500">
                Expires: {formatExpiryDate(form.expiryDate)}
                {isExpired(form.expiryDate) && ' (Expired)'}
              </p>
              <div className="mt-2 space-x-2">
                <Link to={`/forms/${form._id}`} className="text-blue-500 hover:underline">View Form</Link>
                <button
                  onClick={() => handleViewSubmissions(form._id)}
                  className="text-green-500 hover:underline"
                >
                  View Submissions
                </button>
                <button
                  onClick={() => handleEditForm(form._id)}
                  className="text-yellow-500 hover:underline"
                >
                  Edit Form
                </button>
                <button
                  onClick={() => handleDeleteForm(form._id)}
                  className="text-red-500 hover:underline"
                >
                  Delete Form
                </button>
                <button
                  onClick={() => handleShareForm(form)}
                  className="text-purple-500 hover:underline"
                >
                  Share Form
                </button>
                {!isExpired(form.expiryDate) ? (
                  <button
                    onClick={() => handleExpireNow(form._id)}
                    className="text-orange-500 hover:underline"
                  >
                    Expire Now
                  </button>
                ) : (
                  <button
                    onClick={() => handlePublishAgain(form._id)}
                    className="text-green-500 hover:underline"
                  >
                    Publish Again
                  </button>
                )}
                <select
                  onChange={(e) => handleSetExpiry(form._id, e.target.value)}
                  className="border rounded p-1"
                >
                  <option value="">Set Expiry</option>
                  <option value="12hours">12 hours</option>
                  <option value="24hours">24 hours</option>
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
      {shareUrl && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>Share this link:</p>
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full p-2 mt-2 border rounded"
          />
        </div>
      )}
    </div>
  );
};

export default UserForms;
