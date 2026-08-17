"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, GraduationCap, Menu, X } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolledTop, setIsScrolledTop] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('iris_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const logoSrc = theme === 'light' ? '/iris_logo.jpeg' : '/dark_logo.jpeg';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolledTop(window.scrollY < 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomeActive = pathname === '/' && isScrolledTop;
  const isAboutActive = pathname === '/about';
  const isContactActive = pathname === '/contact';
  const isRequestDemoActive = pathname === '/request-demo';
  const isModulesActive = pathname === '/modules';

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  const getLinkClass = (isActive: boolean) => 
    `relative py-2 text-xs uppercase tracking-wider font-semibold transition-colors hover:text-white ${
      isActive ? 'text-white font-bold' : 'text-[#C4B5FD]/75'
    }`;

  const renderActiveUnderline = (isActive: boolean) => 
    isActive && (
      <span className="absolute bottom-[-18px] left-0 right-0 h-[2px] bg-[#8A2BE2] shadow-[0_0_8px_#8A2BE2] rounded-full"></span>
    );

  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-[#0D0A1A]/85 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between transition-all duration-300">
      {/* Brand logo */}
      <Link href="/" onClick={handleHomeClick} className="flex items-center gap-4 hover:opacity-90 transition-opacity">
        {/* Stylized Hexagonal Iris Logo */}
        <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
          <img 
            src={logoSrc} 
            alt="IRIS 365 Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Brand Text */}
        <span className="font-heading font-black text-2xl tracking-wide uppercase flex items-center gap-1.5 select-none">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C4B5FD] to-[#8B5CF6]">IRIS</span>
          <span className="text-white">365</span>
        </span>
      </Link>

      {/* Desktop Grouped Right Side: Nav + Divider + Actions */}
      <div className="hidden xl:flex items-center gap-8">
        <nav className="flex items-center gap-8">
          <Link 
            href="/" 
            onClick={handleHomeClick}
            className={getLinkClass(isHomeActive)}
          >
            <span>Home</span>
            {renderActiveUnderline(isHomeActive)}
          </Link>
          
          <Link href="/#features" className={getLinkClass(false)}>
            <span>Features</span>
          </Link>

          <Link href="/modules" className={getLinkClass(isModulesActive)}>
            <span>Modules</span>
            {renderActiveUnderline(isModulesActive)}
          </Link>
          
          <Link 
            href="/about" 
            className={getLinkClass(isAboutActive)}
          >
            <span>About Us</span>
            {renderActiveUnderline(isAboutActive)}
          </Link>
          
          <Link 
            href="/contact" 
            className={getLinkClass(isContactActive)}
          >
            <span>Contact Us</span>
            {renderActiveUnderline(isContactActive)}
          </Link>
          
          <Link 
            href="/request-demo" 
            className={getLinkClass(isRequestDemoActive)}
          >
            <span>Request Demo</span>
            {renderActiveUnderline(isRequestDemoActive)}
          </Link>
          
          <Link 
            href="/home" 
            className="flex items-center gap-1.5 text-[#06B6D4] hover:text-white transition-colors font-semibold text-xs uppercase tracking-wider"
          >
            <GraduationCap className="w-4 h-4 text-[#06B6D4]" /> 
            <span>Apply Now</span>
          </Link>
        </nav>

        {/* Vertical divider */}
        <span className="h-5 w-[1px] bg-white/10 block"></span>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login?fresh=1" className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold tracking-wide transition-all">
            Dashboard Sign In
          </Link>
          <Link href="/login?fresh=1" className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] hover:brightness-110 text-xs font-bold tracking-wide transition-all shadow-md shadow-[#6C2BD9]/20">
            Launch Portal →
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Trigger */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="xl:hidden text-[#C4B5FD] hover:text-white transition-colors p-1"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-[68px] left-0 w-full bg-[#0D0A1A]/95 backdrop-blur-xl border-b border-white/8 py-6 px-8 flex flex-col gap-5 xl:hidden shadow-lg shadow-black/40 z-50">
          <Link 
            href="/" 
            onClick={handleHomeClick}
            className={`flex items-center gap-2 text-sm font-semibold tracking-wide ${isHomeActive ? 'text-[#06B6D4]' : 'hover:text-[#8B5CF6]'}`}
          >
            <span>Home</span>
          </Link>
          <Link 
            href="/#features" 
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold tracking-wide hover:text-[#8B5CF6]"
          >
            Features
          </Link>
          <Link 
            href="/modules" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold tracking-wide ${isModulesActive ? 'text-[#06B6D4]' : 'hover:text-[#8B5CF6]'}`}
          >
            Modules
          </Link>
          <Link 
            href="/about" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold tracking-wide ${isAboutActive ? 'text-[#06B6D4]' : 'hover:text-[#8B5CF6]'}`}
          >
            About Us
          </Link>
          <Link 
            href="/contact" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold tracking-wide ${isContactActive ? 'text-[#06B6D4]' : 'hover:text-[#8B5CF6]'}`}
          >
            Contact Us
          </Link>
          <Link 
            href="/request-demo" 
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-semibold tracking-wide ${isRequestDemoActive ? 'text-[#06B6D4]' : 'hover:text-[#8B5CF6]'}`}
          >
            Request Demo
          </Link>
          <Link 
            href="/home" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-1.5 text-[#06B6D4] text-sm font-semibold hover:text-white"
          >
            <GraduationCap className="w-4 h-4" /> Apply Now
          </Link>
          <hr className="border-white/5" />
          <div className="flex flex-col gap-3">
            <Link 
              href="/login?fresh=1" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold"
            >
              Dashboard Sign In
            </Link>
            <Link 
              href="/login?fresh=1" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 rounded-xl bg-gradient-to-r from-[#6C2BD9] to-[#8B5CF6] text-xs font-bold"
            >
              Launch Portal →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
