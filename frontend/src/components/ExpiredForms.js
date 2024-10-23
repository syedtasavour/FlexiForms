import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const ExpiredForms = () => {
  const [expiredForms, setExpiredForms] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExpiredForms = async () => {
      try {
        const response = await api.get('/forms/expired');
        setExpiredForms(response.data);
      } catch (error) {
        console.error('Error fetching expired forms:', error);
        setError('Failed to fetch expired forms. Please try again.');
      }
    };

    fetchExpiredForms();
  }, []);

  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Expired Forms</h1>
      {expiredForms.length === 0 ? (
        <p>No expired forms found.</p>
      ) : (
        <ul className="space-y-4">
          {expiredForms.map((form) => (
            <li key={form._id} className="border p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold">{form.title}</h2>
              <p className="text-gray-600">Expired on: {new Date(form.expiryDate).toLocaleDateString()}</p>
              <div className="mt-2">
                <h3 className="font-medium">Sections:</h3>
                <ul className="list-disc list-inside">
                  {form.sections.map((section, index) => (
                    <li key={index}>{section.title} ({section.fields.length} fields)</li>
                  ))}
                </ul>
              </div>
              <Link to={`/forms/${form._id}/edit`} className="text-blue-500 hover:underline mt-2 inline-block">
                Edit Form
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ExpiredForms;
