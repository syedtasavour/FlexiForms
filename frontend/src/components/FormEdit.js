import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from 'uuid';

const FormEdit = () => {
  const [form, setForm] = useState(null);
  const [sections, setSections] = useState([]);
  const [formTitle, setFormTitle] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [allowDeletion, setAllowDeletion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [expiryType, setExpiryType] = useState('never');
  const [expiryDays, setExpiryDays] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/forms/${id}`);
        setForm(response.data);
        setFormTitle(response.data.title);
        setSections(response.data.sections || []);
        setIsEditable(response.data.isEditable);
        setAllowDeletion(response.data.allowDeletion);
        setCustomLink(response.data.customLink || '');
        setIsPublished(response.data.published);
        
        // Set expiry data
        if (response.data.expiryDate) {
          const expiryDate = new Date(response.data.expiryDate);
          const now = new Date();
          const diffHours = (expiryDate - now) / (1000 * 60 * 60);
          
          if (diffHours <= 12) {
            setExpiryType('12hours');
          } else if (diffHours <= 24) {
            setExpiryType('24hours');
          } else {
            setExpiryType('date');
            setExpiryDate(expiryDate.toISOString().split('T')[0]);
            setExpiryTime(expiryDate.toTimeString().split(' ')[0].slice(0, 5));
          }
        } else {
          setExpiryType('never');
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching form:', error);
        setError('Failed to fetch form. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const sourceSection = sections.find(section => section.id === result.source.droppableId);
    const destSection = sections.find(section => section.id === result.destination.droppableId);

    if (sourceSection === destSection) {
      const newFields = Array.from(sourceSection.fields);
      const [reorderedItem] = newFields.splice(result.source.index, 1);
      newFields.splice(result.destination.index, 0, reorderedItem);

      const newSections = sections.map(section =>
        section.id === sourceSection.id ? { ...section, fields: newFields } : section
      );
      setSections(newSections);
    } else {
      const sourceFields = Array.from(sourceSection.fields);
      const destFields = Array.from(destSection.fields);
      const [movedItem] = sourceFields.splice(result.source.index, 1);
      destFields.splice(result.destination.index, 0, movedItem);

      const newSections = sections.map(section => {
        if (section.id === sourceSection.id) return { ...section, fields: sourceFields };
        if (section.id === destSection.id) return { ...section, fields: destFields };
        return section;
      });
      setSections(newSections);
    }
  };

  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      fields: []
    };
    setSections([...sections, newSection]);
  };

  const updateSectionTitle = (sectionId, newTitle) => {
    const newSections = sections.map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    );
    setSections(newSections);
  };

  const removeSection = (sectionId) => {
    setSections(sections.filter(section => section.id !== sectionId));
  };

  const addField = (sectionId, type) => {
    const newField = {
      _id: uuidv4(),
      type,
      label: `New ${type} field`,
      name: `field_${uuidv4()}`,
      required: false,
      options: type === 'select' ? ['Option 1', 'Option 2'] : [],
    };
    const newSections = sections.map(section =>
      section.id === sectionId ? { ...section, fields: [...section.fields, newField] } : section
    );
    setSections(newSections);
  };

  const updateField = (sectionId, fieldId, updates) => {
    const newSections = sections.map(section => {
      if (section.id === sectionId) {
        const newFields = section.fields.map(field =>
          field._id === fieldId ? { ...field, ...updates } : field
        );
        return { ...section, fields: newFields };
      }
      return section;
    });
    setSections(newSections);
  };

  const removeField = (sectionId, fieldId) => {
    const newSections = sections.map(section => {
      if (section.id === sectionId) {
        return { ...section, fields: section.fields.filter(field => field._id !== fieldId) };
      }
      return section;
    });
    setSections(newSections);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return new Date(0, 0, 0, hours, minutes).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      let expiryDateTime = null;
      if (expiryType === 'date') {
        const formattedTime = expiryTime ? formatTime(expiryTime) : '11:59 PM';
        expiryDateTime = new Date(`${expiryDate} ${formattedTime}`).toISOString();
      } else if (expiryType === 'days') {
        expiryDateTime = new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString();
      } else if (expiryType === '12hours') {
        expiryDateTime = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      } else if (expiryType === '24hours') {
        expiryDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      const updatedForm = {
        title: formTitle,
        sections: sections,
        isEditable,
        allowDeletion,
        customLink,
        expiryDate: expiryDateTime,
        lastEditedAt: new Date().toISOString(),
        published: isPublished,
      };
      console.log('Sending updated form data:', updatedForm);
      const response = await api.put(`/forms/${id}`, updatedForm);
      console.log('Server response:', response.data);
      navigate('/');
    } catch (error) {
      console.error('Error updating form:', error.response || error);
      setError(`Failed to update form. ${error.response?.data?.error || error.message}`);
    }
  };

  const handleExpireOrPublish = async () => {
    try {
      if (isPublished) {
        // Expire the form
        await api.put(`/forms/${id}/expire`);
        setIsPublished(false);
        setError('Form expired successfully.');
      } else {
        // Publish the form
        await api.put(`/forms/${id}/publish`, { published: true });
        setIsPublished(true);
        setError('Form published successfully.');
      }
    } catch (error) {
      console.error('Error updating form status:', error);
      setError('Failed to update form status. Please try again.');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!form) return <div className="p-4">No form data available.</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Edit Form</h2>
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formTitle}
          onChange={(e) => setFormTitle(e.target.value)}
          placeholder="Form Title"
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="text"
          value={customLink}
          onChange={(e) => setCustomLink(e.target.value)}
          placeholder="Custom Link (optional)"
          className="w-full p-2 mb-4 border rounded"
        />
        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={isEditable}
              onChange={(e) => setIsEditable(e.target.checked)}
              className="mr-2"
            />
            Allow submitters to edit their responses
          </label>
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={allowDeletion}
              onChange={(e) => setAllowDeletion(e.target.checked)}
              className="mr-2"
            />
            Allow submitters to delete their responses
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Form Expiry</label>
          <select
            value={expiryType}
            onChange={(e) => setExpiryType(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="never">Never</option>
            <option value="12hours">12 Hours</option>
            <option value="24hours">24 Hours</option>
            <option value="date">Specific Date and Time</option>
            <option value="days">Number of Days</option>
          </select>
          {expiryType === 'date' && (
            <div className="mt-2">
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-2"
              />
              <input
                type="time"
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <p className="text-sm text-gray-600 mt-1">
                Expiry time: {formatTime(expiryTime) || 'Not set'}
              </p>
            </div>
          )}
          {expiryType === 'days' && (
            <input
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              placeholder="Number of days"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-2"
            />
          )}
        </div>
        <button
          type="button"
          onClick={handleExpireOrPublish}
          className={`${
            isPublished ? 'bg-orange-500 hover:bg-orange-700' : 'bg-green-500 hover:bg-green-700'
          } text-white font-bold py-2 px-4 rounded mt-4 mr-4`}
        >
          {isPublished ? 'Expire Form' : 'Publish Form'}
        </button>
        <DragDropContext onDragEnd={onDragEnd}>
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="mb-8 p-4 border border-gray-300 rounded">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                className="w-full p-2 mb-4 border rounded font-bold"
              />
              <div className="mb-4">
                <button type="button" onClick={() => addField(section.id, 'text')} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">Add Text Field</button>
                <button type="button" onClick={() => addField(section.id, 'number')} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Add Number Field</button>
                <button type="button" onClick={() => addField(section.id, 'date')} className="bg-yellow-500 text-white px-4 py-2 rounded mr-2">Add Date Field</button>
                <button type="button" onClick={() => addField(section.id, 'select')} className="bg-purple-500 text-white px-4 py-2 rounded mr-2">Add Select Field</button>
                <button type="button" onClick={() => addField(section.id, 'file')} className="bg-pink-500 text-white px-4 py-2 rounded">Add File Upload</button>
              </div>
              <Droppable droppableId={section.id}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {section.fields.map((field, index) => (
                      <Draggable key={field._id} draggableId={field._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-gray-100 p-4 mb-2 rounded"
                          >
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(section.id, field._id, { label: e.target.value })}
                              className="w-full p-2 mb-2 border rounded"
                            />
                            <p>Type: {field.type}</p>
                            <label className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(section.id, field._id, { required: e.target.checked })}
                                className="mr-2"
                              />
                              Required
                            </label>
                            {field.type === 'select' && (
                              <div className="mt-2">
                                <p>Options:</p>
                                {field.options.map((option, optionIndex) => (
                                  <input
                                    key={optionIndex}
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...field.options];
                                      newOptions[optionIndex] = e.target.value;
                                      updateField(section.id, field._id, { options: newOptions });
                                    }}
                                    className="w-full p-2 mb-1 border rounded"
                                  />
                                ))}
                                <button
                                  type="button"
                                  onClick={() => updateField(section.id, field._id, { options: [...field.options, ''] })}
                                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm mt-1"
                                >
                                  Add Option
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeField(section.id, field._id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-sm mt-2"
                            >
                              Remove Field
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              {sectionIndex !== 0 && (
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm mt-2"
                >
                  Remove Section
                </button>
              )}
            </div>
          ))}
        </DragDropContext>
        <button
          type="button"
          onClick={addSection}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 mr-4"
        >
          Add Section
        </button>
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
          Update Form
        </button>
      </form>
    </div>
  );
};

export default FormEdit;
