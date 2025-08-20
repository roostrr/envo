import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './StandardizedForm.module.css';
import AIChatSidebar from './AIChatSidebar.jsx';

const StandardizedForm = () => {
  const [formTemplate, setFormTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);

  // API base URL
  const API_BASE = 'http://localhost:5004/api/standardized';

  useEffect(() => {
    fetchFormTemplate();
  }, []);

  // Add effect to scroll to top when results are shown
  useEffect(() => {
    if (result) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [result]);

  const fetchFormTemplate = async () => {
    try {
      const response = await axios.get(`${API_BASE}/form-template`);
      if (response.data.success) {
        setFormTemplate(response.data.data);
      } else {
        setError('Failed to load form template');
      }
    } catch (err) {
      setError('Error loading form template: ' + err.message);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleMultiSelectChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleBubbleClick = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE}/collect-data`, {
        form_data: formData
      });

      if (response.data.success) {
        setResult(response.data);
        // Scroll to top of the page when results are shown
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(response.data.message || 'Failed to process data');
      }
    } catch (err) {
      setError('Error submitting form: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderBubbleField = (field) => {
    const { name, label, type, required, options, placeholder } = field;
    const currentValue = formData[name];

    return (
      <div key={name} className={styles['bubble-field']}>
        <label className={styles['bubble-label']}>
          {label} {required && '*'}
        </label>
        
        {type === 'multiselect' ? (
          <div className={styles['bubble-group']}>
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.bubble} ${currentValue?.includes(option.value) ? styles.selected : ''}`}
                onClick={() => {
                  const currentValues = currentValue || [];
                  if (currentValues.includes(option.value)) {
                    handleMultiSelectChange(name, currentValues.filter(v => v !== option.value));
                  } else {
                    handleMultiSelectChange(name, [...currentValues, option.value]);
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : (
          <div className={styles['bubble-group']}>
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.bubble} ${currentValue === option.value ? styles.selected : ''}`}
                onClick={() => handleBubbleClick(name, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        
        {currentValue && type === 'multiselect' && (
          <div className="selected-bubbles">
            <span>Selected: {Array.isArray(currentValue) ? currentValue.join(', ') : currentValue}</span>
          </div>
        )}
      </div>
    );
  };

  const renderField = (field) => {
    const { name, label, type, required, options, min, max, step, placeholder } = field;

    // Use bubble interface for select and multiselect fields
    if (type === 'select' || type === 'multiselect') {
      return renderBubbleField(field);
    }

    switch (type) {
      case 'number':
        return (
          <div key={name} className={styles['form-field']}>
            <label htmlFor={name}>{label} {required && '*'}</label>
            <input
              type="number"
              id={name}
              name={name}
              min={min}
              max={max}
              step={step}
              placeholder={placeholder}
              value={formData[name] || ''}
              onChange={(e) => handleInputChange(name, e.target.value)}
              required={required}
            />
          </div>
        );

      case 'email':
        return (
          <div key={name} className={styles['form-field']}>
            <label htmlFor={name}>{label} {required && '*'}</label>
            <input
              type="email"
              id={name}
              name={name}
              placeholder={placeholder}
              value={formData[name] || ''}
              onChange={(e) => handleInputChange(name, e.target.value)}
              required={required}
            />
          </div>
        );

      case 'text':
        return (
          <div key={name} className={styles['form-field']}>
            <label htmlFor={name}>{label} {required && '*'}</label>
            <input
              type="text"
              id={name}
              name={name}
              placeholder={placeholder}
              value={formData[name] || ''}
              onChange={(e) => handleInputChange(name, e.target.value)}
              required={required}
            />
          </div>
        );

      default:
        return (
          <div key={name} className={styles['form-field']}>
            <label htmlFor={name}>{label} {required && '*'}</label>
            <input
              type="text"
              id={name}
              name={name}
              placeholder={placeholder}
              value={formData[name] || ''}
              onChange={(e) => handleInputChange(name, e.target.value)}
              required={required}
            />
          </div>
        );
    }
  };

  if (!formTemplate) {
    return <div className={styles.loading}>Loading form...</div>;
  }

  return (
    <div className={styles['standardized-form-container']}>
      <div className={styles['main-content']}>
        <div className={styles['form-header']}>
          <h1>🎓 Student Profile Assessment</h1>
          <p>Answer a few questions to get personalized program recommendations from Sunway University</p>
        </div>

        <form onSubmit={handleSubmit} className={styles['standardized-form']}>
          {formTemplate.fields.map(renderField)}

          <div className={styles['form-actions']}>
            <button 
              type="submit" 
              disabled={loading}
              className={styles['submit-button']}
            >
              {loading ? '🤖 Analyzing...' : '🚀 Get My Recommendations'}
            </button>
          </div>
        </form>

        {error && (
          <div className={styles['error-message']}>
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className={styles['result-section']}>
            <h2>🎯 Your Personalized Recommendations</h2>
            
            {/* Hide ML analysis from users - only available in admin panel */}
            {/* ML analysis details are available at /admin/ml-analytics for administrators */}
            
            {result.prediction && result.prediction.interpretation && (
              <div className={styles['interpretation-card']}>
                <h4>💡 Personalized Insight</h4>
                <p>{result.prediction.interpretation}</p>
              </div>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
              <div className={styles['programs-section']}>
                <h3>🎓 Recommended Programs</h3>
                <div className={styles['programs-grid']}>
                  {result.recommendations.map((program, index) => (
                    <div key={index} className={styles['program-card']}>
                      <div className={styles['program-header']}>
                        <h4>{program.name}</h4>
                        <span className={styles['program-badge']}>{program.degree_level}</span>
                      </div>
                      <div className={styles['program-details']}>
                        <p><strong>🏛️ Department:</strong> {program.department}</p>
                        <p><strong>⏱️ Duration:</strong> {program.duration}</p>
                        <p><strong>💰 Tuition:</strong> {program.tuition}</p>
                      </div>
                      {program.website && (
                        <a href={program.website} target="_blank" rel="noopener noreferrer" className={styles['program-link']}>
                          🌐 Learn More
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setSelectedProgram(program);
                          setIsChatOpen(true);
                        }}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        💬 Chat with AI
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Chat Sidebar - Always visible next to form */}
      <div className={styles['chat-sidebar-container']}>
        <AIChatSidebar
          isOpen={true}
          onClose={() => setIsChatOpen(false)}
          selectedProgram={selectedProgram}
        />
      </div>
    </div>
  );
};

export default StandardizedForm; 