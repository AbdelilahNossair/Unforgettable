import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe, Sun, Moon, Menu, X, ChevronRight, QrCode, Camera, Tag, Users } from 'lucide-react';
import { useAuthStore } from '../store';
import { QRScanner } from '../components/QRScanner';
import { DemoRequestModal } from '../components/DemoRequestModal';

export const Landing: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const testimonials = [
    {
      name: "Karim Benali",
      role: "Wedding Planner",
      company: "Casablanca Celebrations",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      quote: "This Moroccan AI solution transformed how we capture and organize wedding photos. Families are delighted with how easily they can find their precious moments!"
    },
    {
      name: "Leila Tazi",
      role: "Festival Director",
      company: "Atlas Music Festival",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      quote: "Built in Morocco for Moroccans, this platform understands our unique events. The facial recognition is remarkably accurate even in large festival crowds."
    },
    {
      name: "Omar Belhaj",
      role: "Conference Manager",
      company: "Marrakech Tech Summit",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
      quote: "What used to take our team days now happens instantly. Proud to use a revolutionary Moroccan AI solution for our international conferences."
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme-preference')) {
        useAuthStore.setState({ isDarkMode: e.matches });
      }
    };

    if (!localStorage.getItem('theme-preference')) {
      useAuthStore.setState({ isDarkMode: darkModeMediaQuery.matches });
    }

    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    toggleDarkMode();
    localStorage.setItem('theme-preference', (!isDarkMode).toString());
  };

  const handleRequestDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowDemoModal(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-lg z-50 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center">
              <img 
                src={isDarkMode ? "/logo_2.png" : "/logo_1.png"} 
                alt="Moroccan Event Recognition" 
                className="h-8 w-auto" 
              />
              {/*<span className="ml-2 font-semibold text-emerald-700 dark:text-emerald-500">Events with a New Breath</span>*/}
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={handleThemeToggle}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-4"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:flex items-center space-x-8">
              {/*
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black rounded hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-colors"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Scan Event QR
              </button>  */ }
              <button
                onClick={handleThemeToggle}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-700" />
                )}
              </button>
              <Link
                to="/login"
                className="text-sm font-light tracking-wider text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-light tracking-wider text-white bg-emerald-700 dark:text-black dark:bg-emerald-500 hover:bg-emerald-800 dark:hover:bg-emerald-400 px-8 py-3 transition-colors"
              >
                Get Access
              </Link>
            </div>
          </div>

          {/* Mobile navigation menu */}
          <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'} py-4`}>
            <div className="flex flex-col space-y-4">
              <Link
                to="/login"
                className="text-sm font-light tracking-wider text-gray-700 dark:text-white/80 hover:text-black dark:hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-light tracking-wider text-white bg-emerald-700 dark:text-black dark:bg-emerald-500 hover:bg-emerald-800 dark:hover:bg-emerald-400 px-8 py-3 transition-colors text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Get Access
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner onClose={() => setShowScanner(false)} />
      )}

      {/* Estimate Request Modal */}
      <DemoRequestModal 
        isOpen={showDemoModal} 
        onClose={() => setShowDemoModal(false)} 
      />

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center pt-16 sm:pt-20">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80"
            alt="Moroccan Wedding Celebration"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/90 dark:from-black dark:via-black/95 dark:to-black/90" />
        </div>
        
        <div className="relative w-full py-12 sm:py-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end">
              <div className="py-2 px-4 bg-emerald-700 text-white text-sm rounded-full mb-6">
                Proudly Made in Morocco 🇲🇦
              </div>
            </div>
            <div className="max-w-3xl">
              <h1 className="text-4xl sm:text-6xl lg:text-8xl font-light tracking-tight">
                <span className="block">Revolutionize</span>
                <span className="block mt-2 py-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 dark:from-emerald-400 dark:via-emerald-500 dark:to-emerald-600">
                  Event Recognition
                </span>
              </h1>
              <p className="mt-10 sm:mt-14 text-lg sm:text-xl font-light leading-relaxed text-gray-600 dark:text-white/70 max-w-2xl">
                Morocco's first AI-powered event recognition platform. Instantly identify guests, enhance security, and capture memorable moments at weddings, concerts, conferences, and all your special occasions.
              </p>
              <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
                <button
                  onClick={handleRequestDemo}
                  className="group inline-flex items-center justify-center bg-emerald-700 dark:bg-emerald-500 text-white dark:text-black px-8 py-4 text-sm tracking-wider hover:bg-emerald-800 dark:hover:bg-emerald-400 transition-colors"
                >
                  Request Estimate
                  <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <Link
                  to="/about"
                  className="text-sm tracking-wider text-gray-600 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors text-center sm:text-left py-4 sm:py-0"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-light mb-4">AI-Powered Event Recognition</h2>
            <p className="text-lg text-gray-600 dark:text-white/60 max-w-3xl mx-auto">
              Built in Morocco for the unique needs of Moroccan and global events
            </p>
          </div>
          <div className="space-y-16 sm:space-y-24">
            {/* Feature 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="relative h-[300px] sm:h-[400px] rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1604017011826-d3b4c23f8914"
                  alt="Moroccan Wedding Security"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-light tracking-tight mb-4 sm:mb-6">Smart Wedding Recognition</h3>
                <p className="text-gray-600 dark:text-white/60 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                  Our AI is specifically trained to understand Moroccan wedding traditions and celebrations. Instantly identify guests, organize photos by family groups, and ensure only invited guests access your special day.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-600 dark:text-white/60">
                    <Users className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>Family group organization</span>
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-white/60">
                    <Shield className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>Private event security</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <h3 className="text-2xl sm:text-3xl font-light tracking-tight mb-4 sm:mb-6">Concert & Festival Intelligence</h3>
                <p className="text-gray-600 dark:text-white/60 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                  Process thousands of faces in milliseconds at your concerts, festivals, and raves. Track attendance, identify VIPs, and enhance security with Morocco's fastest AI recognition system.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-600 dark:text-white/60">
                    <Zap className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>Real-time crowd analytics</span>
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-white/60">
                    <Camera className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>Instant fan photo moments</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-[300px] sm:h-[400px] rounded-lg overflow-hidden order-1 lg:order-2 transform hover:scale-105 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80"
                  alt="Moroccan Concert Recognition"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="relative h-[300px] sm:h-[400px] rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80"
                  alt="Moroccan Business Conference"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-light tracking-tight mb-4 sm:mb-6">Professional Conference Solutions</h3>
                <p className="text-gray-600 dark:text-white/60 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8">
                  Streamline registration and networking at business conferences with our Moroccan-developed AI technology. Automatically track attendance, facilitate connections, and measure engagement.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center text-gray-600 dark:text-white/60">
                    <Tag className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>Automated check-in process</span>
                  </li>
                  <li className="flex items-center text-gray-600 dark:text-white/60">
                    <Globe className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>Multi-language support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Section */}
      <div className="relative border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-light mb-4">Revolutionary Moroccan AI Technology</h2>
            <p className="text-lg text-gray-600 dark:text-white/60 max-w-3xl mx-auto">
              Developed by Morocco's leading AI engineers to address the unique needs of our culture and events
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                <Camera className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">Cultural Recognition</h3>
              <p className="text-gray-600 dark:text-white/60">
                Unlike generic AI, our technology is trained to understand Moroccan facial features, dress styles, and cultural contexts.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">Lightning Speed</h3>
              <p className="text-gray-600 dark:text-white/60">
                Process 1000+ faces simultaneously with our locally-optimized AI. Built to handle the vibrant energy of Moroccan celebrations.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-3">Privacy Focus</h3>
              <p className="text-gray-600 dark:text-white/60">
                Developed with Moroccan privacy values at its core. All data processing happens locally, ensuring guest privacy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="relative border-t border-gray-200 dark:border-white/10">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1512632578888-169bbbc64f33"
            alt="Moroccan Celebration Background"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <h2 className="text-3xl sm:text-4xl font-light text-center mb-6">Trusted Across Morocco</h2>
          <p className="text-center text-lg text-gray-600 dark:text-white/60 max-w-3xl mx-auto mb-12">
            From traditional weddings in Fez to international conferences in Casablanca
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <div className="flex flex-col items-center text-center">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full object-cover mb-6 border-4 border-emerald-100 dark:border-emerald-900"
                  />
                  <p className="text-lg font-light italic mb-6">
                    "{testimonial.quote}"
                  </p>
                  <div className="mt-auto">
                    <div className="font-medium text-gray-900 dark:text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative border-t border-gray-200 dark:border-white/10 bg-gradient-to-r from-emerald-800 to-emerald-600 dark:from-emerald-900 dark:to-emerald-700">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#moroccan-pattern)" />
          </svg>
          <defs>
            <pattern id="moroccan-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <path d="M10,0 L20,10 L10,20 L0,10 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight mb-4 sm:mb-6 text-white">
              Ready to Transform Your Events?
            </h2>
            <p className="text-white/80 text-lg sm:text-xl mb-8 sm:mb-12 leading-relaxed">
              Join Morocco's leading venues, event planners, and businesses using our AI recognition technology.
            </p>
            <button
              onClick={handleRequestDemo}
              className="inline-flex items-center bg-white text-emerald-800 px-8 sm:px-12 py-4 text-sm tracking-wider hover:bg-gray-100 transition-colors group"
            >
              Schedule Consultation
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img src={isDarkMode ? "/logo_2.png" : "/logo_1.png"} alt="Moroccan Event Recognition" className="h-8 w-auto" />
              <span className="ml-2 text-sm text-gray-600 dark:text-white/60">Proudly Made in Morocco 🇲🇦</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 sm:gap-8 text-sm text-gray-600 dark:text-white/60">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a>
              <span>© 2025  Unforgettable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};