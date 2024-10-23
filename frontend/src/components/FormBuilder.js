import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { v4 as uuidv4 } from 'uuid';

const FormBuilder = () => {
  const [sections, setSections] = useState([{ id: 'section-1', title: 'Section 1', fields: [] }]);
  const [formTitle, setFormTitle] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [allowDeletion, setAllowDeletion] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [expiryType, setExpiryType] = useState('never');
  const [expiryDays, setExpiryDays] = useState('');
  const [expiryDate, setExpiryDate] = useState(null);

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
      name: `field_${uuidv4()}`, // Add this line to generate a unique name
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

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveForm = async () => {
    try {
      setError(null);
      let expiryDateTime = null;
      if (expiryType === 'date') {
        expiryDateTime = expiryDate;
      } else if (expiryType === 'days') {
        expiryDateTime = new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000);
      } else if (expiryType === '12hours') {
        expiryDateTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
      } else if (expiryType === '24hours') {
        expiryDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      const formData = {
        title: formTitle,
        sections: sections.map(section => ({
          title: section.title,
          fields: section.fields.map(field => ({
            type: field.type,
            label: field.label,
            name: field.name,
            required: field.required,
            options: field.options
          }))
        })),
        isEditable,
        allowDeletion,
        customLink: customLink.trim() || undefined, // Use undefined if empty string
        expiryDate: expiryDateTime,
        published: true
      };
      console.log('Sending form data:', formData);
      const response = await api.post('/forms', formData);
      console.log('Response from server:', response.data);
      navigate(`/forms/${response.data._id}`);
    } catch (error) {
      console.error('Error saving form:', error);
      setError('Failed to save form. Please check your network connection and try again.');
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Form Builder</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
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
      <div className="mb-4 space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isEditable}
            onChange={(e) => setIsEditable(e.target.checked)}
            className="mr-2"
          />
          Allow submitters to edit their responses
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={allowDeletion}
            onChange={(e) => setAllowDeletion(e.target.checked)}
            className="mr-2"
          />
          Allow submitters to delete their responses
        </label>
      </div>
      <hr className="my-6 border-t border-gray-300" />
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
              <button onClick={() => addField(section.id, 'text')} className="bg-blue-500 text-white px-4 py-2 rounded mr-2 mb-2">Add Text Field</button>
              <button onClick={() => addField(section.id, 'number')} className="bg-green-500 text-white px-4 py-2 rounded mr-2 mb-2">Add Number Field</button>
              <button onClick={() => addField(section.id, 'date')} className="bg-yellow-500 text-white px-4 py-2 rounded mr-2 mb-2">Add Date Field</button>
              <button onClick={() => addField(section.id, 'select')} className="bg-purple-500 text-white px-4 py-2 rounded mr-2 mb-2">Add Select Field</button>
              <button onClick={() => addField(section.id, 'file')} className="bg-pink-500 text-white px-4 py-2 rounded mb-2">Add File Upload</button>
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
                                onClick={() => updateField(section.id, field._id, { options: [...field.options, ''] })}
                                className="bg-blue-500 text-white px-2 py-1 rounded text-sm mt-1"
                              >
                                Add Option
                              </button>
                            </div>
                          )}
                          {field.type === 'number' && (
                            <div className="mt-2">
                              <input
                                type="number"
                                placeholder="Enter a number"
                                className="w-full p-2 mb-1 border rounded"
                                disabled
                              />
                            </div>
                          )}
                          {field.type === 'date' && (
                            <div className="mt-2">
                              <input
                                type="date"
                                className="w-full p-2 mb-1 border rounded"
                                disabled
                              />
                            </div>
                          )}
                          {field.type === 'file' && (
                            <div className="mt-2">
                              <input
                                type="file"
                                className="w-full p-2 mb-1 border rounded"
                                disabled
                              />
                            </div>
                          )}
                          <button
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
                onClick={() => removeSection(section.id)}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm mt-2"
              >
                Remove Section
              </button>
            )}
          </div>
        ))}
      </DragDropContext>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">Form Expiry</label>
        <select
          value={expiryType}
          onChange={(e) => {
            setExpiryType(e.target.value);
            if (e.target.value !== 'date') {
              setExpiryDate(null);
            }
          }}
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
            <DatePicker
              selected={expiryDate}
              onChange={(date) => setExpiryDate(date)}
              showTimeSelect
              dateFormat="MMMM d, yyyy h:mm aa"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
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
      <div className="flex justify-between mt-4">
        <button
          onClick={addSection}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Section
        </button>
        <button
          onClick={handleSaveForm}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Save Form
        </button>
      </div>
    </div>
  );
};

export default FormBuilder;
