import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const FormSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [formResponse, submissionsResponse] = await Promise.all([
        api.get(`/forms/${id}`),
        api.get(`/forms/${id}/submissions`)
      ]);
      console.log('Form data:', formResponse.data);
      console.log('Submissions data:', submissionsResponse.data);
      setForm(formResponse.data);
      setSubmissions(submissionsResponse.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await api.delete(`/forms/submissions/${submissionId}`);
        setSuccessMessage('Submission deleted successfully');
        setSubmissions(submissions.filter(sub => sub._id !== submissionId));
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (error) {
        console.error('Error deleting submission:', error);
        setError('Failed to delete submission. Please try again.');
      }
    }
  };

  const handleEditSubmission = (submissionId) => {
    navigate(`/submissions/${submissionId}/edit`);
  };

  const renderFieldValue = (responses, fieldName, type) => {
    const value = responses[fieldName];
    if (value === undefined || value === null) {
      return 'N/A';
    }

    switch (type) {
      case 'file':
        return <a href={`http://localhost:5000/uploads/${value}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View File</a>;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'select':
        return value;
      default:
        return value.toString();
    }
  };

  const exportToCSV = () => {
    if (!form || !submissions.length) return;

    const fields = form.sections.flatMap(section => section.fields);
    const csvContent = [
      ['Submission Date', ...fields.map(field => field.label)].join(','),
      ...submissions.map(submission => {
        return [
          new Date(submission.createdAt).toLocaleString(),
          ...fields.map(field => {
            const value = submission.responses[field._id] || '';
            return `"${value.toString().replace(/"/g, '""')}"`;
          })
        ].join(',');
      })
    ].join('\n');

    console.log('CSV Content:', csvContent);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${form.title}_submissions.csv`);
  };

  const exportToExcel = () => {
    if (!form || !submissions.length) return;

    const fields = form.sections.flatMap(section => section.fields);
    const data = submissions.map(submission => {
      const row = {
        'Submission Date': new Date(submission.createdAt).toLocaleString()
      };
      fields.forEach(field => {
        row[field.label] = submission.responses[field._id] || '';
      });
      return row;
    });

    console.log('Excel data:', data);

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Submissions');
    XLSX.writeFile(wb, `${form.title}_submissions.xlsx`);
  };

  if (loading) return <div className="p-4">Loading submissions...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!form) return <div className="p-4">No form data available.</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Form Submissions: {form?.title}</h2>
      <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">Back to Forms</Link>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={exportToCSV}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Export to CSV
        </button>
        <button
          onClick={exportToExcel}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Export to Excel
        </button>
      </div>

      {submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <div>
          {submissions.map((submission, index) => (
            <div key={submission._id} className="mb-8 p-4 border rounded">
              <h3 className="text-xl font-bold mb-2">Submission {index + 1}</h3>
              <p className="text-sm text-gray-500 mb-2">Submitted at: {new Date(submission.createdAt).toLocaleString()}</p>
              {form.owner ? (
                <ul>
                  {form.sections && form.sections.map((section, sectionIndex) => (
                    <li key={sectionIndex}>
                      <h4 className="font-bold mt-2">{section.title}</h4>
                      <ul>
                        {section.fields.map((field) => {
                          if (submission.responses.hasOwnProperty(field._id)) {
                            return (
                              <li key={field._id} className="mb-2">
                                <strong>{field.label}:</strong>{' '}
                                {renderFieldValue(submission.responses, field._id, field.type)}
                              </li>
                            );
                          }
                          return null;
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                  <p>The form for this submission has been deleted by the creator.</p>
                </div>
              )}
              {submission.submittedBy === currentUserId && (
                <div className="mt-4">
                  {form.isEditable && (
                    <button
                      onClick={() => handleEditSubmission(submission._id)}
                      className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
                    >
                      Edit
                    </button>
                  )}
                  {form.allowDeletion && (
                    <button
                      onClick={() => handleDeleteSubmission(submission._id)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FormSubmissions;
