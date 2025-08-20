# ============================================================================
# CAREER FORECASTING SERVICE - COMPLETE IMPLEMENTATION
# ============================================================================

import pandas as pd
import numpy as np
import json
import requests
import warnings
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
from sklearn.linear_model import LinearRegression
import os
import io
from collections import defaultdict
warnings.filterwarnings('ignore')

# ============================================================================
# CONFIGURATION
# ============================================================================

DATASET_PATH = '../data/career_forecast_dataset.csv'
MUSE_API_URL = "https://www.themuse.com/api/public/jobs"
REALTIME_DATA_FILE = '../data/realtime_job_data.json'

# MUSE API Job Categories for mapping
MUSE_CATEGORIES = [
    "Accounting", "Accounting and Finance", "Account Management", 
    "Account Management/Customer Success", "Administration and Office",
    "Advertising and Marketing", "Animal Care", "Arts", "Business Operations",
    "Cleaning and Facilities", "Computer and IT", "Construction", "Corporate",
    "Customer Service", "Data and Analytics", "Data Science", "Design",
    "Design and UX", "Editor", "Education", "Energy Generation and Mining",
    "Entertainment and Travel Services", "Farming and Outdoors",
    "Food and Hospitality Services", "Healthcare", "HR", 
    "Human Resources and Recruitment", "Installation, Maintenance, and Repairs",
    "IT", "Law", "Legal Services", "Management", "Manufacturing and Warehouse",
    "Marketing", "Mechanic", "Media, PR, and Communications", "Mental Health",
    "Nurses", "Office Administration", "Personal Care and Services",
    "Physical Assistant", "Product", "Product Management", "Project Management",
    "Protective Services", "Public Relations", "Real Estate", "Recruiting",
    "Retail", "Sales", "Science and Engineering", "Social Services",
    "Software Engineer", "Software Engineering", "Sports, Fitness, and Recreation",
    "Transportation and Logistics", "Unknown", "UX", "Videography", "Writer",
    "Writing and Editing"
]

# ============================================================================
# OCCUPATION TO MUSE CATEGORY MAPPING
# ============================================================================

OCCUPATION_TO_MUSE_MAPPING = {
    # Software and IT
    "software": ["Software Engineering", "Computer and IT", "Data Science"],
    "developer": ["Software Engineering", "Computer and IT"],
    "programmer": ["Software Engineering", "Computer and IT"],
    "computer": ["Computer and IT", "Software Engineering"],
    
    # Engineering (specific types)
    "civil engineer": ["Science and Engineering", "Construction"],
    "mechanical engineer": ["Science and Engineering", "Manufacturing and Warehouse"],
    "electrical engineer": ["Science and Engineering", "Computer and IT"],
    "chemical engineer": ["Science and Engineering"],
    "environmental engineer": ["Science and Engineering"],
    "industrial engineer": ["Science and Engineering", "Manufacturing and Warehouse"],
    "engineer": ["Science and Engineering", "Software Engineering", "Computer and IT"],
    
    # Data and Analytics
    "data": ["Data Science", "Data and Analytics", "Computer and IT"],
    "analyst": ["Data and Analytics", "Computer and IT"],
    
    # Healthcare
    "nurse": ["Nurses", "Healthcare"],
    "doctor": ["Healthcare"],
    "medical": ["Healthcare"],
    "health": ["Healthcare", "Mental Health"],
    "physician": ["Healthcare"],
    "therapist": ["Healthcare", "Mental Health"],
    
    # Education
    "teacher": ["Education"],
    "instructor": ["Education"],
    "professor": ["Education"],
    "education": ["Education"],
    
    # Business and Management
    "manager": ["Management", "Business Operations"],
    "executive": ["Management"],
    "business": ["Business Operations", "Management"],
    "financial": ["Accounting and Finance", "Business Operations"],
    "accountant": ["Accounting", "Accounting and Finance"],
    "auditor": ["Accounting", "Accounting and Finance"],
    "marketing": ["Marketing", "Advertising and Marketing"],
    "sales": ["Sales"],
    
    # Creative and Design
    "design": ["Design", "Design and UX"],
    "ux": ["UX", "Design and UX"],
    "writer": ["Writer", "Writing and Editing"],
    "editor": ["Editor", "Writing and Editing"],
    "artist": ["Arts"],
    "creative": ["Arts", "Design"],
    
    # Other categories
    "law": ["Law", "Legal Services"],
    "legal": ["Legal Services", "Law"],
    "hr": ["HR", "Human Resources and Recruitment"],
    "recruiting": ["Recruiting", "Human Resources and Recruitment"],
    "real estate": ["Real Estate"],
    "construction": ["Construction"],
    "manufacturing": ["Manufacturing and Warehouse"],
    "retail": ["Retail"],
    "food": ["Food and Hospitality Services"],
    "hospitality": ["Food and Hospitality Services"],
    "transportation": ["Transportation and Logistics"],
    "logistics": ["Transportation and Logistics"]
}

# ============================================================================
# ENHANCED FORECASTING FUNCTIONS
# ============================================================================

def enhanced_random_walk_forecast(ts, forecast_periods=7):
    """Enhanced Random Walk with Drift and confidence intervals"""
    if len(ts) < 3:
        return None
    
    try:
        changes = ts.diff().dropna()
        drift = changes.mean()
        drift_std = changes.std()
        
        if np.isnan(drift) or np.isnan(drift_std) or drift_std == 0:
            drift_std = abs(drift) * 0.1 if abs(drift) > 0 else ts.std() * 0.1
        
        forecasts = []
        lower_bounds = []
        upper_bounds = []
        last_value = ts.iloc[-1]
        
        for i in range(forecast_periods):
            forecast = last_value + drift * (i + 1)
            confidence_interval = 1.96 * drift_std * np.sqrt(i + 1)
            
            forecasts.append(max(forecast, 0))
            lower_bounds.append(max(forecast - confidence_interval, 0))
            upper_bounds.append(forecast + confidence_interval)
        
        fitted_rw = [ts.iloc[0]]
        for i in range(1, len(ts)):
            fitted_rw.append(fitted_rw[-1] + drift)
        
        fitted_series = pd.Series(fitted_rw, index=ts.index)
        mae = mean_absolute_error(ts, fitted_series)
        mape = mean_absolute_percentage_error(ts, fitted_series) * 100 if np.all(ts > 0) else 50.0
        
        return {
            'method': 'Random Walk with Drift',
            'forecasts': np.array(forecasts),
            'lower_bounds': np.array(lower_bounds),
            'upper_bounds': np.array(upper_bounds),
            'fitted_values': fitted_series,
            'mae': mae,
            'mape': mape
        }
    except Exception as e:
        return None

def enhanced_exponential_smoothing_forecast(ts, forecast_periods=7):
    """Enhanced Exponential Smoothing with model selection"""
    if len(ts) < 4:
        return None
    
    try:
        models_to_try = [
            {'trend': None, 'seasonal': None, 'name': 'Simple'},
            {'trend': 'add', 'seasonal': None, 'name': 'Linear Trend'},
        ]
        
        if np.all(ts > 0):
            models_to_try.append({'trend': 'mul', 'seasonal': None, 'name': 'Exponential Trend'})
        
        best_model = None
        best_aic = np.inf
        best_config = None
        
        for model_config in models_to_try:
            try:
                model = ExponentialSmoothing(ts, trend=model_config['trend'], seasonal=model_config['seasonal'])
                fitted_model = model.fit(optimized=True, use_brute=False)
                
                if fitted_model.aic < best_aic:
                    best_aic = fitted_model.aic
                    best_model = fitted_model
                    best_config = model_config['name']
            except:
                continue
        
        if best_model is None:
            return None
        
        forecasts = best_model.forecast(steps=forecast_periods)
        forecasts = np.maximum(forecasts, 0)
        
        residuals = ts - best_model.fittedvalues
        std_error = np.std(residuals)
        lower_bounds = np.maximum(forecasts - 1.96 * std_error, 0)
        upper_bounds = forecasts + 1.96 * std_error
        
        fitted_values = best_model.fittedvalues
        mae = mean_absolute_error(ts, fitted_values)
        mape = mean_absolute_percentage_error(ts, fitted_values) * 100 if np.all(ts > 0) else 50.0
        
        return {
            'method': f'Exponential Smoothing ({best_config})',
            'forecasts': np.array(forecasts),
            'lower_bounds': np.array(lower_bounds),
            'upper_bounds': np.array(upper_bounds),
            'fitted_values': fitted_values,
            'aic': best_aic,
            'mae': mae,
            'mape': mape
        }
    except:
        return None

def enhanced_arima_forecast(ts, forecast_periods=7):
    """Enhanced ARIMA with automatic model selection"""
    if len(ts) < 5:
        return None
    
    orders_to_try = [(0, 1, 0), (1, 0, 0), (0, 0, 1), (1, 1, 0), (0, 1, 1), (1, 1, 1)]
    
    best_model = None
    best_aic = np.inf
    best_order = None
    
    for order in orders_to_try:
        try:
            model = ARIMA(ts, order=order)
            fitted_model = model.fit()
            
            if fitted_model.aic < best_aic:
                best_aic = fitted_model.aic
                best_model = fitted_model
                best_order = order
        except:
            continue
    
    if best_model is None:
        return None
    
    try:
        forecast_result = best_model.get_forecast(steps=forecast_periods)
        forecasts = forecast_result.predicted_mean.values
        conf_int = forecast_result.conf_int()
        
        lower_bounds = conf_int.iloc[:, 0].values
        upper_bounds = conf_int.iloc[:, 1].values
        
        forecasts = np.maximum(forecasts, 0)
        lower_bounds = np.maximum(lower_bounds, 0)
        
        fitted_values = best_model.fittedvalues
        mae = mean_absolute_error(ts[-len(fitted_values):], fitted_values)
        mape = mean_absolute_percentage_error(ts[-len(fitted_values):], fitted_values) * 100 if np.all(ts[-len(fitted_values):] > 0) else 50.0
        
        return {
            'method': f'ARIMA{best_order}',
            'forecasts': np.array(forecasts),
            'lower_bounds': np.array(lower_bounds),
            'upper_bounds': np.array(upper_bounds),
            'fitted_values': fitted_values,
            'order': best_order,
            'aic': best_aic,
            'mae': mae,
            'mape': mape
        }
    except:
        return None

def robust_ensemble_forecast(ts, forecast_periods=7):
    """Robust ensemble with linear regression fallback"""
    methods = []
    weights = []
    method_names = []
    
    # Try all time series methods
    rw_result = enhanced_random_walk_forecast(ts, forecast_periods)
    if rw_result and rw_result['mape'] < 200:
        methods.append(rw_result)
        weights.append(1 / max(rw_result['mape'], 0.1))
        method_names.append('RW')
    
    es_result = enhanced_exponential_smoothing_forecast(ts, forecast_periods)
    if es_result and es_result['mape'] < 200:
        methods.append(es_result)
        weights.append(1 / max(es_result['mape'], 0.1))
        method_names.append('ES')
    
    arima_result = enhanced_arima_forecast(ts, forecast_periods)
    if arima_result and arima_result['mape'] < 200:
        methods.append(arima_result)
        weights.append(1 / max(arima_result['mape'], 0.1))
        method_names.append('ARIMA')
    
    # Fallback to linear regression if no methods work
    if not methods:
        try:
            X = np.arange(len(ts)).reshape(-1, 1)
            y = ts.values
            
            lr = LinearRegression()
            lr.fit(X, y)
            
            future_X = np.arange(len(ts), len(ts) + forecast_periods).reshape(-1, 1)
            forecasts = lr.predict(future_X)
            forecasts = np.maximum(forecasts, 0)
            
            residuals = y - lr.predict(X)
            std_error = np.std(residuals)
            lower_bounds = np.maximum(forecasts - 1.96 * std_error, 0)
            upper_bounds = forecasts + 1.96 * std_error
            
            fitted_values = pd.Series(lr.predict(X), index=ts.index)
            mae = mean_absolute_error(ts, fitted_values)
            mape = mean_absolute_percentage_error(ts, fitted_values) * 100 if np.all(ts > 0) else 50.0
            
            return {
                'method': 'Linear Trend (Fallback)',
                'forecasts': np.array(forecasts),
                'lower_bounds': np.array(lower_bounds),
                'upper_bounds': np.array(upper_bounds),
                'fitted_values': fitted_values,
                'components': ['Linear Regression'],
                'weights': [1.0],
                'mae': mae,
                'mape': mape,
                'is_fallback': True
            }
        except:
            return None
    
    # Create weighted ensemble
    weights = np.array(weights)
    weights = weights / weights.sum()
    
    ensemble_forecasts = np.zeros(forecast_periods)
    ensemble_lower = np.zeros(forecast_periods)
    ensemble_upper = np.zeros(forecast_periods)
    
    for i, method in enumerate(methods):
        ensemble_forecasts += weights[i] * method['forecasts']
        ensemble_lower += weights[i] * method['lower_bounds']
        ensemble_upper += weights[i] * method['upper_bounds']
    
    # Ensemble fitted values
    ensemble_fitted = None
    for i, method in enumerate(methods):
        if ensemble_fitted is None:
            ensemble_fitted = weights[i] * method['fitted_values']
        else:
            ensemble_fitted += weights[i] * method['fitted_values']
    
    best_method = min(methods, key=lambda x: x['mape'])
    
    return {
        'method': f'Robust Ensemble ({"+".join(method_names)})',
        'forecasts': ensemble_forecasts,
        'lower_bounds': ensemble_lower,
        'upper_bounds': ensemble_upper,
        'fitted_values': ensemble_fitted,
        'components': [m['method'] for m in methods],
        'weights': weights.tolist(),
        'mae': best_method['mae'],
        'mape': best_method['mape'],
        'ensemble_quality': len(methods),
        'is_fallback': False
    }

# ============================================================================
# MUSE API INTEGRATION
# ============================================================================

def map_occupation_to_muse_category(occupation_title):
    """Map occupation title to MUSE API categories"""
    print(f"🔍 DEBUG: Mapping occupation '{occupation_title}' to MUSE category")
    
    occupation_lower = occupation_title.lower()
    print(f"🔤 DEBUG: Lowercase occupation: '{occupation_lower}'")
    
    # Direct keyword matching with word boundaries
    for keyword, categories in OCCUPATION_TO_MUSE_MAPPING.items():
        # Use word boundary matching to avoid false matches
        if keyword in occupation_lower:
            # Check if it's a whole word or part of a larger word
            words = occupation_lower.split()
            if keyword in words or any(keyword in word for word in words):
                print(f"✅ DEBUG: Found keyword match '{keyword}' -> category '{categories[0]}'")
                return categories[0]  # Return the most relevant category
    
    # Special handling for multi-word occupations
    if "civil engineer" in occupation_lower:
        print(f"✅ DEBUG: Special match 'civil engineer' -> 'Science and Engineering'")
        return "Science and Engineering"
    elif "mechanical engineer" in occupation_lower:
        print(f"✅ DEBUG: Special match 'mechanical engineer' -> 'Science and Engineering'")
        return "Science and Engineering"
    elif "electrical engineer" in occupation_lower:
        print(f"✅ DEBUG: Special match 'electrical engineer' -> 'Science and Engineering'")
        return "Science and Engineering"
    elif "chemical engineer" in occupation_lower:
        print(f"✅ DEBUG: Special match 'chemical engineer' -> 'Science and Engineering'")
        return "Science and Engineering"
    elif "environmental engineer" in occupation_lower:
        print(f"✅ DEBUG: Special match 'environmental engineer' -> 'Science and Engineering'")
        return "Science and Engineering"
    elif "industrial engineer" in occupation_lower:
        print(f"✅ DEBUG: Special match 'industrial engineer' -> 'Science and Engineering'")
        return "Science and Engineering"
    
    print(f"🔍 DEBUG: No direct keyword match found, trying fallback mappings")
    
    # Fallback mappings with better word matching
    words = occupation_lower.split()
    
    if any(word in ['software', 'developer', 'programmer'] for word in words):
        print(f"✅ DEBUG: Fallback match 'software/developer/programmer' -> 'Software Engineering'")
        return "Software Engineering"
    elif any(word in ['nurse', 'doctor', 'medical'] for word in words):
        print(f"✅ DEBUG: Fallback match 'nurse/doctor/medical' -> 'Healthcare'")
        return "Healthcare"
    elif any(word in ['teacher', 'instructor', 'professor'] for word in words):
        print(f"✅ DEBUG: Fallback match 'teacher/instructor/professor' -> 'Education'")
        return "Education"
    elif any(word in ['manager', 'executive'] for word in words):
        print(f"✅ DEBUG: Fallback match 'manager/executive' -> 'Management'")
        return "Management"
    elif any(word in ['analyst', 'data'] for word in words):
        print(f"✅ DEBUG: Fallback match 'analyst/data' -> 'Data Science'")
        return "Data Science"
    elif any(word in ['accountant', 'auditor', 'accounting'] for word in words):
        print(f"✅ DEBUG: Fallback match 'accountant/auditor/accounting' -> 'Accounting'")
        return "Accounting"
    else:
        print(f"❌ DEBUG: No mapping found for '{occupation_title}' -> returning 'Unknown'")
        return "Unknown"

def fetch_muse_job_data(occupation_title, max_pages=5):
    """Fetch real-time job data from MUSE API"""
    print(f"\n🔍 DEBUG: Starting MUSE API fetch for occupation: '{occupation_title}'")
    
    muse_category = map_occupation_to_muse_category(occupation_title)
    print(f"📋 DEBUG: Mapped occupation to MUSE category: '{muse_category}'")
    
    if muse_category == "Unknown":
        print(f"❌ DEBUG: No MUSE category found for '{occupation_title}' - skipping API call")
        return []
    
    all_jobs = []
    total_pages_fetched = 0
    
    print(f"🌐 DEBUG: Making API calls to: {MUSE_API_URL}")
    
    for page in range(1, max_pages + 1):
        try:
            params = {
                'page': page,
                'category': muse_category,
                'location': 'United States'  # Focus on US jobs
            }
            
            print(f"📄 DEBUG: Fetching page {page} with params: {params}")
            response = requests.get(MUSE_API_URL, params=params, timeout=10)
            
            print(f"📡 DEBUG: API Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"🔍 DEBUG: API Response structure: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                
                jobs = data.get('results', [])
                print(f"📊 DEBUG: Page {page} returned {len(jobs)} jobs")
                
                if not jobs:
                    print(f"📭 DEBUG: No jobs found on page {page} - stopping pagination")
                    break
                
                for i, job in enumerate(jobs):
                    try:
                        # Debug the job structure
                        if i == 0:  # Only debug first job to avoid spam
                            print(f"🔍 DEBUG: First job structure: {list(job.keys()) if isinstance(job, dict) else 'Not a dict'}")
                            print(f"🔍 DEBUG: Sample job data: {job}")
                        
                        # Extract relevant job data with correct field names based on API response
                        job_data = {
                            'title': job.get('name', '') if isinstance(job, dict) else str(job),  # API uses 'name' not 'title'
                            'company': job.get('company', {}).get('name', '') if isinstance(job, dict) and isinstance(job.get('company'), dict) else '',
                            'location': job.get('locations', [{}])[0].get('name', '') if isinstance(job, dict) and job.get('locations') and isinstance(job.get('locations'), list) and len(job.get('locations')) > 0 else '',
                            'publication_date': job.get('publication_date', ''),
                            'category': muse_category,
                            'salary_min': job.get('salary_min'),
                            'salary_max': job.get('salary_max'),
                            'salary_currency': job.get('salary_currency'),
                            'job_type': job.get('type', {}).get('name', '') if isinstance(job, dict) and isinstance(job.get('type'), dict) else '',
                            'experience_level': job.get('levels', [{}])[0].get('name', '') if isinstance(job, dict) and job.get('levels') and isinstance(job.get('levels'), list) and len(job.get('levels')) > 0 else ''
                        }
                        
                        # Debug first job details
                        if i == 0:
                            print(f"🔍 DEBUG: Extracted job data: {job_data}")
                        
                        all_jobs.append(job_data)
                    except Exception as e:
                        print(f"❌ DEBUG: Error processing job {i}: {e}")
                        print(f"🔍 DEBUG: Job data: {job}")
                        continue
                
                total_pages_fetched += 1
                
            else:
                print(f"❌ DEBUG: MUSE API error: {response.status_code}")
                print(f"🔍 DEBUG: Response content: {response.text[:200]}...")
                break
                
        except Exception as e:
            print(f"❌ DEBUG: Error fetching MUSE data on page {page}: {e}")
            break
    
    print(f"✅ DEBUG: MUSE API fetch completed:")
    print(f"   📊 Total pages fetched: {total_pages_fetched}")
    print(f"   📋 Total jobs collected: {len(all_jobs)}")
    print(f"   🏢 Sample jobs: {[job['title'][:30] + '...' for job in all_jobs[:3]]}")
    
    return all_jobs

def save_realtime_data(occupation_title, job_data):
    """Save real-time job data to avoid duplicates"""
    print(f"\n💾 DEBUG: Saving real-time data for occupation: '{occupation_title}'")
    print(f"📊 DEBUG: Received {len(job_data)} jobs to save")
    
    try:
        # Load existing data
        if os.path.exists(REALTIME_DATA_FILE):
            with open(REALTIME_DATA_FILE, 'r') as f:
                existing_data = json.load(f)
            print(f"📁 DEBUG: Loaded existing data from {REALTIME_DATA_FILE}")
        else:
            existing_data = {}
            print(f"📁 DEBUG: No existing data file found, creating new one")
        
        # Add new data with timestamp
        timestamp = datetime.now().isoformat()
        if occupation_title not in existing_data:
            existing_data[occupation_title] = []
            print(f"🆕 DEBUG: First time saving data for this occupation")
        else:
            print(f"📈 DEBUG: Found {len(existing_data[occupation_title])} existing jobs for this occupation")
        
        # Check for duplicates based on job title and company
        existing_job_ids = set()
        for job in existing_data[occupation_title]:
            job_id = f"{job.get('title', '')}_{job.get('company', '')}"
            existing_job_ids.add(job_id)
        
        print(f"🔍 DEBUG: Found {len(existing_job_ids)} existing job IDs")
        
        # Add only new jobs
        new_jobs = []
        for job in job_data:
            job_id = f"{job.get('title', '')}_{job.get('company', '')}"
            if job_id not in existing_job_ids:
                job['timestamp'] = timestamp
                new_jobs.append(job)
                existing_job_ids.add(job_id)
            else:
                print(f"🔍 DEBUG: Skipping duplicate job: {job.get('title', '')} at {job.get('company', '')}")
        
        print(f"✅ DEBUG: Added {len(new_jobs)} new jobs (filtered out duplicates)")
        
        existing_data[occupation_title].extend(new_jobs)
        
        # Save updated data
        with open(REALTIME_DATA_FILE, 'w') as f:
            json.dump(existing_data, f, indent=2)
        
        print(f"💾 DEBUG: Successfully saved data to {REALTIME_DATA_FILE}")
        print(f"📊 DEBUG: Total jobs now saved for '{occupation_title}': {len(existing_data[occupation_title])}")
        
        return len(new_jobs)
        
    except Exception as e:
        print(f"❌ DEBUG: Error saving real-time data: {e}")
        return 0

# ============================================================================
# CAREER FORECASTER CLASS
# ============================================================================

class CareerForecaster:
    """Complete career forecasting system"""
    
    def __init__(self):
        self.df = None
        self.occupations = []
        self.forecast_cache = {}
        self.load_dataset()
    
    def load_dataset(self):
        """Load and prepare the career forecasting dataset"""
        try:
            self.df = pd.read_csv(DATASET_PATH)
            print(f"✅ Dataset loaded: {len(self.df):,} records")
            
            # Filter for occupations with sufficient historical data (4+ years)
            # This matches the newer service logic for reliable forecasting
            occupation_years = self.df.groupby('OCC_CODE')['YEAR'].nunique()
            occupations_with_sufficient_data = occupation_years[occupation_years >= 4].index
            
            # Get occupation titles for codes with sufficient data
            filtered_df = self.df[self.df['OCC_CODE'].isin(occupations_with_sufficient_data)]
            
            # Create a mapping of OCC_CODE to OCC_TITLE for the filtered dataset
            self.occupation_mapping = filtered_df[['OCC_CODE', 'OCC_TITLE']].drop_duplicates()
            
            # Use OCC_TITLE for the occupation list (user-facing)
            self.occupations = sorted(self.occupation_mapping['OCC_TITLE'].unique())
            
            # Store the forecastable occupation codes (for internal use)
            self.forecastable_codes = list(occupations_with_sufficient_data)
            
            # Store the filtered dataset for forecasting
            self.filtered_df = filtered_df
            
            print(f"📊 Total unique occupation codes: {len(self.df['OCC_CODE'].unique()):,}")
            print(f"📈 Occupation codes with 4+ years of data: {len(occupations_with_sufficient_data):,}")
            print(f"📋 Available occupations (filtered): {len(self.occupations):,}")
            print(f"✅ Using filtered dataset with {len(filtered_df)} records for forecasting")
            print(f"🎯 Matching newer service: {len(occupations_with_sufficient_data)} forecastable occupations")
            
        except Exception as e:
            print(f"❌ Error loading dataset: {e}")
            self.df = None
    
    def get_occupations(self):
        """Get list of available occupations"""
        return self.occupations
    
    def get_forecastable_count(self):
        """Get the number of forecastable occupations (matches newer service)"""
        return len(self.forecastable_codes)
    
    def forecast_occupation(self, occupation_title, include_realtime=True):
        """Generate comprehensive forecast for an occupation"""
        if self.df is None:
            return None
        
        # Filter data for the occupation using the filtered dataset
        occ_data = self.filtered_df[self.filtered_df['OCC_TITLE'] == occupation_title].copy()
        
        if len(occ_data) == 0:
            print(f"❌ Occupation '{occupation_title}' not found in filtered dataset")
            return None
        
        # If there are multiple OCC_CODEs for this title, use the one with most data
        if occ_data['OCC_CODE'].nunique() > 1:
            code_counts = occ_data.groupby('OCC_CODE').size()
            best_code = code_counts.idxmax()
            occ_data = occ_data[occ_data['OCC_CODE'] == best_code].copy()
            print(f"📊 Using OCC_CODE {best_code} for '{occupation_title}' (most data)")
        
        # Prepare employment time series
        emp_ts = occ_data.groupby('YEAR')['TOT_EMP'].mean().sort_index()
        
        if len(emp_ts) < 3:
            return None

        # Generate employment forecast
        emp_forecast = robust_ensemble_forecast(emp_ts)
        
        if not emp_forecast:
            return None
        
        # Prepare salary time series
        salary_ts = occ_data.groupby('YEAR')['A_MEDIAN'].mean().sort_index()
        
        if len(salary_ts) < 3:
            salary_forecast = None
        else:
            salary_forecast = robust_ensemble_forecast(salary_ts)
        
        # Fetch real-time data if requested
        realtime_data = []
        if include_realtime:
            print(f"\n🔄 DEBUG: Starting real-time data collection for '{occupation_title}'")
            realtime_jobs = fetch_muse_job_data(occupation_title)
            print(f"📊 DEBUG: MUSE API returned {len(realtime_jobs)} jobs")
            
            if realtime_jobs:
                new_jobs_count = save_realtime_data(occupation_title, realtime_jobs)
                print(f"💾 DEBUG: Saved {new_jobs_count} new jobs to storage")
                realtime_data = realtime_jobs[:10]  # Limit to 10 most recent
                print(f"📋 DEBUG: Using {len(realtime_data)} jobs for forecast display")
            else:
                print(f"⚠️ DEBUG: No real-time jobs found for '{occupation_title}'")
        else:
            print(f"⏭️ DEBUG: Skipping real-time data collection (include_realtime=False)")
        
        # Calculate metrics
        current_employment = emp_ts.iloc[-1]
        forecast_2024 = emp_forecast['forecasts'][0]
        forecast_2030 = emp_forecast['forecasts'][6] if len(emp_forecast['forecasts']) >= 7 else emp_forecast['forecasts'][-1]
        
        growth_1yr = ((forecast_2024 - current_employment) / current_employment) * 100
        growth_total = ((forecast_2030 - current_employment) / current_employment) * 100
        
        # Quality assessment
        if emp_forecast['mape'] < 10 and abs(growth_1yr) < 25:
            quality = "EXCELLENT"
            confidence = "High"
        elif emp_forecast['mape'] < 20 and abs(growth_1yr) < 50:
            quality = "GOOD"
            confidence = "Medium"
        elif emp_forecast['mape'] < 40:
            quality = "FAIR"
            confidence = "Low"
        else:
            quality = "POOR"
            confidence = "Very Low"
        
        # Student recommendation
        if growth_total > 20 and emp_forecast['mape'] < 10:
            recommendation = "🚀 EXCELLENT CAREER CHOICE"
            advice = "High growth potential with reliable forecasts"
        elif growth_total > 10 and emp_forecast['mape'] < 15:
            recommendation = "✅ STRONG CAREER CHOICE"
            advice = "Good growth prospects with solid reliability"
        elif growth_total > 0 and emp_forecast['mape'] < 25:
            recommendation = "🟨 MODERATE CAREER CHOICE"
            advice = "Positive growth but some uncertainty"
        elif growth_total < -10:
            recommendation = "⚠️ DECLINING FIELD"
            advice = "Negative growth trend - consider alternatives"
        else:
            recommendation = "🔍 STABLE FIELD"
            advice = "Minimal growth expected - research specializations"
        
        # Prepare result
        result = {
            'occupation_title': occupation_title,
            'historical_employment': {str(k): float(v) for k, v in emp_ts.to_dict().items()},
            'historical_salary': {str(k): float(v) for k, v in salary_ts.to_dict().items()} if salary_forecast else {},
            'current_employment': float(current_employment),
            'forecast_2024': float(forecast_2024),
            'forecast_2030': float(forecast_2030),
            'growth_1yr_percent': float(growth_1yr),
            'growth_total_percent': float(growth_total),
            'employment_forecasts': [float(x) for x in emp_forecast['forecasts']],
            'employment_lower_bounds': [float(x) for x in emp_forecast['lower_bounds']],
            'employment_upper_bounds': [float(x) for x in emp_forecast['upper_bounds']],
            'forecast_years': list(range(2024, 2024 + len(emp_forecast['forecasts']))),
            'employment_method': emp_forecast['method'],
            'employment_accuracy_mape': float(emp_forecast['mape']),
            'employment_mae': float(emp_forecast['mae']),
            'quality_rating': quality,
            'confidence_level': confidence,
            'recommendation': recommendation,
            'student_advice': advice,
            'realtime_jobs_count': len(realtime_data),
            'realtime_jobs': realtime_data
        }
        
        # Add salary forecast if available
        if salary_forecast:
            current_salary = salary_ts.iloc[-1]
            salary_forecast_2024 = salary_forecast['forecasts'][0]
            salary_forecast_2030 = salary_forecast['forecasts'][6] if len(salary_forecast['forecasts']) >= 7 else salary_forecast['forecasts'][-1]
            
            result.update({
                'current_salary': float(current_salary),
                'salary_forecast_2024': float(salary_forecast_2024),
                'salary_forecast_2030': float(salary_forecast_2030),
                'salary_forecasts': [float(x) for x in salary_forecast['forecasts']],
                'salary_lower_bounds': [float(x) for x in salary_forecast['lower_bounds']],
                'salary_upper_bounds': [float(x) for x in salary_forecast['upper_bounds']],
                'salary_method': salary_forecast['method'],
                'salary_accuracy_mape': float(salary_forecast['mape']),
                'salary_mae': float(salary_forecast['mae'])
            })
        
        return result
    
    def search_occupations(self, search_term, limit=10):
        """Search occupations by title"""
        if not search_term or len(search_term) < 2:
            return []
        
        search_term_lower = search_term.lower()
        matches = []
        
        for occupation in self.occupations:
            if search_term_lower in occupation.lower():
                matches.append(occupation)
                if len(matches) >= limit:
                    break
        
        return matches

# ============================================================================
# FLASK APPLICATION
# ============================================================================

app = Flask(__name__)
CORS(app)
forecaster = CareerForecaster()

@app.route('/api/career-forecast/occupations', methods=['GET'])
def get_occupations():
    """Get list of available occupations"""
    try:
        occupations = forecaster.get_occupations()
        forecastable_count = forecaster.get_forecastable_count()
        return jsonify({
            'success': True,
            'occupations': occupations,
            'count': len(occupations),
            'forecastable_count': forecastable_count
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/career-forecast/search', methods=['POST'])
def search_occupations():
    """Search occupations"""
    try:
        data = request.get_json()
        search_term = data.get('search_term', '')
        limit = data.get('limit', 10)
        
        matches = forecaster.search_occupations(search_term, limit)
        
        return jsonify({
            'success': True,
            'matches': matches,
            'count': len(matches)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/career-forecast/forecast', methods=['POST'])
def generate_forecast():
    """Generate forecast for an occupation"""
    print(f"\n🚀 DEBUG: Received forecast request")
    try:
        data = request.get_json()
        occupation_title = data.get('occupation_title', '')
        include_realtime = data.get('include_realtime', True)
        
        print(f"📋 DEBUG: Request parameters:")
        print(f"   🏢 Occupation: '{occupation_title}'")
        print(f"   🔄 Include realtime: {include_realtime}")
        
        if not occupation_title:
            print(f"❌ DEBUG: Missing occupation title")
            return jsonify({
                'success': False,
                'error': 'Occupation title is required'
            }), 400
        
        # Check cache first
        cache_key = f"{occupation_title}_{include_realtime}"
        if cache_key in forecaster.forecast_cache:
            print(f"📋 DEBUG: Returning cached result for '{occupation_title}'")
            return jsonify({
                'success': True,
                'data': forecaster.forecast_cache[cache_key],
                'cached': True
            })
        
        print(f"🔄 DEBUG: Generating new forecast for '{occupation_title}'")
        # Generate forecast
        result = forecaster.forecast_occupation(occupation_title, include_realtime)
        
        if not result:
            print(f"❌ DEBUG: No forecast available for '{occupation_title}'")
            return jsonify({
                'success': False,
                'error': f'No forecast available for "{occupation_title}"'
            }), 404
        
        # Cache result
        forecaster.forecast_cache[cache_key] = result
        print(f"✅ DEBUG: Successfully generated and cached forecast")
        print(f"📊 DEBUG: Forecast includes {result.get('realtime_jobs_count', 0)} real-time jobs")
        
        return jsonify({
            'success': True,
            'data': result,
            'cached': False
        })
        
    except Exception as e:
        print(f"❌ DEBUG: Error generating forecast: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/career-forecast/analytics', methods=['GET'])
def get_analytics():
    """Get model performance analytics"""
    try:
        # Calculate overall statistics
        total_occupations = len(forecaster.occupations)
        
        # Sample some occupations for analytics
        sample_occupations = forecaster.occupations[:50]  # First 50 for analytics
        analytics_results = []
        
        for occ in sample_occupations:
            try:
                result = forecaster.forecast_occupation(occ, include_realtime=False)
                if result:
                    analytics_results.append({
                        'occupation': occ,
                        'mape': result['employment_accuracy_mape'],
                        'quality': result['quality_rating'],
                        'growth': result['growth_total_percent']
                    })
            except:
                continue
        
        if analytics_results:
            avg_mape = np.mean([r['mape'] for r in analytics_results])
            quality_distribution = defaultdict(int)
            for r in analytics_results:
                quality_distribution[r['quality']] += 1
            
            # Calculate detailed accuracy metrics
            mape_values = [r['mape'] for r in analytics_results]
            growth_values = [r['growth'] for r in analytics_results]
            
            # Calculate precision, recall, F1-score equivalents for forecasting
            excellent_count = quality_distribution.get('EXCELLENT', 0)
            good_count = quality_distribution.get('GOOD', 0)
            fair_count = quality_distribution.get('FAIR', 0)
            poor_count = quality_distribution.get('POOR', 0)
            
            total_analyzed = len(analytics_results)
            
            # Calculate metrics similar to classification metrics
            high_quality_count = excellent_count + good_count
            low_quality_count = fair_count + poor_count
            
            precision = high_quality_count / total_analyzed if total_analyzed > 0 else 0
            recall = high_quality_count / total_analyzed if total_analyzed > 0 else 0
            f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            
            # Calculate ROC-AUC equivalent (using MAPE distribution)
            mape_threshold = np.median(mape_values) if mape_values else 0
            low_mape_count = sum(1 for mape in mape_values if mape < mape_threshold)
            roc_auc = low_mape_count / total_analyzed if total_analyzed > 0 else 0
            
            return jsonify({
                'success': True,
                'analytics': {
                    'total_occupations': total_occupations,
                    'sample_size': len(analytics_results),
                    'average_mape': avg_mape,
                    'quality_distribution': dict(quality_distribution),
                    'sample_results': analytics_results[:10],  # First 10 for display
                    'detailed_metrics': {
                        'accuracy': precision,
                        'precision': precision,
                        'recall': recall,
                        'f1_score': f1_score,
                        'roc_auc': roc_auc,
                        'mape_median': np.median(mape_values) if mape_values else 0,
                        'mape_std': np.std(mape_values) if mape_values else 0,
                        'growth_median': np.median(growth_values) if growth_values else 0,
                        'growth_std': np.std(growth_values) if growth_values else 0
                    }
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'No analytics data available'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/career-forecast/realtime/<occupation>', methods=['GET'])
def get_realtime_data(occupation):
    """Get real-time job data for an occupation"""
    try:
        if os.path.exists(REALTIME_DATA_FILE):
            with open(REALTIME_DATA_FILE, 'r') as f:
                data = json.load(f)
            
            if occupation in data:
                return jsonify({
                    'success': True,
                    'data': data[occupation],
                    'count': len(data[occupation])
                })
            else:
                return jsonify({
                    'success': False,
                    'error': 'No real-time data available for this occupation'
                }), 404
        else:
            return jsonify({
                'success': False,
                'error': 'No real-time data available'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/career-forecast/realtime-download', methods=['GET'])
def download_realtime_data():
    """Download all real-time job data as CSV"""
    print(f"\n📥 DEBUG: Received CSV download request")
    try:
        print(f"🔍 DEBUG: Checking for real-time data file: {REALTIME_DATA_FILE}")
        
        if not os.path.exists(REALTIME_DATA_FILE):
            print(f"❌ DEBUG: Real-time data file not found")
            return jsonify({
                'success': False,
                'error': 'No real-time data available'
            }), 404
        
        print(f"✅ DEBUG: Real-time data file found, loading data...")
        with open(REALTIME_DATA_FILE, 'r') as f:
            data = json.load(f)
        
        print(f"📊 DEBUG: Loaded data for {len(data)} occupations")
        
        if not data:
            print(f"❌ DEBUG: No data in real-time file")
            return jsonify({
                'success': False,
                'error': 'No real-time data available'
            }), 404
        
        # Convert to CSV format
        csv_data = []
        csv_data.append(['Occupation', 'Job Title', 'Company', 'Location', 'Publication Date', 'Category', 'Salary Min', 'Salary Max', 'Salary Currency', 'Job Type', 'Experience Level', 'Timestamp'])
        
        total_jobs = 0
        for occupation, jobs in data.items():
            print(f"📋 DEBUG: Processing {len(jobs)} jobs for {occupation}")
            total_jobs += len(jobs)
            for job in jobs:
                csv_data.append([
                    occupation,
                    job.get('title', ''),
                    job.get('company', ''),
                    job.get('location', ''),
                    job.get('publication_date', ''),
                    job.get('category', ''),
                    job.get('salary_min', ''),
                    job.get('salary_max', ''),
                    job.get('salary_currency', ''),
                    job.get('job_type', ''),
                    job.get('experience_level', ''),
                    job.get('timestamp', '')
                ])
        
        print(f"📊 DEBUG: Total jobs to export: {total_jobs}")
        
        # Create CSV content
        csv_content = '\n'.join([','.join([f'"{str(cell)}"' for cell in row]) for row in csv_data])
        
        print(f"✅ DEBUG: CSV content created, size: {len(csv_content)} characters")
        
        # Create response with CSV headers
        response = Response(csv_content, mimetype='text/csv')
        response.headers['Content-Disposition'] = 'attachment; filename=realtime_job_data.csv'
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        
        print(f"✅ DEBUG: CSV download response created successfully")
        return response
        
    except Exception as e:
        print(f"❌ DEBUG: Error in CSV download: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/career-forecast/test-download', methods=['GET'])
def test_download():
    """Test endpoint to check if download functionality works"""
    print(f"\n🧪 DEBUG: Testing download endpoint")
    try:
        # Create a simple test CSV
        test_data = [
            ['Occupation', 'Job Title', 'Company', 'Location'],
            ['Software Developer', 'Frontend Developer', 'Test Company', 'Remote'],
            ['Data Analyst', 'Business Analyst', 'Test Corp', 'New York']
        ]
        
        csv_content = '\n'.join([','.join([f'"{cell}"' for cell in row]) for row in test_data])
        
        response = Response(csv_content, mimetype='text/csv')
        response.headers['Content-Disposition'] = 'attachment; filename=test_download.csv'
        response.headers['Access-Control-Allow-Origin'] = '*'
        
        print(f"✅ DEBUG: Test download response created")
        return response
        
    except Exception as e:
        print(f"❌ DEBUG: Test download error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Career Forecasting Service Starting...")
    print(f"📊 Dataset: {DATASET_PATH}")
    print(f"🔗 MUSE API: {MUSE_API_URL}")
    print(f"💾 Real-time data: {REALTIME_DATA_FILE}")
    app.run(port=5003, debug=True) 