import React, { useState } from 'react';
import { User, GraduationCap, DollarSign, BookOpen, Users, Shield, Building } from 'lucide-react';

interface StudentFormData {
  name: string;
  email: string;
  gpa: string;
  family_income_level: string;
  academic_interests: string;
  fulltime_study: string;
  international_student: string;
  tuition_budget: string;
  completion_confidence: string;
  preferred_class_size: string;
  financial_aid_eligible: string;
  prefer_private: string;
  first_generation: string;
}

interface StudentFormProps {
  onSubmit: (data: StudentFormData) => void;
  isLoading?: boolean;
}

const StudentForm: React.FC<StudentFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    gpa: '',
    family_income_level: '',
    academic_interests: '',
    fulltime_study: 'yes',
    international_student: 'no',
    tuition_budget: '',
    completion_confidence: '',
    preferred_class_size: '',
    financial_aid_eligible: 'yes',
    prefer_private: 'no',
    first_generation: 'no'
  });

  const [errors, setErrors] = useState<Partial<StudentFormData>>({});

  const academicInterestOptions = [
    'Engineering', 'Computer Science', 'Business', 'Finance', 'Accounting',
    'Medicine', 'Pre-Med', 'Law', 'Pre-Law', 'Arts', 'Design', 'Music',
    'Psychology', 'Education', 'Nursing', 'Social Work', 'Criminal Justice',
    'Hospitality', 'Tourism', 'Culinary Arts', 'Agriculture', 'Environmental Science',
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Political Science',
    'Journalism', 'Communications', 'Marketing', 'Management', 'Human Resources'
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<StudentFormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.gpa) newErrors.gpa = 'GPA is required';
    if (formData.gpa && (parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 4.0)) {
      newErrors.gpa = 'GPA must be between 0 and 4.0';
    }
    if (!formData.family_income_level) newErrors.family_income_level = 'Family income level is required';
    if (!formData.academic_interests.trim()) newErrors.academic_interests = 'Please select one academic interest';
    if (!formData.tuition_budget) newErrors.tuition_budget = 'Tuition budget is required';
    if (!formData.completion_confidence) newErrors.completion_confidence = 'Completion confidence is required';
    if (!formData.preferred_class_size) newErrors.preferred_class_size = 'Preferred class size is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInterestToggle = (interest: string) => {
    // Allow only one selection - if the interest is already selected, deselect it
    // If a different interest is selected, replace it with the new one
    const currentInterest = formData.academic_interests.trim();
    const newInterest = currentInterest === interest ? '' : interest;
    setFormData(prev => ({ ...prev, academic_interests: newInterest }));
  };

  return (
    <div className="bg-dark-900 rounded-lg shadow-lg p-6 max-w-4xl mx-auto border border-dark-700">
      <div className="text-center mb-6">
        <User className="h-12 w-12 mx-auto mb-4 text-neon-pink" />
        <h2 className="text-2xl font-bold text-white">Student Profile</h2>
        <p className="text-gray-300">Please provide your information for personalized recommendations</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent bg-dark-800 text-white ${
                errors.name ? 'border-neon-red' : 'border-dark-600'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="text-neon-red text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent bg-dark-800 text-white ${
                errors.email ? 'border-neon-red' : 'border-dark-600'
              }`}
              placeholder="Enter your email address"
            />
            {errors.email && <p className="text-neon-red text-sm mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Academic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <GraduationCap className="inline h-4 w-4 mr-1" />
              GPA (0.0 - 4.0) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="4"
              value={formData.gpa}
              onChange={(e) => setFormData(prev => ({ ...prev, gpa: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent bg-dark-800 text-white ${
                errors.gpa ? 'border-neon-red' : 'border-dark-600'
              }`}
              placeholder="e.g., 3.5"
            />
            {errors.gpa && <p className="text-neon-red text-sm mt-1">{errors.gpa}</p>}
          </div>


        </div>

        {/* Financial Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Family Income Level *
            </label>
            <select
              value={formData.family_income_level}
              onChange={(e) => setFormData(prev => ({ ...prev, family_income_level: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent bg-dark-800 text-white ${
                errors.family_income_level ? 'border-neon-red' : 'border-dark-600'
              }`}
            >
              <option value="">Select income level</option>
              <option value="low">Low</option>
              <option value="Under $30,000">Under $30,000</option>
              <option value="$30,000-$50,000">$30,000-$50,000</option>
              <option value="$50,000-$100,000">$50,000-$100,000</option>
              <option value="$100,000+">$100,000+</option>
            </select>
            {errors.family_income_level && <p className="text-neon-red text-sm mt-1">{errors.family_income_level}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <DollarSign className="inline h-4 w-4 mr-1" />
              Tuition Budget *
            </label>
            <select
              value={formData.tuition_budget}
              onChange={(e) => setFormData(prev => ({ ...prev, tuition_budget: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent bg-dark-800 text-white ${
                errors.tuition_budget ? 'border-neon-red' : 'border-dark-600'
              }`}
            >
              <option value="">Select budget range</option>
              <option value="15000">Under $15,000</option>
              <option value="25000">$15,000-$25,000</option>
              <option value="40000">$25,000-$40,000</option>
              <option value="60000">$40,000-$60,000</option>
              <option value="70000">$60,000+</option>
            </select>
            {errors.tuition_budget && <p className="text-neon-red text-sm mt-1">{errors.tuition_budget}</p>}
          </div>
        </div>

        {/* Academic Interests */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            <BookOpen className="inline h-4 w-4 mr-1" />
            Academic Interests * (Select one)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-dark-600 rounded-lg p-3 bg-dark-800">
            {academicInterestOptions.map((interest) => (
              <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.academic_interests.trim() === interest}
                  onChange={() => handleInterestToggle(interest)}
                  className="rounded border-dark-600 text-neon-pink focus:ring-neon-pink bg-dark-800"
                />
                <span className="text-sm text-white">{interest}</span>
              </label>
            ))}
          </div>
          {errors.academic_interests && <p className="text-neon-red text-sm mt-1">{errors.academic_interests}</p>}
        </div>

        {/* Study Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Preferred Class Size *
            </label>
            <select
              value={formData.preferred_class_size}
              onChange={(e) => setFormData(prev => ({ ...prev, preferred_class_size: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent bg-dark-800 text-white ${
                errors.preferred_class_size ? 'border-neon-red' : 'border-dark-600'
              }`}
            >
              <option value="">Select class size</option>
              <option value="small">Small (under 20 students)</option>
              <option value="medium">Medium (20-50 students)</option>
              <option value="large">Large (over 50 students)</option>
            </select>
            {errors.preferred_class_size && <p className="text-neon-red text-sm mt-1">{errors.preferred_class_size}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Shield className="inline h-4 w-4 mr-1" />
              Completion Confidence *
            </label>
            <select
              value={formData.completion_confidence}
              onChange={(e) => setFormData(prev => ({ ...prev, completion_confidence: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent bg-dark-800 text-white ${
                errors.completion_confidence ? 'border-neon-red' : 'border-dark-600'
              }`}
            >
              <option value="">Select confidence level</option>
              <option value="0.3">Low (30%)</option>
              <option value="0.5">Medium (50%)</option>
              <option value="0.7">High (70%)</option>
              <option value="0.9">Very High (90%)</option>
              <option value="0.95">Excellent (95%)</option>
            </select>
            {errors.completion_confidence && <p className="text-neon-red text-sm mt-1">{errors.completion_confidence}</p>}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.fulltime_study === 'yes'}
                onChange={(e) => setFormData(prev => ({ ...prev, fulltime_study: e.target.checked ? 'yes' : 'no' }))}
                className="rounded border-dark-600 text-neon-pink focus:ring-neon-pink bg-dark-800"
              />
              <span className="text-sm text-white">Full-time study</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.international_student === 'yes'}
                onChange={(e) => setFormData(prev => ({ ...prev, international_student: e.target.checked ? 'yes' : 'no' }))}
                className="rounded border-dark-600 text-neon-pink focus:ring-neon-pink bg-dark-800"
              />
              <span className="text-sm text-white">International student</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.first_generation === 'yes'}
                onChange={(e) => setFormData(prev => ({ ...prev, first_generation: e.target.checked ? 'yes' : 'no' }))}
                className="rounded border-dark-600 text-neon-pink focus:ring-neon-pink bg-dark-800"
              />
              <span className="text-sm text-white">First-generation college student</span>
            </label>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.financial_aid_eligible === 'yes'}
                onChange={(e) => setFormData(prev => ({ ...prev, financial_aid_eligible: e.target.checked ? 'yes' : 'no' }))}
                className="rounded border-dark-600 text-neon-pink focus:ring-neon-pink bg-dark-800"
              />
              <span className="text-sm text-white">Eligible for financial aid</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.prefer_private === 'yes'}
                onChange={(e) => setFormData(prev => ({ ...prev, prefer_private: e.target.checked ? 'yes' : 'no' }))}
                className="rounded border-dark-600 text-neon-pink focus:ring-neon-pink bg-dark-800"
              />
              <span className="text-sm text-white">Prefer private institutions</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-neon-pink text-white px-8 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            <Building className="h-5 w-5" />
            <span>{isLoading ? 'Processing...' : 'Get Personalized Recommendations'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentForm; 