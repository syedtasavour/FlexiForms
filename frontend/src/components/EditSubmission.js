import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const EditSubmission = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        console.log('Fetching submission with ID:', id);
        const response = await api.get(`/forms/submissions/${id}`);
        console.log('Submission data:', response.data);
        setSubmission(response.data);
        setFormData(response.data.responses);
        setError(null);
      } catch (error) {
        console.error('Error fetching submission:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          setError(`Failed to fetch submission: ${error.response.data.error}`);
        } else if (error.request) {
          console.error('No response received:', error.request);
          setError('Failed to fetch submission: No response received from server');
        } else {
          console.error('Error setting up request:', error.message);
          setError(`Failed to fetch submission: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
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
      console.log('Updating submission with data:', formData);
      const response = await api.put(`/forms/submissions/${id}`, { responses: formData });
      console.log('Submission updated:', response.data);
      navigate('/submissions'); // Redirect to "My Submissions"
    } catch (error) {
      console.error('Error updating submission:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        setError(`Failed to update submission: ${error.response.data.error}`);
      } else {
        setError('Failed to update submission. Please try again.');
      }
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!submission) return <div className="p-4">No submission data available.</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Edit Submission</h2>
      <form onSubmit={handleSubmit}>
        {Object.entries(submission.form.sections).map(([sectionId, section]) => (
          <div key={sectionId} className="mb-6">
            <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
            {section.fields.map((field) => (
              <div key={field._id} className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={field.name}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field._id] || ''}
                  onChange={(e) => handleInputChange(field._id, e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            ))}
          </div>
        ))}
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
          Update Submission
        </button>
      </form>
    </div>
  );
};

export default EditSubmission;
