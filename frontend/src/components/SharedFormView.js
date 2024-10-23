import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';

const SharedFormView = () => {
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { customLink } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        console.log('Fetching form with identifier:', customLink);
        const response = await api.get(`/forms/shared/${customLink}`);
        console.log('Form data received:', response.data);
        setForm(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching form:', error.response || error);
        setError(error.response?.data?.error || 'Failed to fetch form. Please check the URL and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [customLink]);

  const handleInputChange = (fieldId, value) => {
    setFormData(prevData => ({
      ...prevData,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.requireAccount && !localStorage.getItem('token')) {
        navigate('/login', { state: { returnUrl: `/shared/${customLink}` } });
        return;
      }
      await api.post(`/forms/${form._id}/submit`, { responses: formData });
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Failed to submit form. Please try again.');
    }
  };

  const isFormExpired = () => {
    return form && form.expiryDate && new Date() > new Date(form.expiryDate);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold text-gray-700">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Form Unavailable</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-600 mb-2">Possible reasons:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
              <li>The form has expired</li>
              <li>The form has been deleted</li>
              <li>The form link is incorrect</li>
            </ul>
          </div>
          <Link to="/" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Form Not Found</h2>
          <p className="text-gray-700 mb-4">The requested form could not be found. Please check the URL and try again.</p>
          <Link to="/" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Form: {form.title}</h2>
      
      {isFormExpired() && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">This form has expired.</p>
          <p>Submissions are no longer accepted, but you can still view the form details below.</p>
        </div>
      )}

      {submitSuccess ? (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p className="font-bold">Success!</p>
          <p>Your form has been submitted successfully.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {form.sections && form.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
              {section.fields.map((field) => (
                <div key={field._id} className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={field._id}>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'text' && (
                    <input
                      type="text"
                      id={field._id}
                      required={field.required}
                      onChange={(e) => handleInputChange(field._id, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      disabled={isFormExpired()}
                    />
                  )}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      id={field._id}
                      required={field.required}
                      onChange={(e) => handleInputChange(field._id, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      disabled={isFormExpired()}
                    />
                  )}
                  {field.type === 'date' && (
                    <input
                      type="date"
                      id={field._id}
                      required={field.required}
                      onChange={(e) => handleInputChange(field._id, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      disabled={isFormExpired()}
                    />
                  )}
                  {field.type === 'select' && (
                    <select
                      id={field._id}
                      required={field.required}
                      onChange={(e) => handleInputChange(field._id, e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      disabled={isFormExpired()}
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
                      id={field._id}
                      required={field.required}
                      onChange={(e) => handleInputChange(field._id, e.target.files[0])}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      disabled={isFormExpired()}
                    />
                  )}
                </div>
              ))}
            </div>
          ))}
          {!isFormExpired() && (
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
              Submit
            </button>
          )}
        </form>
      )}
    </div>
  );
};

export default SharedFormView;
