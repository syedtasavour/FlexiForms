import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

const FormPreview = () => {
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [userSubmission, setUserSubmission] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    const fetchFormAndSubmissions = async () => {
      try {
        setLoading(true);
        setError(null);
        const [formResponse, submissionsResponse] = await Promise.all([
          api.get(`/forms/${id}`),
          api.get(`/forms/${id}/submissions`)
        ]);
        console.log('Form data:', formResponse.data);
        console.log('Submissions data:', submissionsResponse.data);
        setForm(formResponse.data);
        setSubmissions(submissionsResponse.data);
        const currentUserId = localStorage.getItem('userId');
        setIsOwner(formResponse.data.owner === currentUserId);
        
        // Check if the current user has already submitted this form
        const userSub = submissionsResponse.data.find(sub => sub.submittedBy === currentUserId);
        if (userSub) {
          setUserSubmission(userSub);
        }
      } catch (error) {
        console.error('Error fetching form and submissions:', error.response || error);
        setError(`Failed to fetch form and submissions. ${error.response?.data?.error || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFormAndSubmissions();
  }, [id]);

  const handleInputChange = (fieldName, value) => {
    setFormData(prevData => ({
      ...prevData,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      if (form.requireAccount && !localStorage.getItem('token')) {
        setError('You need to be logged in to submit this form.');
        return;
      }
      console.log('Form data before submission:', formData);
      const response = await api.post(`/forms/${id}/submit`, { responses: formData });
      console.log('Submission response:', response.data);
      setSubmitSuccess(true);
      setUserSubmission(response.data);
      // Refresh submissions after successful submit
      const submissionsResponse = await api.get(`/forms/${id}/submissions`);
      console.log('Updated submissions:', submissionsResponse.data);
      setSubmissions(submissionsResponse.data);
    } catch (error) {
      console.error('Error submitting form:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.error || 'Failed to submit form. Please try again.');
    }
  };

  const handleDeleteForm = async () => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        await api.delete(`/forms/${id}`);
        navigate('/');
      } catch (error) {
        console.error('Error deleting form:', error);
        setError('Failed to delete form. Please try again.');
      }
    }
  };

  const handleDeleteSubmission = async () => {
    if (window.confirm('Are you sure you want to delete your submission? This action cannot be undone.')) {
      try {
        await api.delete(`/forms/submissions/${userSubmission._id}`);
        setUserSubmission(null);
        // Refresh submissions after deletion
        const submissionsResponse = await api.get(`/forms/${id}/submissions`);
        setSubmissions(submissionsResponse.data);
      } catch (error) {
        console.error('Error deleting submission:', error);
        setError('Failed to delete submission. Please try again.');
      }
    }
  };

  const handleShareForm = () => {
    const url = form.customLink 
      ? `${window.location.origin}/shared/${form.customLink}`
      : `${window.location.origin}/shared/${form._id}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url).then(() => {
      alert('Share link copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!form) return <div className="p-4">No form data available.</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Form: {form.title}</h2>
      {isOwner && (
        <div className="mb-4">
          <Link to={`/forms/${id}/edit`} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mb-4 inline-block mr-2">
            Edit Form
          </Link>
          <Link to={`/forms/${id}/submissions`} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4 inline-block mr-2">
            View Submissions
          </Link>
          <button
            onClick={handleDeleteForm}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4 inline-block mr-2"
          >
            Delete Form
          </button>
          <button
            onClick={handleShareForm}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 inline-block"
          >
            Share Form
          </button>
        </div>
      )}
      {isOwner && (
        <p className="text-red-500 mb-4">As the form owner, you cannot submit this form.</p>
      )}
      {shareUrl && (
        <div className="mt-4 p-4 bg-gray-100 rounded mb-4">
          <p>Share this link:</p>
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full p-2 mt-2 border rounded"
          />
        </div>
      )}
      {!isOwner && (
        <form onSubmit={handleSubmit} className="mb-8">
          {form.sections && form.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
              {section.fields.map((field) => (
                <div key={field._id} className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={field.name}>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'text' && (
                    <input
                      type="text"
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  )}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      id={field.name}
                      required={field.required}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  )}
                  {field.type === 'date' && (
                    <input
                      type="date"
                      id={field.name}
                      required={field.required}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      id={field.name}
                      required={field.required}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="">Select an option</option>
                      {field.options.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  )}
                  {field.type === 'file' && (
                    <input
                      type="file"
                      id={field.name}
                      required={field.required}
                      onChange={(e) => handleInputChange(field.name, e.target.files[0])}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Submit
          </button>
        </form>
      )}

      {userSubmission && form.isEditable && (
        <button
          onClick={() => navigate(`/submissions/${userSubmission._id}/edit`)}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Edit Submission
        </button>
      )}
      {userSubmission && form.allowDeletion && (
        <button
          onClick={handleDeleteSubmission}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Delete Submission
        </button>
      )}
    </div>
  );
};

export default FormPreview;
