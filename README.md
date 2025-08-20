# Envoo - Student Recruitment and Program Recommendation System

A comprehensive system for collecting student information, predicting admission likelihood, and recommending university programs using machine learning.

## 🚀 Features

### Standardized Data Collection
- **Form-based data collection** with preset answer options
- **Real-time ML predictions** for admission likelihood
- **Personalized program recommendations** based on student profile
- **Cluster-based analysis** using K-Means clustering

### Machine Learning Capabilities
- **Admission Prediction**: Gradient Boosting model with 89% accuracy
- **Student Clustering**: 6 distinct clusters for targeted recommendations
- **Feature Engineering**: College Scorecard data integration
- **Model Persistence**: Trained models saved for quick loading

### API Services
- **Standardized Data Collection API** (Flask, Port 5004)
- **ML Recruitment Service** (Python)
- **Sunway Programs Service** (Python)
- **Main Server** (Node.js, Express)

## 📁 Project Structure

```
envoo/
├── backend/                    # Backend services
│   ├── standardized_app.py     # Main standardized data collection API
│   ├── standardized_data_collection.py  # Data collection logic
│   ├── ml_recruitment_service.py        # ML prediction service
│   ├── sunway_programs_service.py      # Program recommendation service
│   ├── claude_ai_service.py            # Conversational AI service
│   ├── career_forecast_service.py      # Career forecasting service
│   ├── python_transcript_service.py    # Transcript processing
│   ├── server.js                       # Main Node.js server
│   ├── tests/                          # Test files
│   ├── routes/                         # API routes
│   ├── middleware/                     # Middleware
│   ├── utils/                          # Utilities
│   └── data/                          # Local data storage
│       ├── conversations.json          # Conversation history
│       └── students.json              # Student profiles
├── frontend/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── StandardizedForm.jsx   # Main form component
│   │   │   └── StandardizedForm.css   # Form styling
│   │   └── ...
│   └── ...
├── data/                              # Data files
│   ├── college_scorecard/             # College Scorecard CSV files
│   │   ├── MERGED2019_20_PP.csv
│   │   ├── MERGED2020_21_PP.csv
│   │   ├── MERGED2021_22_PP.csv
│   │   ├── MERGED2022_23_PP.csv
│   │   └── MERGED2023_24_PP.csv
│   ├── sunway_programs.json           # Sunway University programs
│   └── college_data_preprocessed.csv  # Preprocessed ML data
├── docs/                              # Documentation
│   ├── Clustering & ML-2.ipynb       # ML analysis notebook
│   └── README_Standardized_System.md  # System documentation
├── models/                            # Trained ML models
├── venv-forecast311/                  # Python virtual environment
└── node_modules/                      # Node.js dependencies
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
# Activate virtual environment
venv-forecast311\Scripts\Activate.ps1

# Install Python dependencies
pip install flask flask-cors requests scikit-learn pandas numpy

# Install Node.js dependencies
cd backend
npm install
```

### Frontend Setup
```bash
cd frontend
npm install
```

## 🚀 Running the Application

### 1. Start the Standardized Data Collection Service
```bash
# From project root
C:\Users\alkoj\AppData\Local\Programs\Python\Python311\python.exe backend\standardized_app.py
```
Service will be available at: `http://localhost:5004`

### 2. Start the Main Server
```bash
cd backend
npm start
```

### 3. Start the Frontend
```bash
cd frontend
npm start
```

## �� API Endpoints

### Standardized Data Collection API (Port 5004)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/standardized/health` | GET | Service health check |
| `/api/standardized/form-template` | GET | Get form schema |
| `/api/standardized/collect-data` | POST | Submit student data |
| `/api/standardized/student/<id>/profile` | GET | Get student profile |
| `/api/standardized/programs` | GET | Get all programs |
| `/api/standardized/programs/cluster/<name>` | GET | Get programs by cluster |
| `/api/standardized/model-info` | GET | Get ML model status |

### Example Form Data
```json
{
  "gpa": 3.5,
  "family_income_level": "medium",
  "academic_level": "undergraduate",
  "first_generation": false,
  "international_student": false,
  "preferred_class_size": "large",
  "academic_interests": ["engineering", "technology"],
  "career_goals": ["software_engineer"],
  "extracurriculars": ["coding_club"],
  "work_experience": false
}
```

## 🤖 Machine Learning Model

### Features Used
- **ADM_RATE**: Admission rate
- **PCTPELL**: Percentage of Pell Grant recipients
- **C150_4**: 6-year completion rate
- **RET_FT4**: First-year retention rate
- **TUITIONFEE_IN/OUT**: In-state/Out-of-state tuition
- **COSTT4_A**: Average cost of attendance
- **NPT4_PUB/PRIV**: Net price for public/private
- **UGDS**: Undergraduate enrollment
- **CONTROL**: Institution control (public/private)
- **LOCALE**: Institution locale

### Model Performance
- **Accuracy**: 89.05%
- **Cross-validation**: 89.44% (±1.29%)
- **Clusters**: 6 distinct student groups

## 🎯 Student Clusters

1. **Engineering & Technology**: Technical programs, high STEM focus
2. **Business & Finance**: Business programs, management focus
3. **Computer Science**: Software, AI, programming focus
4. **Arts & Design**: Creative programs, design focus
5. **Hospitality & Tourism**: Service industry programs
6. **Medical & Life Sciences**: Healthcare, sciences focus

## 🔧 Configuration

### Environment Variables
Create `.env` file in backend directory:
```env
PORT=3000
NODE_ENV=development
FLASK_ENV=development
```

### Data Paths
- College Scorecard data: `data/college_scorecard/`
- Sunway programs: `data/sunway_programs.json`
- ML models: `models/`
- Student data: `backend/data/`

## 📈 Testing

### Test the Standardized System
```bash
# From project root
C:\Users\alkoj\AppData\Local\Programs\Python\Python311\python.exe backend\tests\test_standardized_system.py
```

### Health Check
```bash
curl http://localhost:5004/api/standardized/health
```

## 🧹 Project Cleanup

The project has been cleaned and organized:

✅ **Removed duplicate files** (CSV files, wheel files)  
✅ **Organized test files** into `backend/tests/`  
✅ **Moved data files** to appropriate directories  
✅ **Updated file paths** in services  
✅ **Created documentation** structure  
✅ **Fixed corrupted JSON** files  

## 🚨 Troubleshooting

### Common Issues

1. **Flask not found**: Use system Python path
   ```bash
   C:\Users\alkoj\AppData\Local\Programs\Python\Python311\python.exe
   ```

2. **JSON parsing errors**: Delete corrupted files
   ```bash
   echo "{}" > backend\data\conversations.json
   ```

3. **Port conflicts**: Check if port 5004 is available
   ```bash
   netstat -ano | findstr :5004
   ```

4. **Model training**: First run will train models automatically

## 📝 Development Notes

- **Standardized Form**: Collects all data at once with preset options
- **ML Integration**: Real-time predictions using trained models
- **Program Recommendations**: Based on student clusters and interests
- **Data Persistence**: Student profiles and conversations saved
- **API Design**: RESTful endpoints with JSON responses

## 🤝 Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Use the standardized data collection approach

## 📄 License

This project is for educational purposes. 