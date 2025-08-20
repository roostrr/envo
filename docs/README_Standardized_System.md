# Standardized Data Collection System

This system provides a standardized way to collect student information and generate ML-based predictions and program recommendations without using AI to ask questions. Instead, it uses a structured form that collects all required information at once.

## Features

- **Standardized Form Collection**: Collect all student information through a structured form
- **ML Model Integration**: Uses the same ML model from the Jupyter notebook for predictions
- **Clustering Analysis**: Assigns students to program clusters based on their profile
- **Program Recommendations**: Provides personalized program recommendations based on ML predictions
- **RESTful API**: Clean API endpoints for easy integration

## System Architecture

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Standardized API   │    │  ML Services    │
│   (React Form)  │───▶│  (Flask App)       │───▶│  (Recruitment   │
│                 │    │                     │    │   Service)      │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
                                │                           │
                                ▼                           ▼
                       ┌─────────────────┐    ┌─────────────────────┐
                       │  Form Template  │    │  Sunway Programs    │
                       │  (JSON Schema)  │    │  Service            │
                       └─────────────────┘    └─────────────────────┘
```

## API Endpoints

### 1. Get Form Template
```
GET /api/standardized/form-template
```
Returns the standardized form template with all required fields.

### 2. Collect Student Data
```
POST /api/standardized/collect-data
Content-Type: application/json

{
  "form_data": {
    "gpa": 3.7,
    "family_income_level": "medium",
    "academic_interests": ["business", "computing"],
    "fulltime_study": "yes",
    "international_student": "no",
    "tuition_budget": "25000",
    "completion_confidence": 8,
    "preferred_class_size": "medium",
    "financial_aid_eligible": "yes",
    "prefer_private": "no"
  }
}
```

### 3. Get Student Profile
```
GET /api/standardized/student/{student_id}/profile
```

### 4. Get Programs by Cluster
```
GET /api/standardized/programs/cluster/{cluster_name}
```

### 5. Health Check
```
GET /api/standardized/health
```

## Required Form Fields

| Field | Type | Description | Mapped to ML Variable |
|-------|------|-------------|----------------------|
| gpa | number | Student's GPA (0.0-4.0) | ADM_RATE |
| family_income_level | select | Low/Medium/High | PCTPELL |
| academic_interests | multiselect | Business, Engineering, etc. | - |
| fulltime_study | select | Yes/No | RET_FT4 |
| international_student | select | Yes/No | TUITIONFEE_OUT |
| tuition_budget | select | Budget ranges | TUITIONFEE_IN |
| completion_confidence | number | 1-10 scale | C150_4 |
| preferred_class_size | select | Small/Medium/Large | UGDS |
| financial_aid_eligible | select | Yes/No | NPT4_PUB |
| prefer_private | select | Yes/No | NPT4_PRIV |

## ML Model Integration

The system uses the same ML model from the Jupyter notebook:

1. **Feature Mapping**: Form fields are mapped to College Scorecard variables
2. **Prediction**: Uses the trained model to predict recruitment likelihood
3. **Clustering**: Assigns students to program clusters (engineering_tech, business_finance, etc.)
4. **Recommendations**: Provides program recommendations based on cluster assignment

## Installation and Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Standardized Service
```bash
python standardized_app.py
```

The service will run on `http://localhost:5004`

### 3. Test the System
```bash
python test_standardized_system.py
```

## Frontend Integration

### React Component
```jsx
import StandardizedForm from './components/StandardizedForm';

function App() {
  return (
    <div className="App">
      <StandardizedForm />
    </div>
  );
}
```

### API Integration Example
```javascript
// Get form template
const response = await fetch('http://localhost:5004/api/standardized/form-template');
const template = await response.json();

// Submit form data
const result = await fetch('http://localhost:5004/api/standardized/collect-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ form_data: studentData })
});
```

## Response Format

### Successful Data Collection Response
```json
{
  "success": true,
  "student_id": "uuid",
  "message": "Data collected successfully. Here are your personalized recommendations.",
  "prediction": {
    "prediction": 1,
    "probability": 0.85,
    "confidence": "high",
    "cluster": "business_finance",
    "cluster_id": 1,
    "interpretation": "Excellent match! You have a 85.0% likelihood of success at Sunway University.",
    "recommendations": [
      "You're an excellent candidate for Sunway University!",
      "Consider applying for merit-based scholarships.",
      "Our business programs offer real-world projects and industry partnerships."
    ]
  },
  "recommendations": [
    {
      "name": "Bachelor of Business Administration",
      "department": "Sunway Business School",
      "duration": "3 years",
      "tuition": "Contact for details",
      "website": "https://sunway.edu.my/programs/business"
    }
  ],
  "student_profile": {
    "gpa": 3.7,
    "family_income_level": "medium",
    "college_scorecard_ADM_RATE": 0.8,
    "college_scorecard_PCTPELL": 0.4,
    // ... other mapped variables
  }
}
```

## ML Model Details

The system uses the same clustering and prediction logic from the Jupyter notebook:

### Clusters
- **engineering_tech**: Engineering and Technology programs
- **business_finance**: Business and Finance programs  
- **computer_science**: Computer Science and IT programs
- **arts_design**: Creative Arts and Design programs
- **hospitality_tourism**: Hospitality and Tourism programs

### Prediction Variables
- **ADM_RATE**: Admission rate (mapped from GPA)
- **PCTPELL**: Pell grant percentage (mapped from income)
- **C150_4**: Completion rate (mapped from confidence)
- **RET_FT4**: Retention rate (mapped from study mode)
- **TUITIONFEE_IN**: In-state tuition (mapped from budget)
- **TUITIONFEE_OUT**: Out-of-state tuition (mapped from international status)
- **COSTT4_A**: Total cost (derived from budget)
- **NPT4_PUB**: Public net price (mapped from financial aid)
- **NPT4_PRIV**: Private net price (mapped from institution preference)
- **UGDS**: Enrollment size (mapped from class size preference)

## Error Handling

The system provides comprehensive error handling:

- **Validation Errors**: Missing required fields
- **ML Model Errors**: Model not loaded or prediction failed
- **API Errors**: Network or server issues

## Security Considerations

- Input validation for all form fields
- CORS configuration for frontend integration
- Rate limiting on API endpoints
- Secure data storage and transmission

## Performance

- Fast form processing (typically < 1 second)
- Efficient ML model inference
- Cached program recommendations
- Optimized database queries

## Troubleshooting

### Common Issues

1. **Service not starting**: Check if port 5004 is available
2. **ML model errors**: Ensure model files are in the `models/` directory
3. **CORS errors**: Verify CORS configuration in the Flask app
4. **Form validation errors**: Check that all required fields are provided

### Debug Mode

Run the service in debug mode for detailed logging:
```bash
python standardized_app.py
```

### Testing

Use the test script to verify all components:
```bash
python test_standardized_system.py
```

## Future Enhancements

- Additional form field types (file upload, date picker)
- Advanced ML model features (ensemble methods)
- Real-time form validation
- Multi-language support
- Advanced analytics dashboard 