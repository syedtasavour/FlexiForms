import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const UserSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/forms/user/submissions');
      console.log('Submissions response:', response.data);
      setSubmissions(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to fetch submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmission = (submissionId) => {
    navigate(`/submissions/${submissionId}/edit`);
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      try {
        await api.delete(`/forms/submissions/${submissionId}`);
        setSubmissions(submissions.filter(sub => sub._id !== submissionId));
      } catch (error) {
        console.error('Error deleting submission:', error);
        setError('Failed to delete submission. Please try again.');
      }
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Form Submissions</h2>
      {submissions.length === 0 ? (
        <p>You haven't submitted any forms yet.</p>
      ) : (
        <ul>
          {submissions.map((submission) => (
            <li key={submission._id} className="mb-4 p-4 border rounded">
              <h3 className="text-xl font-bold">{submission.formTitle || 'Unknown Form'}</h3>
              <p className="text-sm text-gray-500">Submitted on: {new Date(submission.createdAt).toLocaleString()}</p>
              {submission.form ? (
                <div className="mt-2">
                  <h4 className="font-bold">Submitted Data:</h4>
                  <ul className="list-disc pl-5">
                    {Object.entries(submission.responses).map(([fieldName, value]) => (
                      <li key={fieldName}>
                        <strong>{submission.fieldLabels[fieldName] || fieldName}:</strong> {value.toString()}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-2 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                  <p>The form for this submission has been deleted by the creator.</p>
                </div>
              )}
              <div className="mt-2">
                {submission.form && submission.form.isEditable && (
                  <button
                    onClick={() => handleEditSubmission(submission._id)}
                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
                  >
                    Edit Submission
                  </button>
                )}
                {(submission.form && submission.form.allowDeletion) || !submission.form ? (
                  <button
                    onClick={() => handleDeleteSubmission(submission._id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Delete Submission
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserSubmissions;
