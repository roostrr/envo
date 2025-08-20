import { Link } from 'react-router-dom'
import React, { useState } from 'react';

const carouselSlides = [
  {
    title: 'ENVO Chat Assistant',
    description: 'Get instant answers to your questions about careers, education, and professional development.',
    cta: 'Chat Now',
    link: '/ai-chat',
    bg: 'from-purple-600 to-pink-500',
    bgImage: '/images/chat-assistant-bg.jpg', // Add your image here
    icon: (
      <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
    )
  },
  {
    title: 'AI Career Forecasting',
    description: 'Get personalized career predictions based on your skills, interests, and market trends using advanced AI algorithms.',
    cta: 'Get Career Forecast',
    link: '/career-forecast',
    bg: 'from-blue-600 to-purple-700',
    bgImage: '/images/career-forecast-bg.jpg', // Add your image here
    icon: (
      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    )
  },
  {
    title: 'ENVO Learn',
    description: 'Access curated educational videos, articles, and resources to enhance your knowledge and skills.',
    cta: 'Explore Content',
    link: '/envo-learn',
    bg: 'from-green-500 to-blue-500',
    bgImage: '/images/educational-content-bg.jpg', // Add your image here
    icon: (
      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
    )
  }
];

const HomePage = () => {
  const [current, setCurrent] = useState(0);

  const prevSlide = () => setCurrent((prev) => (prev === 0 ? carouselSlides.length - 1 : prev - 1));
  const nextSlide = () => setCurrent((prev) => (prev === carouselSlides.length - 1 ? 0 : prev + 1));

  return (
    <div className="min-h-screen">
      {/* Jumbotron Carousel */}
      <section 
        className={`relative bg-gradient-to-r ${carouselSlides[current].bg} text-white transition-all duration-500 overflow-hidden`}
        style={{
          backgroundImage: carouselSlides[current].bgImage ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${carouselSlides[current].bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center justify-center relative z-10">
          {carouselSlides[current].icon}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center drop-shadow-lg text-white">{carouselSlides[current].title}</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-center drop-shadow-lg text-white">{carouselSlides[current].description}</p>
          <Link
            to={carouselSlides[current].link}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            {carouselSlides[current].cta}
          </Link>
          {/* Carousel Controls */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20">
            <button onClick={prevSlide} className="bg-white/30 hover:bg-white/50 text-white rounded-full p-2 m-2 focus:outline-none backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20">
            <button onClick={nextSlide} className="bg-white/30 hover:bg-white/50 text-white rounded-full p-2 m-2 focus:outline-none backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {/* Dots */}
          <div className="flex justify-center mt-8 space-x-2 z-20">
            {carouselSlides.map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full ${idx === current ? 'bg-white' : 'bg-white/50'} border-2 border-white backdrop-blur-sm`}
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose ENVO?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Comprehensive tools and insights to guide your academic and career journey with ENVO
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-dark-800 p-8 rounded-lg shadow-md border border-dark-700">
              <div className="w-12 h-12 bg-neon-blue/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">AI Career Forecasting</h3>
              <p className="text-gray-300">
                Get personalized career predictions based on your skills, interests, and market trends using advanced AI algorithms.
              </p>
            </div>

            <div className="bg-dark-800 p-8 rounded-lg shadow-md border border-dark-700">
              <div className="w-12 h-12 bg-neon-green/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">ENVO Learn</h3>
              <p className="text-gray-300">
                Access curated educational videos, articles, and resources to enhance your knowledge and skills.
              </p>
            </div>

            <div className="bg-dark-800 p-8 rounded-lg shadow-md border border-dark-700">
              <div className="w-12 h-12 bg-neon-pink/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-neon-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">ENVO Chat Assistant</h3>
              <p className="text-gray-300">
                Get instant answers to your questions about careers, education, and professional development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-neon-pink to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Journey with ENVO?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of students and professionals who have discovered their perfect career path with ENVO.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-neon-pink px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-neon-pink transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage 