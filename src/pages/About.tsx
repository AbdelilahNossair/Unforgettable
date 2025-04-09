import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Globe, Sun, Moon, Menu, X, ChevronRight, Heart, AtSign, MapPin, Users } from 'lucide-react';
import { useAuthStore } from '../store';

export const About: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('mission');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleThemeToggle = () => {
    toggleDarkMode();
    localStorage.setItem('theme-preference', (!isDarkMode).toString());
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-lg z-50 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center">
              <Link to="/">
                <img 
                  src={isDarkMode ? "/logo_2.png" : "/logo_1.png"} 
                  alt="Moroccan Event Recognition" 
                  className="h-8 w-auto" 
                />
              </Link>
              <span className="ml-2 font-semibold text-emerald-700 dark:text-emerald-500">Events with a New Breath</span>
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

      {/* Hero Section */}
      <div className="relative pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80"
            alt="Moroccan Architecture"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/90 dark:from-black dark:via-black/95 dark:to-black/90" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20">
          <div className="flex justify-end">
            <div className="py-2 px-4 bg-emerald-700 text-white text-sm rounded-full mb-6">
              Proudly Made in Morocco 🇲🇦
            </div>
          </div>
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-light tracking-tight">
              <span className="block">About</span>
              <span className="block mt-2 py-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 dark:from-emerald-400 dark:via-emerald-500 dark:to-emerald-600">
                Unforgettable
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl font-light leading-relaxed text-gray-600 dark:text-white/70 max-w-2xl">
              Morocco's first AI-powered event recognition platform, transforming how moments are captured and experienced at weddings, festivals, and professional gatherings across the nation.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-16 sm:top-20 bg-white/90 dark:bg-black/90 backdrop-blur-lg z-30 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-hide">
            <button 
              onClick={() => scrollToSection('mission')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${activeSection === 'mission' ? 'text-emerald-700 dark:text-emerald-500 border-b-2 border-emerald-700 dark:border-emerald-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'} transition-colors`}
            >
              Our Mission
            </button>
            <button 
              onClick={() => scrollToSection('story')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${activeSection === 'story' ? 'text-emerald-700 dark:text-emerald-500 border-b-2 border-emerald-700 dark:border-emerald-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'} transition-colors`}
            >
              Our Story
            </button>
            <button 
              onClick={() => scrollToSection('technology')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${activeSection === 'technology' ? 'text-emerald-700 dark:text-emerald-500 border-b-2 border-emerald-700 dark:border-emerald-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'} transition-colors`}
            >
              Our Technology
            </button>
            <button 
              onClick={() => scrollToSection('team')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${activeSection === 'team' ? 'text-emerald-700 dark:text-emerald-500 border-b-2 border-emerald-700 dark:border-emerald-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'} transition-colors`}
            >
              Our Team
            </button>
            <button 
              onClick={() => scrollToSection('privacy')}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${activeSection === 'privacy' ? 'text-emerald-700 dark:text-emerald-500 border-b-2 border-emerald-700 dark:border-emerald-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'} transition-colors`}
            >
              Privacy Commitment
            </button>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section id="mission" className="py-16 sm:py-24 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-light mb-6">Our Mission & Vision</h2>
              <div className="space-y-6 text-gray-600 dark:text-white/70">
                <p className="text-lg leading-relaxed">
                  At Unforgettable, our mission is to revolutionize how Moroccans experience, capture, and remember their most important moments through locally-developed AI technology that understands our unique cultural context.
                </p>
                <p className="text-lg leading-relaxed">
                  We envision a future where every significant moment at weddings, festivals, and professional events across Morocco and beyond is effortlessly captured, organized, and made accessible through technology that respects our traditions while embracing innovation.
                </p>
                <div className="pt-4">
                  <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">Core Values</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Heart className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                      <span><strong className="font-medium">Cultural Authenticity</strong> - Building technology that truly understands Moroccan expressions, gatherings, and traditions</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                      <span><strong className="font-medium">Respect for Privacy</strong> - Protecting personal data with the highest standards of security and consent</span>
                    </li>
                    <li className="flex items-start">
                      <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                      <span><strong className="font-medium">Local Innovation</strong> - Advancing Morocco's technological landscape while solving uniquely local challenges</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="relative h-[300px] sm:h-[500px] rounded-lg overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1504198266287-1659872e6590?auto=format&fit=crop&q=80"
                alt="Moroccan Celebration"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <span className="text-sm uppercase tracking-wider font-medium bg-emerald-700 py-1 px-3 rounded-full">Our Purpose</span>
                <p className="mt-3 text-lg font-light">Preserving memories that define our cultural identity</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section id="story" className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-light mb-6">Our Story</h2>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-white/70">
              From a small idea in a Casablanca apartment to Morocco's leading event recognition platform
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-emerald-600 dark:bg-emerald-500 transform -translate-x-1/2"></div>
            
            {/* Timeline Items */}
            <div className="space-y-12 relative">
              {/* 2022 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="md:text-right md:pr-12 mb-8 md:mb-0">
                  <div className="hidden md:block absolute left-1/2 top-4 w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-500 transform -translate-x-1/2"></div>
                  <span className="inline-block bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400 py-1 px-3 rounded-full text-sm font-medium mb-3">2022</span>
                  <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">The Idea Takes Shape</h3>
                  <p className="text-gray-600 dark:text-white/70">
                    After struggling to organize photos from his sister's wedding, our founder Mohammed envisioned an AI solution that could understand Moroccan wedding traditions and automatically organize photos by family groups.
                  </p>
                </div>
                <div className="relative h-60 rounded-lg overflow-hidden md:ml-12">
                  <img
                    src="https://images.unsplash.com/photo-1581078426770-6d336e5de7bf?auto=format&fit=crop&q=80"
                    alt="Startup Beginnings"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* 2023 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="order-2 md:pl-12 mb-8 md:mb-0">
                  <div className="hidden md:block absolute left-1/2 top-4 w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-500 transform -translate-x-1/2"></div>
                  <span className="inline-block bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400 py-1 px-3 rounded-full text-sm font-medium mb-3">2023</span>
                  <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">From Vision to Reality</h3>
                  <p className="text-gray-600 dark:text-white/70">
                    Teaming up with AI specialists from Rabat's technology institute, we developed the first prototype and tested it at 15 weddings across Morocco, refining our algorithms to understand the nuances of Moroccan celebrations.
                  </p>
                </div>
                <div className="relative h-60 rounded-lg overflow-hidden order-1 md:mr-12">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80"
                    alt="Team Working"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* 2024 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="md:text-right md:pr-12 mb-8 md:mb-0">
                  <div className="hidden md:block absolute left-1/2 top-4 w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-500 transform -translate-x-1/2"></div>
                  <span className="inline-block bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400 py-1 px-3 rounded-full text-sm font-medium mb-3">2024</span>
                  <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">Expanding Horizons</h3>
                  <p className="text-gray-600 dark:text-white/70">
                    With growing demand, we expanded our AI to handle concerts and professional events. Our breakthrough came when we secured partnerships with three of Morocco's largest event venues and received investment from Casablanca's tech incubator.
                  </p>
                </div>
                <div className="relative h-60 rounded-lg overflow-hidden md:ml-12">
                  <img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80"
                    alt="Business Growth"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* 2025 */}
              <div className="md:grid md:grid-cols-2 md:gap-8 items-center">
                <div className="order-2 md:pl-12">
                  <div className="hidden md:block absolute left-1/2 top-4 w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-500 transform -translate-x-1/2"></div>
                  <span className="inline-block bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-400 py-1 px-3 rounded-full text-sm font-medium mb-3">2025</span>
                  <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">Today & Beyond</h3>
                  <p className="text-gray-600 dark:text-white/70">
                    Now serving over 500 events monthly across Morocco, our technology has evolved to become the standard for event recognition in North Africa. Our next step is expanding to neighboring countries while maintaining our commitment to cultural authenticity.
                  </p>
                </div>
                <div className="relative h-60 rounded-lg overflow-hidden order-1 md:mr-12">
                  <img
                    src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80"
                    alt="Modern Success"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-16 sm:py-24 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl sm:text-4xl font-light mb-6">Our Technology</h2>
              <div className="space-y-6 text-gray-600 dark:text-white/70">
                <p className="text-lg leading-relaxed">
                  Unforgettable's AI technology is built from the ground up in Morocco, specifically designed to understand the nuances of local events, faces, and cultural contexts that global solutions often miss.
                </p>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">Culturally-Aware Recognition</h3>
                    <p>
                      Our AI is trained on diverse Moroccan faces and traditional clothing, able to accurately identify individuals even in traditional attire, through crowd scenes, and in various lighting conditions typical of local celebrations.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">Family Grouping Intelligence</h3>
                    <p>
                      Beyond individual recognition, our system understands family connections and social groupings that are central to Moroccan events, automatically organizing photos by extended family groups.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                    <h3 className="text-xl font-medium mb-3 text-gray-900 dark:text-white">On-Device Processing</h3>
                    <p>
                      Privacy by design: our advanced algorithms run directly on local servers at venues, ensuring data never leaves the premises without explicit consent, adhering to both Moroccan privacy standards and global best practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-emerald-100 dark:bg-emerald-900 rounded-lg"></div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-100 dark:bg-emerald-900 rounded-lg"></div>
              <div className="relative h-[400px] sm:h-[600px] rounded-lg overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80"
                  alt="AI Technology"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg text-center text-white">
                      <div className="text-3xl font-light">99.7%</div>
                      <div className="text-xs mt-1">Recognition Accuracy</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg text-center text-white">
                      <div className="text-3xl font-light">1000+</div>
                      <div className="text-xs mt-1">Faces Per Second</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg text-center text-white">
                      <div className="text-3xl font-light">100%</div>
                      <div className="text-xs mt-1">Made in Morocco</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-light mb-6">Our Team</h2>
            <p className="text-lg leading-relaxed text-gray-600 dark:text-white/70">
              A diverse group of Moroccan engineers, designers, and cultural experts passionate about preserving memories through technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="h-64 relative">
                <img 
                  src="https://images.unsplash.com/photo-1627161683077-e34782c24d81?auto=format&fit=crop&q=80" 
                  alt="Mohammed El Fassi" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium mb-1">Mohammed El Fassi</h3>
                <div className="text-emerald-600 dark:text-emerald-400 mb-4">Founder & CEO</div>
                <p className="text-gray-600 dark:text-white/70 mb-4">
                  Former wedding photographer with a computer science background who experienced firsthand the challenges of event photography.
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Casablanca</span>
                </div>
              </div>
            </div>
            
            {/* Team Member 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="h-64 relative">
                <img 
                  src="https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80" 
                  alt="Amina Benjelloun" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium mb-1">Amina Benjelloun</h3>
                <div className="text-emerald-600 dark:text-emerald-400 mb-4">Chief Technology Officer</div>
                <p className="text-gray-600 dark:text-white/70 mb-4">
                  AI researcher with a PhD from Mohammed V University and 5 years at one of Morocco's leading technology companies.
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Rabat</span>
                </div>
              </div>
            </div>
            
            {/* Team Member 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="h-64 relative">
                <img 
                  src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&q=80" 
                  alt="Karim Alaoui" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-medium mb-1">Karim Alaoui</h3>
                <div className="text-emerald-600 dark:text-emerald-400 mb-4">Head of Cultural Integration</div>
                <p className="text-gray-600 dark:text-white/70 mb-4">
                  Anthropologist specializing in Moroccan celebrations who ensures our technology respects and enhances cultural traditions.
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Marrakech</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/team" className="inline-flex items-center text-emerald-700 dark:text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors">
              Meet our full team
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-16 sm:py-24 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-light mb-6">Our Privacy Commitment</h2>
              <div className="space-y-6 text-gray-600 dark:text-white/70">
                <p className="text-lg leading-relaxed">
                  At Unforgettable, we understand that privacy concerns are heightened when it comes to facial recognition technology. That's why we've built our platform with privacy and consent as foundational principles.
                </p>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">Our privacy practices include:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                      <span><strong className="font-medium">Explicit Consent</strong> - We only process data for individuals who have provided clear consent, typically through the event registration process</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                      <span><strong className="font-medium">On-Premises Processing</strong> - All recognition happens locally at the venue, with no data transmitted externally without permission</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                      <span><strong className="font-medium">Data Minimization</strong> - We only collect what's needed for the specific event functions requested</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                      <span><strong className="font-medium">Limited Retention</strong> - Recognition data is deleted after the event unless specifically requested otherwise</span>
                    </li>
                    <li className="flex items-start">
                      <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-500 mt-1 mr-3 flex-shrink-0" />
                      <span><strong className="font-medium">Transparency</strong> - Clear signage at events and easy opt-out options for attendees</span>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-4">
                  <Link
                    to="/privacy"
                    className="inline-flex items-center bg-emerald-700 dark:bg-emerald-500 text-white dark:text-black px-6 py-3 text-sm hover:bg-emerald-800 dark:hover:bg-emerald-400 transition-colors"
                  >
                    Read Full Privacy Policy
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80"
                alt="Data Privacy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <blockquote className="text-white text-xl font-light italic">
                  "Our technology enhances the celebration of cultural moments without compromising individual privacy."
                  <footer className="mt-2 text-sm not-italic">— Mohammed El Fassi, Founder</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className="relative border-t border-gray-200 dark:border-white/10 bg-gradient-to-r from-emerald-800 to-emerald-600 dark:from-emerald-900 dark:to-emerald-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight mb-6 text-white">
              Ready to Experience the Future of Events?
            </h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Whether you're planning a wedding, managing a festival, or organizing a business conference, our Moroccan-built AI technology can transform how memories are captured and experienced.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/register"
                className="inline-flex items-center bg-white text-emerald-800 px-8 py-4 text-sm tracking-wider hover:bg-gray-100 transition-colors w-full sm:w-auto justify-center"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center border border-white text-white px-8 py-4 text-sm tracking-wider hover:bg-white/10 transition-colors w-full sm:w-auto justify-center"
              >
                <AtSign className="mr-2 h-4 w-4" />
                Contact Us
              </Link>
            </div>
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
              <span>© 2025 Unforgettable</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};