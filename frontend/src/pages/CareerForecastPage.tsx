import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';

interface ForecastData {
  occupation_title: string;
  historical_employment: { [key: string]: number };
  historical_salary: { [key: string]: number };
  current_employment: number;
  forecast_2024: number;
  forecast_2030: number;
  growth_1yr_percent: number;
  growth_total_percent: number;
  employment_forecasts: number[];
  employment_lower_bounds: number[];
  employment_upper_bounds: number[];
  forecast_years: number[];
  employment_method: string;
  employment_accuracy_mape: number;
  employment_mae: number;
  quality_rating: string;
  confidence_level: string;
  recommendation: string;
  student_advice: string;
  realtime_jobs_count: number;
  realtime_jobs: any[];
  current_salary?: number;
  salary_forecast_2024?: number;
  salary_forecast_2030?: number;
  salary_forecasts?: number[];
  salary_lower_bounds?: number[];
  salary_upper_bounds?: number[];
  salary_method?: string;
  salary_accuracy_mape?: number;
  salary_mae?: number;
}

interface Occupation {
  occupation: string;
}

const CareerForecastPage = () => {
  const [occupations, setOccupations] = useState<string[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState('');
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initial, setInitial] = useState(true);
  const [searchTerm1, setSearchTerm1] = useState('');
  const [searchTerm2, setSearchTerm2] = useState('');
  const [searchResults1, setSearchResults1] = useState<string[]>([]);
  const [searchResults2, setSearchResults2] = useState<string[]>([]);
  const [showSearchResults1, setShowSearchResults1] = useState(false);
  const [showSearchResults2, setShowSearchResults2] = useState(false);
  const [showDropdown1, setShowDropdown1] = useState(false);
  const [showDropdown2, setShowDropdown2] = useState(false);
  const [loadingOccupations, setLoadingOccupations] = useState(true);
  const [currentPage1, setCurrentPage1] = useState(0);
  const [currentPage2, setCurrentPage2] = useState(0);
  const [dropdownSearchTerm1, setDropdownSearchTerm1] = useState('');
  const [dropdownSearchTerm2, setDropdownSearchTerm2] = useState('');
  const [lastKeyPressTime1, setLastKeyPressTime1] = useState(0);
  const [lastKeyPressTime2, setLastKeyPressTime2] = useState(0);
  const dropdownRef1 = useRef<HTMLDivElement>(null);
  const dropdownRef2 = useRef<HTMLDivElement>(null);
  const dropdownListRef1 = useRef<HTMLDivElement>(null);
  const dropdownListRef2 = useRef<HTMLDivElement>(null);
  const [expandedSchools2, setExpandedSchools2] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'forecast' | 'historical'>('forecast');

  // Final targeted mapping based on Sunway University's actual programs and realistic career paths
  // Only includes occupations that exist in the forecasting dataset
  const schoolMapping = {
    'School of Engineering and Technology': [
      // Core engineering disciplines offered at Sunway
      'Civil Engineers', 'Electrical Engineers', 'Mechanical Engineers', 
      'Chemical Engineers', 'Environmental Engineers', 'Industrial Engineers',
      'Computer Hardware Engineers', 'Computer Systems Analysts',
      'Network and Computer Systems Administrators', 'Computer Network Architects',
      'Information Security Analysts', 'Computer Programmers', 
      'Computer Support Specialists', 'Drafters', 'Surveyors', 'Construction Managers',
      'Software and Web Developers, Programmers, and Testers',
      'Computer and Information Research Scientists', 'Computer Network Support Specialists',
      'Computer User Support Specialists', 'Database and Network Administrators and Architects',
      // Related technical roles attainable with engineering degrees
      'Industrial Engineering Technicians', 'Architectural and Civil Drafters',
      'Mechanical Engineering Technicians', 'Surveying and Mapping Technicians',
      'Computer and Information Analysts', 'Computer Occupations, All Other',
      'Computer, Automated Teller, and Office Machine Repairers'
    ],
    'School of Medical and Life Sciences': [
      // Core medical and life sciences roles
      'Registered Nurses', 'Nurse Practitioners', 'Nurse Anesthetists', 'Nurse Midwives',
      'Physician Assistants', 'Medical Scientists', 'Biological Scientists',
      'Dietitians and Nutritionists', 'Speech-Language Pathologists',
      'Health Technologists and Technicians', 'Medical Records Specialists',
      'Medical and Health Services Managers',
      'Health Specialties Teachers, Postsecondary', 'Nursing Instructors and Teachers, Postsecondary',
      'Life Sciences Teachers, Postsecondary', 'Biological Science Teachers, Postsecondary',
      'Physical Sciences Teachers, Postsecondary', 'Chemistry Teachers, Postsecondary',
      'Environmental Science Teachers, Postsecondary', 'Physics Teachers, Postsecondary',
      'Pharmacy Technicians', 'Pharmacists', 'Dental Hygienists', 'Dental Assistants', 
      'Optometrists', 'Occupational Therapists', 'Physical Therapists', 'Respiratory Therapists',
      // Related roles attainable with medical/life sciences degrees
      'Biological Technicians', 'Chemical Technicians',
      'Life, Physical, and Social Science Technicians', 'Healthcare Social Workers',
      'Medical Secretaries and Administrative Assistants'
    ],
    'School of Arts': [
      // Core arts and design roles
      'Graphic Designers', 'Multimedia Artists and Animators', 'Interior Designers',
      'Art Directors', 'Commercial and Industrial Designers', 'Set and Exhibit Designers',
      'Actors', 'Producers and Directors', 'Film and Video Editors',
      'Sound Engineering Technicians', 'Broadcast Technicians',
      'Writers and Authors', 'Editors', 'Technical Writers', 'Artists and Related Workers',
      'Designers', 'Broadcast Announcers and Radio Disc Jockeys',
      'Advertising Sales Agents', 'Public Relations Specialists', 'Marketing Managers',
      'Communications Teachers, Postsecondary',
      'Arts, Communications, and Humanities Teachers, Postsecondary',
      // Related roles attainable with arts degrees
      'Photographers', 'Makeup Artists, Theatrical and Performance', 
      'Special Effects Artists and Animators', 'Music Directors and Composers',
      'Advertising and Promotions Managers', 'Marketing and Sales Managers'
    ],
    'School of Hospitality and Tourism Management': [
      // Core hospitality and tourism roles
      'Lodging Managers', 'Food Service Managers', 'Gaming Managers',
      'Entertainment and Recreation Managers', 'Gambling Managers',
      'Hotel, Motel, and Resort Desk Clerks', 'Cooks and Food Preparation Workers',
      'Waiters and Waitresses', 'Food and Beverage Serving Workers',
      'Hosts and Hostesses, Restaurant, Lounge, and Coffee Shop',
      'Gaming Services Workers', 'Recreation and Fitness Workers',
      'Cooks, Fast Food', 'Cooks, Institution and Cafeteria', 'Cooks, Restaurant',
      'Food Preparation Workers', 'Fast Food and Counter Workers',
      'Food Servers, Nonrestaurant', 'Gambling Services Workers',
      'Gaming and Sports Book Writers and Runners', 'Fitness Trainers and Aerobics Instructors',
      'Exercise Trainers and Group Fitness Instructors', 'Meeting, Convention, and Event Planners',
      'Travel Agents', 'Concierges', 'Baggage Porters and Bellhops',
      // Related roles attainable with hospitality degrees
      'Chefs and Head Cooks', 'Tour and Travel Guides', 'Recreation Workers',
      'Amusement and Recreation Attendants'
    ],
    'School of Mathematical Sciences': [
      // Core mathematical sciences roles
      'Mathematicians', 'Statisticians', 'Operations Research Analysts',
      'Computer and Information Research Scientists', 'Computer Systems Analysts',
      'Information Security Analysts', 'Computer and Information Analysts',
      'Computer Programmers', 'Software and Web Developers, Programmers, and Testers',
      'Computer Network Architects', 'Network and Computer Systems Administrators',
      'Database and Network Administrators and Architects', 'Computer Support Specialists',
      'Computer Network Support Specialists', 'Computer User Support Specialists',
      'Computer Science Teachers, Postsecondary', 'Mathematical Science Teachers, Postsecondary',
      'Actuaries', 'Financial Analysts', 'Economists', 'Survey Researchers',
      'Statistical Assistants',
      // Related roles attainable with mathematical sciences degrees
      'Budget Analysts', 'Credit Analysts', 'Financial Analysts and Advisors',
      'Market Research Analysts and Marketing Specialists', 'Surveying and Mapping Technicians',
      'Mathematical Science Occupations', 'Computer and Mathematical Occupations'
    ],
    'Sunway Business School': [
      // Core business roles
      'Accountants and Auditors', 'Budget Analysts', 'Credit Analysts',
      'Financial Analysts and Advisors', 'Financial Analysts', 'Personal Financial Advisors',
      'Insurance Underwriters', 'Financial Examiners', 'Credit Counselors and Loan Officers',
      'Management Analysts', 'Compensation, Benefits, and Job Analysis Specialists',
      'Market Research Analysts and Marketing Specialists', 'Business Operations Specialists',
      'General and Operations Managers', 'Administrative Services Managers',
      'Financial Managers', 'Human Resources Managers', 'Training and Development Managers',
      'Advertising, Marketing, Promotions, Public Relations, and Sales Managers',
      'Marketing Managers', 'Sales Managers', 'Public Relations and Fundraising Managers',
      'Operations Specialties Managers', 'Computer and Information Systems Managers',
      'Industrial Production Managers', 'Purchasing Managers',
      'Transportation, Storage, and Distribution Managers', 'Compensation and Benefits Managers',
      'Property, Real Estate, and Community Association Managers', 'Social and Community Service Managers',
      'Business Teachers, Postsecondary', 'Financial Specialists', 'Management Occupations',
      // Related administrative and office roles attainable with business degrees
      'Data Entry Keyers', 'Office Clerks, General', 'Secretaries and Administrative Assistants',
      'Receptionists and Information Clerks', 'Bookkeeping, Accounting, and Auditing Clerks',
      'Payroll and Timekeeping Clerks', 'Billing and Posting Clerks', 'Cost Estimators',
      'Appraisers and Assessors of Real Estate', 'Real Estate Brokers and Sales Agents',
      'Sales Representatives, Wholesale and Manufacturing', 'Parts Salespersons', 
      'Counter and Rental Clerks', 'Executive Secretaries and Executive Administrative Assistants',
      'Human Resources Specialists', 'Human Resources Assistants, Except Payroll and Timekeeping',
      'Insurance Sales Agents', 'Loan Officers', 'Credit Authorizers, Checkers, and Clerks',
      'Procurement Clerks', 'Production, Planning, and Expediting Clerks', 
      'Shipping, Receiving, and Inventory Clerks'
    ],
    'School of American Education (in Partnership With Arizona State University)': [
      // Core computer science and communications roles
      'Computer Hardware Engineers', 'Computer Systems Analysts',
      'Information Security Analysts', 'Computer Programmers',
      'Computer Network Architects', 'Network and Computer Systems Administrators',
      'Computer Support Specialists', 'Computer and Information Research Scientists',
      'Computer Science Teachers, Postsecondary', 'Writers and Editors',
      'Technical Writers', 'Writers and Authors', 'Editors', 'News Analysts, Reporters and Journalists',
      'Broadcast Announcers and Radio Disc Jockeys', 'Public Relations Specialists',
      'Advertising Sales Agents', 'Marketing Managers',
      'Public Relations and Fundraising Managers', 'Communications Teachers, Postsecondary',
      'Arts, Communications, and Humanities Teachers, Postsecondary', 'Psychologists',
      'Psychology Teachers, Postsecondary', 'Social Workers', 'Counselors',
      'Social and Community Service Managers',
      // Related roles attainable with these degrees
      'Computer and Information Analysts', 'Computer User Support Specialists',
      'Computer Network Support Specialists', 'Database and Network Administrators and Architects',
      'Software and Web Developers, Programmers, and Testers', 'Computer Occupations, All Other',
      'Community and Social Service Specialists, All Other', 'Social and Human Service Assistants',
      'Mental Health and Substance Abuse Social Workers', 'Healthcare Social Workers',
      'Child, Family, and School Social Workers', 'Social Workers, All Other'
    ],
    'School of Education': [
      // Core education roles
      'Education Teachers, Postsecondary', 'Library Science Teachers, Postsecondary',
      'Preschool, Elementary, Middle, Secondary, and Special Education Teachers',
      'Education Administrators', 'Teacher Assistants',
      'Self-Enrichment Education Teachers', 'Education Administrators, Preschool and Childcare Center/Program',
      'Education Administrators, Elementary and Secondary School', 'Education Administrators, Postsecondary',
      'Preschool Teachers, Except Special Education', 'Kindergarten Teachers, Except Special Education',
      'Elementary School Teachers, Except Special Education', 'Middle School Teachers, Except Special and Career/Technical Education',
      'Secondary School Teachers, Except Special and Career/Technical Education', 'Special Education Teachers',
      'Adult Basic Education, Adult Secondary Education, and English as a Second Language Instructors',
      'Postsecondary Teachers', 'Librarians', 'Library Technicians', 'Instructional Coordinators',
      'Educational, Guidance, School, and Vocational Counselors',
      // Related roles attainable with education degrees
      'Substitute Teachers, Short-Term', 'Miscellaneous Teachers and Instructors',
      'Teaching Assistants, Except Postsecondary', 'Teaching Assistants, Postsecondary',
      'Librarians and Media Collections Specialists', 'Library Assistants, Clerical',
      'Educational, Guidance, and Career Counselors and Advisors',
      'Adult Basic and Secondary Education and Literacy Teachers and Instructors'
    ],
    'Centre For English Language Studies (CELS)': [
      // Core language and communication roles
      'English Language and Literature Teachers, Postsecondary', 'Foreign Language and Literature Teachers, Postsecondary',
      'Interpreters and Translators', 'Writers and Editors', 'Technical Writers', 'Writers and Authors',
      'Adult Basic Education, Adult Secondary Education, and English as a Second Language Instructors',
      'Communications Teachers, Postsecondary', 'Arts, Communications, and Humanities Teachers, Postsecondary',
      'News Analysts, Reporters and Journalists', 'Editors', 'Writers and Authors',
      'Postsecondary Teachers',
      // Related roles attainable with language degrees
      'Broadcast Announcers and Radio Disc Jockeys', 'Public Relations Specialists',
      'Advertising Sales Agents', 'Communications Equipment Operators',
      'Court Reporters and Simultaneous Captioners'
    ],
    'Centre for Professional and Continuing Education': [
      // Core training and development roles
      'Training and Development Specialists', 'Training and Development Managers',
      'Self-Enrichment Education Teachers',
      'Adult Basic Education, Adult Secondary Education, and English as a Second Language Instructors',
      'Self-Enrichment Teachers', 'Substitute Teachers, Short-Term', 'Miscellaneous Teachers and Instructors',
      'Teacher Assistants', 'Education Administrators', 'Education Administrators, Postsecondary',
      'Education Teachers, Postsecondary', 'Library Science Teachers, Postsecondary',
      'Instructional Coordinators',
      // Related roles attainable with continuing education backgrounds
      'Human Resources Specialists', 'Human Resources Managers',
      'Adult Basic and Secondary Education and Literacy Teachers and Instructors',
      'Educational, Guidance, and Career Counselors and Advisors',
      'Community and Social Service Specialists, All Other', 'Social and Human Service Assistants'
    ]
  };

  // Load available occupations on component mount
  useEffect(() => {
    loadOccupations();
  }, []);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check dropdown 1
      if (dropdownRef1.current && !dropdownRef1.current.contains(event.target as Node)) {
        setShowDropdown1(false);
        setDropdownSearchTerm1('');
        setCurrentPage1(0);
      }
      
      // Check dropdown 2
      if (dropdownRef2.current && !dropdownRef2.current.contains(event.target as Node)) {
        setShowDropdown2(false);
        setDropdownSearchTerm2('');
        setCurrentPage2(0);
        setExpandedSchools2(new Set());
      }
    };

    if (showDropdown1 || showDropdown2) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown1, showDropdown2]);

  // Handle keyboard navigation in dropdowns
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showDropdown1 && !showDropdown2) return;

      // Only handle keyboard navigation if the active element is not an input
      const activeElement = document.activeElement;
      if (activeElement && activeElement.tagName === 'INPUT') {
        return;
      }

      const key = event.key.toLowerCase();
      
      // If it's a letter, search within active dropdown
      if (key.length === 1 && /[a-z]/.test(key)) {
        if (showDropdown1) {
          const currentTime = Date.now();
          const timeDiff = currentTime - lastKeyPressTime1;
          
          // If pressed within 1 second, append to existing search
          if (timeDiff < 1000 && dropdownSearchTerm1) {
            const newSearchTerm = dropdownSearchTerm1 + key;
            setDropdownSearchTerm1(newSearchTerm);
          } else {
            // Start new search
            setDropdownSearchTerm1(key);
          }
          
          setCurrentPage1(0);
          setLastKeyPressTime1(currentTime);
          
          // Scroll to top of dropdown list
          if (dropdownListRef1.current) {
            dropdownListRef1.current.scrollTop = 0;
          }
        } else if (showDropdown2) {
          const currentTime = Date.now();
          const timeDiff = currentTime - lastKeyPressTime2;
          
          // If pressed within 1 second, append to existing search
          if (timeDiff < 1000 && dropdownSearchTerm2) {
            const newSearchTerm = dropdownSearchTerm2 + key;
            setDropdownSearchTerm2(newSearchTerm);
          } else {
            // Start new search
            setDropdownSearchTerm2(key);
          }
          
          setCurrentPage2(0);
          setLastKeyPressTime2(currentTime);
          
          // Scroll to top of dropdown list
          if (dropdownListRef2.current) {
            dropdownListRef2.current.scrollTop = 0;
          }
        }
        
        event.preventDefault();
      }
      
      // Escape key closes active dropdown
      if (event.key === 'Escape') {
        if (showDropdown1) {
          setShowDropdown1(false);
          setDropdownSearchTerm1('');
          setCurrentPage1(0);
        } else if (showDropdown2) {
          setShowDropdown2(false);
          setDropdownSearchTerm2('');
          setCurrentPage2(0);
        }
      }
    };

    if (showDropdown1 || showDropdown2) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown1, showDropdown2, dropdownSearchTerm1, dropdownSearchTerm2, lastKeyPressTime1, lastKeyPressTime2]);

  const loadOccupations = async () => {
    try {
      setLoadingOccupations(true);
      const response = await fetch('/api/career/occupations');
      const data = await response.json();
      if (data.success) {
        setOccupations(data.occupations);
      }
    } catch (err) {
      console.error('Failed to load occupations:', err);
    } finally {
      setLoadingOccupations(false);
    }
  };

  const searchOccupations1 = async (term: string) => {
    if (term.length < 2) {
      setSearchResults1([]);
      setShowSearchResults1(false);
      return;
    }

    try {
      const response = await fetch('/api/career/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search_term: term, limit: 10 })
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults1(data.matches);
        setShowSearchResults1(true);
      }
    } catch (err) {
      console.error('Failed to search occupations:', err);
    }
  };

  const searchOccupations2 = async (term: string) => {
    if (term.length < 1) {
      setSearchResults2([]);
      setShowSearchResults2(false);
      return;
    }

    // Search only within Sunway University occupations
    const sunwayOccupations = getSunwayOccupations();
    const filteredResults = sunwayOccupations.filter(occupation =>
      occupation.toLowerCase().includes(term.toLowerCase())
    ).slice(0, 10); // Limit to 10 results
    
    setSearchResults2(filteredResults);
    setShowSearchResults2(true);
  };

  const handleSearchChange1 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm1(value);
    searchOccupations1(value);
    
    // Open dropdown when user types
    if (value.length > 0) {
      setShowDropdown1(true);
    } else {
      setShowDropdown1(false);
    }
  };

  const handleSearchChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm2(value);
    searchOccupations2(value);
    
    // Open dropdown when user types
    if (value.length > 0) {
      setShowDropdown2(true);
    } else {
      setShowDropdown2(false);
    }
  };

  const handleOccupationSelect = (occupation: string) => {
    setSelectedOccupation(occupation);
    setSearchTerm1(occupation);
    setSearchTerm2(occupation);
    setShowSearchResults1(false);
    setShowSearchResults2(false);
    setShowDropdown1(false);
    setShowDropdown2(false);
    setDropdownSearchTerm1('');
    setDropdownSearchTerm2('');
    setCurrentPage1(0);
    setCurrentPage2(0);
    setExpandedSchools2(new Set());
  };

  const handleNextPage1 = () => {
    setCurrentPage1((prev: number) => prev + 1);
  };

  const handlePrevPage1 = () => {
    setCurrentPage1((prev: number) => Math.max(0, prev - 1));
  };

  const handleNextPage2 = () => {
    setCurrentPage2((prev: number) => prev + 1);
  };

  const handlePrevPage2 = () => {
    setCurrentPage2((prev: number) => Math.max(0, prev - 1));
  };

  const getFilteredOccupations1 = () => {
    let filtered = occupations;
    
    // Filter by dropdown search term
    if (dropdownSearchTerm1) {
      filtered = occupations.filter(occupation => 
        occupation.toLowerCase().startsWith(dropdownSearchTerm1.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilteredOccupations2 = () => {
    let filtered = getSunwayOccupations();
    
    // Filter by dropdown search term
    if (dropdownSearchTerm2) {
      filtered = filtered.filter(occupation => 
        occupation.toLowerCase().startsWith(dropdownSearchTerm2.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getPaginatedOccupations1 = () => {
    const filtered = getFilteredOccupations1();
    const startIndex = currentPage1 * 100;
    const endIndex = startIndex + 100;
    return filtered.slice(startIndex, endIndex);
  };

  const getPaginatedOccupations2 = () => {
    const filtered = getFilteredSunwayOccupations2();
    const startIndex = currentPage2 * 100;
    const endIndex = startIndex + 100;
    return filtered.slice(startIndex, endIndex);
  };

  // Create a direct occupation-to-school mapping to avoid duplicates
  const getOccupationToSchoolMapping = () => {
    const occupationToSchool: { [key: string]: string } = {};
    Object.entries(schoolMapping).forEach(([school, occupations]) => {
      const canonicalSchool = getCanonicalSchoolName(school);
      occupations.forEach(occupation => {
        // Only assign if not already assigned (first school wins)
        if (!occupationToSchool[occupation]) {
          occupationToSchool[occupation] = canonicalSchool;
        }
      });
    });
    return occupationToSchool;
  };

  // Helper function to normalize school names (trim whitespace and standardize)
  const normalizeSchoolName = (school: string) => {
    return school.trim();
  };

  // Helper function to get the canonical school name (handle variations)
  const getCanonicalSchoolName = (school: string) => {
    const normalized = normalizeSchoolName(school);
    
    // Map variations to canonical names
    const schoolNameMap: { [key: string]: string } = {
      'Centre For English Language Studies (CELS)': 'Centre For English Language Studies (CELS)',
      'Centre for Professional and Continuing Education': 'Centre for Professional and Continuing Education',
      'School of American Education (in Partnership With Arizona State University)': 'School of American Education (in Partnership With Arizona State University)',
      'School of Arts': 'School of Arts',
      'School of Education': 'School of Education',
      'School of Engineering and Technology': 'School of Engineering and Technology',
      'School of Hospitality and Tourism Management': 'School of Hospitality and Tourism Management',
      'School of Mathematical Sciences': 'School of Mathematical Sciences',
      'School of Medical and Life Sciences': 'School of Medical and Life Sciences',
      'Sunway Business School': 'Sunway Business School'
    };
    
    return schoolNameMap[normalized] || normalized;
  };

  // Helper function to get school for an occupation
  const getSchoolForOccupation = (occupation: string) => {
    const occupationToSchool = getOccupationToSchoolMapping();
    const school = occupationToSchool[occupation];
    return school ? getCanonicalSchoolName(school) : null;
  };

  // Get Sunway University occupations only
  const getSunwayOccupations = () => {
    const allSunwayOccupations: string[] = [];
    Object.values(schoolMapping).forEach(occupations => {
      allSunwayOccupations.push(...occupations);
    });
    // Remove duplicates and return unique occupations only
    const uniqueOccupations = [...new Set(allSunwayOccupations)];
    return uniqueOccupations;
  };

  // Get filtered Sunway occupations
  const getFilteredSunwayOccupations2 = () => {
    let filtered = getSunwayOccupations();
    
    // Filter by dropdown search term
    if (dropdownSearchTerm2) {
      filtered = filtered.filter(occupation => 
        occupation.toLowerCase().startsWith(dropdownSearchTerm2.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Get paginated Sunway occupations
  const getPaginatedSunwayOccupations2 = () => {
    const filtered = getFilteredSunwayOccupations2();
    const startIndex = currentPage2 * 100;
    const endIndex = startIndex + 100;
    return filtered.slice(startIndex, endIndex);
  };

  const toggleSchoolExpansion2 = (school: string) => {
    setExpandedSchools2(prev => {
      const newSet = new Set(prev);
      if (newSet.has(school)) {
        newSet.delete(school);
      } else {
        newSet.add(school);
      }
      return newSet;
    });
  };

  const handleForecast = async (e: React.FormEvent) => {
    e.preventDefault();
      if (!selectedOccupation) {
        setError('Please select an occupation.');
        return;
      }

    setError('');
    setInitial(false);
    setForecastData(null);
    setLoading(true);

    try {
      const response = await fetch('/api/career/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          occupation_title: selectedOccupation,
          include_realtime: true 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setForecastData(data.data);
      } else {
        setError(data.error || 'Failed to generate forecast');
      }
    } catch (err) {
      setError('Failed to fetch forecast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareEmploymentChartData = (data: ForecastData) => {
    const historical = Object.entries(data.historical_employment).map(([year, value]) => ({
      year: parseInt(year),
      employment: value,
      type: 'Historical'
    }));

    const forecast = data.forecast_years.map((year, index) => ({
      year,
      employment: data.employment_forecasts[index],
      lower: data.employment_lower_bounds[index],
      upper: data.employment_upper_bounds[index],
      type: 'Forecast'
    }));

    return [...historical, ...forecast];
  };

  const prepareSalaryChartData = (data: ForecastData) => {
    if (!data.historical_salary || !data.salary_forecasts) return [];

    const historical = Object.entries(data.historical_salary).map(([year, value]) => ({
      year: parseInt(year),
      salary: value,
      type: 'Historical'
    }));

    const forecast = data.forecast_years.map((year, index) => ({
      year,
      salary: data.salary_forecasts![index],
      lower: data.salary_lower_bounds![index],
      upper: data.salary_upper_bounds![index],
      type: 'Forecast'
    }));

    return [...historical, ...forecast];
  };

  // Helper function to round to nearest appropriate value
  const roundToNearest = (value: number, isUpper: boolean = false) => {
    // Determine the appropriate rounding unit based on the magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    let roundingUnit;
    
    if (magnitude >= 10000) {
      roundingUnit = 100; // Round to nearest 100 for large numbers
    } else if (magnitude >= 1000) {
      roundingUnit = 10; // Round to nearest 10 for medium numbers
    } else if (magnitude >= 100) {
      roundingUnit = 1; // Round to nearest 1 for smaller numbers
    } else {
      roundingUnit = 0.1; // Round to nearest 0.1 for very small numbers
    }
    
    if (isUpper) {
      // Round up to the next multiple of the rounding unit
      return Math.ceil(value / roundingUnit) * roundingUnit;
    } else {
      // Round down to the previous multiple of the rounding unit
      return Math.floor(value / roundingUnit) * roundingUnit;
    }
  };

  // Helper function to calculate Y-axis domain for employment data
  const getEmploymentYAxisDomain = (data: ForecastData) => {
    const allValues = [
      ...Object.values(data.historical_employment),
      ...data.employment_forecasts,
      ...data.employment_lower_bounds,
      ...data.employment_upper_bounds
    ].filter(value => value !== undefined && value !== null);
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    // Round to nearest appropriate values
    const roundedMin = roundToNearest(min);
    const roundedMax = roundToNearest(max, true);
    
    return [Math.max(0, roundedMin), roundedMax];
  };

  // Helper function to calculate Y-axis domain for salary data
  const getSalaryYAxisDomain = (data: ForecastData) => {
    if (!data.historical_salary || !data.salary_forecasts) return [0, 100000];
    
    const allValues = [
      ...Object.values(data.historical_salary),
      ...data.salary_forecasts,
      ...(data.salary_lower_bounds || []),
      ...(data.salary_upper_bounds || [])
    ].filter(value => value !== undefined && value !== null);
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    // Round to nearest appropriate values
    const roundedMin = roundToNearest(min);
    const roundedMax = roundToNearest(max, true);
    
    return [Math.max(0, roundedMin), roundedMax];
  };

  // Helper function to calculate Y-axis domain for historical employment data
  const getHistoricalEmploymentYAxisDomain = (data: ForecastData) => {
    const values = Object.values(data.historical_employment);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Round to nearest appropriate values
    const roundedMin = roundToNearest(min);
    const roundedMax = roundToNearest(max, true);
    
    return [Math.max(0, roundedMin), roundedMax];
  };

  // Helper function to calculate Y-axis domain for historical salary data
  const getHistoricalSalaryYAxisDomain = (data: ForecastData) => {
    if (!data.historical_salary) return [0, 100000];
    
    const values = Object.values(data.historical_salary);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Round to nearest appropriate values
    const roundedMin = roundToNearest(min);
    const roundedMax = roundToNearest(max, true);
    
    return [Math.max(0, roundedMin), roundedMax];
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'EXCELLENT': return 'text-green-600';
      case 'GOOD': return 'text-neon-blue';
      case 'FAIR': return 'text-yellow-600';
      case 'POOR': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    if (recommendation.includes('EXCELLENT')) return '🚀';
    if (recommendation.includes('STRONG')) return '✅';
    if (recommendation.includes('MODERATE')) return '🟨';
    if (recommendation.includes('DECLINING')) return '⚠️';
    return '🔍';
  };

  return (
    <div className="min-h-screen bg-dark-950 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Career Forecasting & Analytics
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Get AI-powered employment and salary forecasts for any occupation. 
            Our advanced time series models combine historical data with real-time market insights.
          </p>
        </div>

                 {/* Search and Selection */}
         <div className="bg-dark-900 rounded-xl shadow-lg p-6 mb-8 border border-dark-700">
           <form onSubmit={handleForecast} className="space-y-4">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                               {/* First Search Bar */}
                 <div className="relative" ref={dropdownRef1}>
                   <label className="block text-sm font-medium text-white mb-2">
                     Search Occupation
                   </label>
                   <div className="relative">
                                           <input
                        type="text"
                        value={searchTerm1}
                        onChange={handleSearchChange1}
                        placeholder="Search all occupations"
                        className="w-full px-4 py-3 border border-dark-600 bg-dark-800 text-white rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent"
                      />
                      
                      {/* Dropdown Arrow */}
                      <button
                        type="button"
                        onClick={() => setShowDropdown1(!showDropdown1)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${showDropdown1 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown */}
                      {showDropdown1 && (
                        <div className="absolute z-10 w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg shadow-lg max-h-96 overflow-hidden">
                                                     {/* Search Results Section */}
                           {searchResults1.length > 0 ? (
                             <>
                               <div className="px-4 py-2 bg-neon-green/20 border-b border-dark-700">
                                 <span className="text-sm text-neon-green font-medium">
                                   Search Results ({searchResults1.length})
                                 </span>
                               </div>
                               <div className="max-h-32 overflow-y-auto">
                                 {searchResults1.map((occupation: string, index: number) => (
                                   <button
                                     key={`search-${index}`}
                                     type="button"
                                     onClick={() => handleOccupationSelect(occupation)}
                                     className="w-full text-left px-4 py-2 hover:bg-dark-800 focus:bg-dark-800 focus:outline-none border-b border-dark-700 text-white"
                                   >
                                     {occupation}
                                   </button>
                                 ))}
                               </div>
                             </>
                                                       ) : searchTerm1.length >= 1 && (
                              <div className="px-4 py-2 bg-neon-red/20 border-b border-dark-700">
                                <span className="text-sm text-neon-red font-medium">
                                  Search Results (0)
                                </span>
                              </div>
                            )}
                         
                         {/* Keyboard Search Section */}
                         {dropdownSearchTerm1 && (
                           <div className="px-4 py-2 bg-neon-blue/20 border-b border-dark-700">
                             <span className="text-sm text-neon-blue">
                               Keyboard search: "{dropdownSearchTerm1}"
                             </span>
                           </div>
                         )}
                         
                         {/* All Occupations Section */}
                         <div className="px-4 py-2 bg-dark-800 border-b border-dark-700">
                           <span className="text-sm text-gray-300 font-medium">
                             All Occupations ({getFilteredOccupations1().length})
                           </span>
                         </div>
                         
                         {/* Occupations List */}
                         <div ref={dropdownListRef1} className="max-h-48 overflow-y-auto">
                           {loadingOccupations ? (
                             <div className="px-4 py-2 text-gray-400">Loading occupations...</div>
                           ) : (
                             getPaginatedOccupations1().map((occupation: string, index: number) => (
                               <button
                                 key={`all-${index}`}
                                 type="button"
                                 onClick={() => handleOccupationSelect(occupation)}
                                 className="w-full text-left px-4 py-2 hover:bg-dark-800 focus:bg-dark-800 focus:outline-none text-white"
                               >
                                 {occupation}
                               </button>
                             ))
                           )}
                         </div>
                         
                         {/* Pagination Controls */}
                         {!loadingOccupations && getFilteredOccupations1().length > 100 && (
                           <div className="flex items-center justify-between px-4 py-2 border-t border-dark-700 bg-dark-800 sticky bottom-0">
                             <button
                               type="button"
                               onClick={handlePrevPage1}
                               disabled={currentPage1 === 0}
                               className="px-3 py-1 text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               Previous
                             </button>
                             <span className="text-sm text-gray-300">
                               Page {currentPage1 + 1} of {Math.ceil(getFilteredOccupations1().length / 100)}
                             </span>
                             <button
                               type="button"
                               onClick={handleNextPage1}
                               disabled={(currentPage1 + 1) * 100 >= getFilteredOccupations1().length}
                               className="px-3 py-1 text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               Next
                             </button>
                           </div>
                         )}
                         
                         {/* Info message */}
                         {!loadingOccupations && getFilteredOccupations1().length === 0 && (
                           <div className="px-4 py-2 text-gray-400 text-sm">
                             No occupations found starting with "{dropdownSearchTerm1}"
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 </div>

                               {/* Second Search Bar */}
                <div className="relative" ref={dropdownRef2}>
                  <label className="block text-sm font-medium text-white mb-2">
                    Search University-Focused Occupation
                  </label>
                  <div className="relative">
                                         <input
                       type="text"
                       value={searchTerm2}
                       onChange={handleSearchChange2}
                       placeholder="Search all University-Focused Occupations"
                       className="w-full px-4 py-3 border border-dark-600 bg-dark-800 text-white rounded-lg focus:ring-2 focus:ring-neon-pink focus:border-transparent"
                     />
                     
                     {/* Dropdown Arrow */}
                     <button
                       type="button"
                       onClick={() => setShowDropdown2(!showDropdown2)}
                       className="absolute inset-y-0 right-0 flex items-center pr-3"
                     >
                       <svg className={`w-5 h-5 text-gray-500 transition-transform ${showDropdown2 ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                       </svg>
                     </button>
                     
                     {/* Dropdown */}
                     {showDropdown2 && (
                       <div className="absolute z-10 w-full mt-1 bg-dark-900 border border-dark-600 rounded-lg shadow-lg max-h-80 overflow-hidden">
                                                   {/* Search Results Section */}
                          {searchResults2.length > 0 ? (
                            <>
                              <div className="px-4 py-2 bg-neon-green/20 border-b border-dark-700">
                                <span className="text-sm text-neon-green font-medium">
                                  Search Results ({searchResults2.length})
                                </span>
                              </div>
                              <div className="max-h-40 overflow-y-auto">
                                {searchResults2.map((occupation: string, index: number) => (
                                  <button
                                    key={`search-${index}`}
                                    type="button"
                                    onClick={() => handleOccupationSelect(occupation)}
                                    className="w-full text-left px-4 py-2 hover:bg-dark-800 focus:bg-dark-800 focus:outline-none border-b border-dark-700 text-white"
                                  >
                                    {occupation}
                                  </button>
                                ))}
                              </div>
                            </>
                                                     ) : searchTerm2.length >= 1 && (
                             <div className="px-4 py-2 bg-red-50 border-b border-gray-200">
                               <span className="text-sm text-red-600 font-medium">
                                 Search Results (0)
                               </span>
                             </div>
                           )}
                        
                        {/* Keyboard Search Section */}
                        {dropdownSearchTerm2 && (
                          <div className="px-4 py-2 bg-neon-blue/20 border-b border-dark-700">
                            <span className="text-sm text-neon-blue">
                              Keyboard search: "{dropdownSearchTerm2}"
                            </span>
                          </div>
                        )}
                        
                                                 {/* Sunway University Occupations Section */}
                         <div className="px-4 py-2 bg-dark-800 border-b border-dark-700">
                           <span className="text-sm text-gray-300 font-medium">
                             Sunway University Occupations ({getFilteredSunwayOccupations2().length})
                           </span>
                         </div>
                         
                         {/* Collapsible Schools List */}
                         <div ref={dropdownListRef2} className="max-h-60 overflow-y-auto">
                           {loadingOccupations ? (
                             <div className="px-4 py-2 text-gray-500">Loading occupations...</div>
                           ) : (
                             (() => {
                               // Get all Sunway occupations, not just paginated ones
                               const allSunwayOccupations = getFilteredSunwayOccupations2();
                               const groupedOccupations: { [key: string]: string[] } = {};
                               
                               // Group ALL occupations by school using direct mapping
                               allSunwayOccupations.forEach(occupation => {
                                 const school = getSchoolForOccupation(occupation);
                                 if (school) {
                                   const canonicalSchool = getCanonicalSchoolName(school);
                                   if (!groupedOccupations[canonicalSchool]) {
                                     groupedOccupations[canonicalSchool] = [];
                                   }
                                   // Only add if not already in the school's list (avoid duplicates)
                                   if (!groupedOccupations[canonicalSchool].includes(occupation)) {
                                     groupedOccupations[canonicalSchool].push(occupation);
                                   }
                                 }
                               });
                               
                               // Sort schools alphabetically and occupations within each school
                               const sortedSchools = Object.keys(groupedOccupations).sort();
                               sortedSchools.forEach(school => {
                                 groupedOccupations[school].sort();
                               });
                               
                               // Ensure no duplicate schools by using a Set
                               const uniqueSchools = [...new Set(sortedSchools)];
                               
                               // Paginate schools (4 schools per page)
                               const schoolsPerPage = 4;
                               const startSchoolIndex = currentPage2 * schoolsPerPage;
                               const endSchoolIndex = startSchoolIndex + schoolsPerPage;
                               const paginatedSchools = uniqueSchools.slice(startSchoolIndex, endSchoolIndex);
                               
                               return paginatedSchools.map((school) => {
                                 const totalSchoolOccupations = groupedOccupations[school];
                                 const isExpanded = expandedSchools2.has(school);
                                 
                                 return (
                                   <div key={school} className="border-b border-dark-700">
                                     {/* Collapsible School Header */}
                                     <button
                                       type="button"
                                       onClick={() => toggleSchoolExpansion2(school)}
                                       className="w-full text-left px-4 py-3 bg-neon-blue/20 hover:bg-neon-blue/30 focus:outline-none flex items-center justify-between"
                                     >
                                       <span className="text-sm font-semibold text-neon-blue">
                                         {school} ({totalSchoolOccupations.length})
                                       </span>
                                       <span className="text-neon-blue text-xs">
                                         {isExpanded ? '▼' : '▶'}
                                       </span>
                                     </button>
                                     
                                     {/* School Occupations (collapsible) */}
                                     {isExpanded && (
                                       <div className="bg-dark-900">
                                         {totalSchoolOccupations.map((occupation: string, index: number) => (
                                           <button
                                             key={`${school}-${index}`}
                                             type="button"
                                             onClick={() => handleOccupationSelect(occupation)}
                                             className="w-full text-left px-6 py-2 hover:bg-dark-800 focus:bg-dark-800 focus:outline-none border-b border-dark-700 text-white text-sm"
                                           >
                                             {occupation}
                                           </button>
                                         ))}
                                       </div>
                                     )}
                                   </div>
                                 );
                               });
                             })()
                           )}
                         </div>
                        
                        {/* Pagination Controls */}
                        {!loadingOccupations && (() => {
                          const allSunwayOccupations = getFilteredSunwayOccupations2();
                          const groupedOccupations: { [key: string]: string[] } = {};
                          
                          allSunwayOccupations.forEach(occupation => {
                            const school = getSchoolForOccupation(occupation);
                            if (school) {
                              const canonicalSchool = getCanonicalSchoolName(school);
                              if (!groupedOccupations[canonicalSchool]) {
                                groupedOccupations[canonicalSchool] = [];
                              }
                              if (!groupedOccupations[canonicalSchool].includes(occupation)) {
                                groupedOccupations[canonicalSchool].push(occupation);
                              }
                            }
                          });
                          
                          const uniqueSchools = [...new Set(Object.keys(groupedOccupations).sort())];
                          const schoolsPerPage = 4;
                          const totalPages = Math.ceil(uniqueSchools.length / schoolsPerPage);
                          
                          return totalPages > 1 ? (
                            <div className="flex items-center justify-between px-4 py-2 border-t border-dark-700 bg-dark-800">
                              <button
                                type="button"
                                onClick={handlePrevPage2}
                                disabled={currentPage2 === 0}
                                className="px-3 py-1 text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Previous
                              </button>
                              <span className="text-sm text-gray-300">
                                Page {currentPage2 + 1} of {totalPages}
                              </span>
                              <button
                                type="button"
                                onClick={handleNextPage2}
                                disabled={(currentPage2 + 1) * schoolsPerPage >= uniqueSchools.length}
                                className="px-3 py-1 text-sm text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </button>
                            </div>
                          ) : null;
                        })()}
                        
                        {/* Info message */}
                        {!loadingOccupations && getFilteredSunwayOccupations2().length === 0 && (
                          <div className="px-4 py-2 text-gray-400 text-sm">
                            No Sunway University occupations found starting with "{dropdownSearchTerm2}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
             </div>

            <div className="flex gap-4">
          <button
            type="submit"
                disabled={loading || !selectedOccupation}
                className="flex-1 bg-neon-pink text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Forecast...
                  </div>
                ) : (
                  'Generate Forecast'
                )}
          </button>
            </div>
        </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-neon-red/20 border border-neon-red rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-neon-red" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-neon-red">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Initial Content */}
        {initial && !loading && (
          <div className="text-center text-gray-300 mt-12">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Ready to Forecast Your Career?</h3>
              <p className="text-gray-400 mb-6">
                Search for any occupation above or select from the dropdown to get comprehensive employment and salary forecasts. 
                Our AI models analyze historical trends and real-time market data to provide accurate predictions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-dark-800 p-4 rounded-lg shadow border border-dark-700">
                  <div className="text-neon-blue font-semibold mb-2">📈 Employment Forecast</div>
                  <p className="text-gray-300">Predict job growth and demand trends</p>
                </div>
                <div className="bg-dark-800 p-4 rounded-lg shadow border border-dark-700">
                  <div className="text-neon-green font-semibold mb-2">💰 Salary Projection</div>
                  <p className="text-gray-300">Forecast salary trends and growth</p>
                </div>
                <div className="bg-dark-800 p-4 rounded-lg shadow border border-dark-700">
                  <div className="text-neon-pink font-semibold mb-2">🔍 Real-time Data</div>
                  <p className="text-gray-300">Latest job market insights</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Results */}
        {forecastData && !loading && (
          <div className="space-y-8">
            {/* Summary Card */}
            <div className="bg-dark-900 rounded-xl shadow-lg p-6 border border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {forecastData.occupation_title}
                </h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityColor(forecastData.quality_rating)}`}>
                  {forecastData.quality_rating}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-blue">
                    {forecastData.current_employment.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-300">Current Employment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-green">
                    {forecastData.growth_total_percent > 0 ? '+' : ''}{forecastData.growth_total_percent.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-300">Growth by 2030</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-pink">
                    {forecastData.realtime_jobs_count}
                  </div>
                  <div className="text-sm text-gray-300">Real-time Jobs</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-dark-800 to-dark-700 rounded-lg p-4 border border-dark-600">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getRecommendationIcon(forecastData.recommendation)}</span>
                  <h3 className="text-lg font-semibold text-white">{forecastData.recommendation}</h3>
                </div>
                <p className="text-gray-300">{forecastData.student_advice}</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-dark-900 rounded-xl shadow-lg border border-dark-700">
              <div className="border-b border-dark-700">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('forecast')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'forecast'
                        ? 'border-neon-pink text-neon-pink'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    📈 Forecast Data
                  </button>
                  <button
                    onClick={() => setActiveTab('historical')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'historical'
                        ? 'border-neon-pink text-neon-pink'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    📊 Historical Data
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'forecast' && (
                  <div className="space-y-8">
                    {/* Forecast Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Employment Forecast Chart */}
                      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-600">
                        <h3 className="text-lg font-semibold mb-4 text-white">Employment Forecast</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={prepareEmploymentChartData(forecastData)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis domain={getEmploymentYAxisDomain(forecastData)} />
                            <Tooltip 
                              formatter={(value: any) => [value.toLocaleString(), 'Employment']}
                              labelFormatter={(label) => `Year: ${label}`}
                            />
                            <Legend />
                            <Area 
                              type="monotone" 
                              dataKey="employment" 
                              stroke="#00d4ff" 
                              fill="#00d4ff" 
                              fillOpacity={0.3}
                              name="Employment"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="upper" 
                              stroke="#00ff88" 
                              fill="#00ff88" 
                              fillOpacity={0.1}
                              name="Upper Bound"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="lower" 
                              stroke="#ff0040" 
                              fill="#ff0040" 
                              fillOpacity={0.1}
                              name="Lower Bound"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                        <div className="mt-4 text-sm text-gray-300">
                          <p><strong>Method:</strong> {forecastData.employment_method}</p>
                          <p><strong>Accuracy:</strong> {forecastData.employment_accuracy_mape.toFixed(1)}% MAPE</p>
                          <p><strong>Confidence Level:</strong> {forecastData.confidence_level}</p>
                        </div>
                        <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                          <h4 className="text-neon-blue font-semibold mb-2">📈 Forecast Explanation</h4>
                          <p className="text-gray-300 text-sm">
                            This chart shows the predicted employment growth for {forecastData.occupation_title} from {Math.min(...forecastData.forecast_years)} to {Math.max(...forecastData.forecast_years)}. 
                            The blue area represents the forecasted employment levels, while the green and red areas show the confidence intervals (upper and lower bounds). 
                            The model uses {forecastData.employment_method} with an accuracy of {forecastData.employment_accuracy_mape.toFixed(1)}% MAPE.
                          </p>
                        </div>
                      </div>

                      {/* Salary Forecast Chart */}
                      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-600">
                        <h3 className="text-lg font-semibold mb-4 text-white">Salary Forecast</h3>
                        {forecastData.salary_forecasts ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={prepareSalaryChartData(forecastData)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" />
                              <YAxis domain={getSalaryYAxisDomain(forecastData)} />
                              <Tooltip 
                                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Salary']}
                                labelFormatter={(label) => `Year: ${label}`}
                              />
                              <Legend />
                              <Area 
                                type="monotone" 
                                dataKey="salary" 
                                stroke="#00ff88" 
                                fill="#00ff88" 
                                fillOpacity={0.3}
                                name="Salary"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="upper" 
                                stroke="#00ff88" 
                                fill="#00ff88" 
                                fillOpacity={0.1}
                                name="Upper Bound"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="lower" 
                                stroke="#ff0040" 
                                fill="#ff0040" 
                                fillOpacity={0.1}
                                name="Lower Bound"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-64 text-gray-400">
                            <p>Salary data not available for this occupation</p>
                          </div>
                        )}
                        {forecastData.salary_method && (
                          <div className="mt-4 text-sm text-gray-300">
                            <p><strong>Method:</strong> {forecastData.salary_method}</p>
                            <p><strong>Accuracy:</strong> {forecastData.salary_accuracy_mape?.toFixed(1)}% MAPE</p>
                          </div>
                        )}
                        {forecastData.salary_forecasts && (
                          <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                            <h4 className="text-neon-green font-semibold mb-2">💰 Salary Forecast Explanation</h4>
                            <p className="text-gray-300 text-sm">
                              This chart displays the projected salary trends for {forecastData.occupation_title}. 
                              The green area shows the forecasted salary levels, with confidence intervals indicating the range of possible outcomes. 
                              The model uses {forecastData.salary_method} to predict future salary growth based on historical trends and market conditions.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Real-time Jobs */}
                    {forecastData.realtime_jobs.length > 0 && (
                      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-600">
                        <h3 className="text-lg font-semibold mb-4 text-white">Real-time Job Opportunities</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {forecastData.realtime_jobs.slice(0, 6).map((job, index) => (
                            <div key={index} className="border border-dark-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-dark-700">
                              <h4 className="font-semibold text-white mb-2">{job.title}</h4>
                              <p className="text-sm text-gray-300 mb-2">{job.company}</p>
                              <p className="text-sm text-gray-400 mb-2">{job.location}</p>
                              {job.salary_min && job.salary_max && (
                                <p className="text-sm text-neon-green font-medium">
                                  ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                          <h4 className="text-neon-pink font-semibold mb-2">🔍 Real-time Market Insights</h4>
                          <p className="text-gray-300 text-sm">
                            These are current job openings for {forecastData.occupation_title} in the market. 
                            The data is updated in real-time and shows {forecastData.realtime_jobs_count} active positions. 
                            This information helps validate the forecast by showing current market demand and salary ranges.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'historical' && (
                  <div className="space-y-8">
                    {/* Historical Employment Chart */}
                    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-600">
                      <h3 className="text-lg font-semibold mb-4 text-white">Historical Employment Trends</h3>
                                              <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={Object.entries(forecastData.historical_employment).map(([year, value]) => ({
                            year: parseInt(year),
                            employment: value
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis domain={getHistoricalEmploymentYAxisDomain(forecastData)} />
                            <Tooltip 
                              formatter={(value: any) => [value.toLocaleString(), 'Employment']}
                              labelFormatter={(label) => `Year: ${label}`}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="employment" 
                              stroke="#ff0080" 
                              strokeWidth={2}
                              dot={{ fill: '#ff0080', strokeWidth: 2, r: 4 }}
                              name="Historical Employment"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                        <h4 className="text-neon-pink font-semibold mb-2">📊 Historical Employment Analysis</h4>
                        <p className="text-gray-300 text-sm">
                          This chart shows the historical employment data for {forecastData.occupation_title} from {Math.min(...Object.keys(forecastData.historical_employment).map(Number))} to {Math.max(...Object.keys(forecastData.historical_employment).map(Number))}. 
                          The data reveals employment trends, growth patterns, and any cyclical behavior that informed our forecasting models. 
                          Understanding historical patterns is crucial for making accurate future predictions.
                        </p>
                      </div>
                    </div>

                    {/* Historical Salary Chart */}
                    {forecastData.historical_salary && Object.keys(forecastData.historical_salary).length > 0 && (
                      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-600">
                        <h3 className="text-lg font-semibold mb-4 text-white">Historical Salary Trends</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={Object.entries(forecastData.historical_salary).map(([year, value]) => ({
                            year: parseInt(year),
                            salary: value
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis domain={getHistoricalSalaryYAxisDomain(forecastData)} />
                            <Tooltip 
                              formatter={(value: any) => [`$${value.toLocaleString()}`, 'Salary']}
                              labelFormatter={(label) => `Year: ${label}`}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="salary" 
                              stroke="#00ff88" 
                              strokeWidth={2}
                              dot={{ fill: '#00ff88', strokeWidth: 2, r: 4 }}
                              name="Historical Salary"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-4 p-4 bg-dark-700 rounded-lg">
                          <h4 className="text-neon-green font-semibold mb-2">💰 Historical Salary Analysis</h4>
                          <p className="text-gray-300 text-sm">
                            This chart displays the historical salary trends for {forecastData.occupation_title}. 
                            The data shows how salaries have evolved over time, including periods of growth, stagnation, or decline. 
                            This historical context helps understand salary progression and informs future salary predictions.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Historical Data Summary */}
                    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-600">
                      <h3 className="text-lg font-semibold mb-4 text-white">Historical Data Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="p-4 bg-dark-700 rounded-lg">
                            <h4 className="text-neon-blue font-semibold mb-2">📈 Employment Data Points</h4>
                            <p className="text-gray-300 text-sm">
                              <strong>Data Range:</strong> {Math.min(...Object.keys(forecastData.historical_employment).map(Number))} - {Math.max(...Object.keys(forecastData.historical_employment).map(Number))}<br/>
                              <strong>Total Years:</strong> {Object.keys(forecastData.historical_employment).length} years<br/>
                              <strong>Growth Rate:</strong> {forecastData.growth_total_percent > 0 ? '+' : ''}{forecastData.growth_total_percent.toFixed(1)}% total growth<br/>
                              <strong>Annual Growth:</strong> {forecastData.growth_1yr_percent > 0 ? '+' : ''}{forecastData.growth_1yr_percent.toFixed(1)}% per year
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 bg-dark-700 rounded-lg">
                            <h4 className="text-neon-green font-semibold mb-2">💰 Salary Data Points</h4>
                            <p className="text-gray-300 text-sm">
                              {forecastData.historical_salary && Object.keys(forecastData.historical_salary).length > 0 ? (
                                <>
                                  <strong>Data Range:</strong> {Math.min(...Object.keys(forecastData.historical_salary).map(Number))} - {Math.max(...Object.keys(forecastData.historical_salary).map(Number))}<br/>
                                  <strong>Total Years:</strong> {Object.keys(forecastData.historical_salary).length} years<br/>
                                  <strong>Current Salary:</strong> ${forecastData.current_salary?.toLocaleString() || 'N/A'}<br/>
                                  <strong>Salary Growth:</strong> {forecastData.salary_forecast_2030 && forecastData.current_salary ? 
                                    (((forecastData.salary_forecast_2030 - forecastData.current_salary) / forecastData.current_salary) * 100).toFixed(1) + '%' : 'N/A'}
                                </>
                              ) : (
                                <span className="text-gray-400">Salary data not available</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerForecastPage; 