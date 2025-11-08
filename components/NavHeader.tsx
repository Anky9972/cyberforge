// Navigation Header Component with animations and responsive design
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, ChevronDown, Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavHeaderProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onNavigate?: (page: 'landing' | 'dashboard' | 'docs' | 'pricing' | 'about') => void;
  transparent?: boolean;
}

export const NavHeader: React.FC<NavHeaderProps> = ({ 
  onGetStarted, 
  onLogin,
  onNavigate,
  transparent = false 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { isAuthenticated, user, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  const navLinks = [
    { 
      name: 'Features', 
      href: '#features',
      dropdown: [
        { name: 'AST Analysis', href: '#ast-analysis', icon: '🔍' },
        { name: 'Dynamic Fuzzing', href: '#fuzzing', icon: '⚡' },
        { name: 'CVE Matching', href: '#cve', icon: '🛡️' },
        { name: 'Knowledge Graph', href: '#graph', icon: '🕸️' },
      ]
    },
    { name: 'Pricing', href: 'pricing', page: 'pricing' as const },
    { name: 'Docs', href: 'docs', page: 'docs' as const },
    { name: 'About', href: 'about', page: 'about' as const },
  ];

  const handleNavClick = (href: string, page?: 'docs' | 'pricing' | 'about') => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    
    if (page && onNavigate) {
      onNavigate(page);
      return;
    }
    
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !transparent
            ? 'bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="relative">
                <Shield className="w-8 h-8 lg:w-10 lg:h-10 text-blue-500" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 border-2 border-blue-500/30 rounded-full"
                />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
                  FuzzForge
                </h1>
                <p className="text-xs text-gray-400 hidden sm:block">AI Security Platform</p>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => link.dropdown && setActiveDropdown(link.name)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <motion.a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href, (link as any).page);
                    }}
                    className="text-gray-300 hover:text-white transition-colors font-medium flex items-center gap-1 cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                  >
                    {link.name}
                    {link.dropdown && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        activeDropdown === link.name ? 'rotate-180' : ''
                      }`} />
                    )}
                  </motion.a>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {link.dropdown && activeDropdown === link.name && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-lg border border-gray-700 rounded-xl shadow-xl overflow-hidden"
                      >
                        {link.dropdown.map((item, index) => (
                          <motion.a
                            key={item.name}
                            href={item.href}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavClick(item.href);
                            }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors cursor-pointer"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ x: 5 }}
                          >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-gray-300 hover:text-white">{item.name}</span>
                          </motion.a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              {!isAuthenticated ? (
                <>
                  <motion.button
                    onClick={onLogin}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 text-gray-300 hover:text-white transition-colors font-medium"
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    onClick={onGetStarted}
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
                  >
                    Get Started
                  </motion.button>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        {user?.firstName || user?.username}
                      </p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {(user?.firstName?.[0] || user?.username[0] || 'U').toUpperCase()}
                    </div>
                  </div>
                  <motion.button
                    onClick={logout}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors font-medium"
                  >
                    Logout
                  </motion.button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 overflow-hidden"
            >
              <div className="container mx-auto px-4 py-6 space-y-4">
                {/* Mobile Nav Links */}
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(link.href, (link as any).page);
                      }}
                      className="block py-3 text-gray-300 hover:text-white transition-colors font-medium"
                    >
                      {link.name}
                    </a>
                    {link.dropdown && (
                      <div className="ml-4 mt-2 space-y-2">
                        {link.dropdown.map((item) => (
                          <a
                            key={item.name}
                            href={item.href}
                            onClick={(e) => {
                              e.preventDefault();
                              handleNavClick(item.href);
                            }}
                            className="flex items-center gap-2 py-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <span>{item.icon}</span>
                            <span className="text-sm">{item.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Mobile CTA */}
                <div className="pt-4 border-t border-gray-800 space-y-3">
                  {!isAuthenticated ? (
                    <>
                      <motion.button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onLogin?.();
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-3 px-6 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
                      >
                        Sign In
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onGetStarted?.();
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold shadow-lg"
                      >
                        Get Started
                      </motion.button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {(user?.firstName?.[0] || user?.username[0] || 'U').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {user?.firstName || user?.username}
                          </p>
                          <p className="text-sm text-gray-400">{user?.email}</p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          logout();
                        }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-3 px-6 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 font-semibold"
                      >
                        Logout
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-800">
                  {[
                    { icon: Github, href: 'https://github.com' },
                    { icon: Twitter, href: 'https://twitter.com' },
                    { icon: Linkedin, href: 'https://linkedin.com' },
                    { icon: Mail, href: 'mailto:support@fuzzforge.dev' },
                  ].map((social, index) => (
                    <motion.a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer to prevent content from going under fixed nav */}
      <div className="h-16 lg:h-20"></div>
    </>
  );
};
