"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('iris_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const logoSrc = theme === 'light' ? '/iris_logo.jpeg' : '/dark_logo.jpeg';

  return (
    <footer className="border-t border-white/5 bg-transparent pt-16 pb-12 px-6 md:px-12 text-xs text-[#C4B5FD]/50 font-light mt-auto w-full relative z-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-left">
        {/* Branding Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {/* Hexagonal Iris Logo */}
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
              <Image 
                src={logoSrc} 
                alt="IRIS 365 Logo" 
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-heading font-black text-lg tracking-wide uppercase flex items-center gap-1.5 select-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C4B5FD] to-[#8B5CF6]">IRIS</span>
              <span className="text-white">365</span>
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#C4B5FD]/60 font-sans">
            Campus Intelligence Operating System automates academic operations, security, cashless billing, and transit telemetry.
          </p>
          <span className="text-[9px] font-mono uppercase bg-white/5 border border-white/10 text-[#C4B5FD] px-2 py-0.5 rounded-md self-start">
            ISO 9001:2015 Compliant
          </span>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-4">Quick Links</h4>
          <ul className="flex flex-col gap-2.5 text-[11px]">
            <li><Link href="/" className="hover:text-white transition-colors">Home Landing</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/request-demo" className="hover:text-white transition-colors">Request a Demo</Link></li>
          </ul>
        </div>

        {/* Ecosystem Core */}
        <div>
          <h4 className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-4">Ecosystem Core</h4>
          <ul className="flex flex-col gap-2.5 text-[11px]">
            <li><Link href="/#features" className="hover:text-white transition-colors">Campus Core Attendance</Link></li>
            <li><Link href="/#features" className="hover:text-white transition-colors">Canteen Pay Ledger</Link></li>
            <li><Link href="/about#cyber-command" className="hover:text-white transition-colors">FitZone Wellness Logs</Link></li>
            <li><Link href="/about#cyber-command" className="hover:text-white transition-colors">Transit Live GPS Socket</Link></li>
          </ul>
        </div>

        {/* Corporate details */}
        <div>
          <h4 className="font-heading font-bold text-white uppercase tracking-wider text-[11px] mb-4">Corporate Office</h4>
          <p className="text-[11px] leading-relaxed mb-3 font-sans">
            SIN Education and Technology Pvt. Ltd.<br />
            Jodhpur, Rajasthan - 342001
          </p>
          <div className="flex flex-col gap-1.5 font-mono text-[9px]">
            <span className="block">Web: <a href="https://sintechnologies.in" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-white underline">sintechnologies.in</a></span>
            <span className="block">Email: <a href="mailto:contact@sintechnologies.in" className="text-purple-300 hover:text-white underline">contact@sintechnologies.in</a></span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-[10px]">
        <p>&copy; {new Date().getFullYear()} SIN Education and Technology Pvt. Ltd. All rights reserved.</p>
        <div className="flex gap-4 text-[#C4B5FD]/40">
          <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
          <span>&bull;</span>
          <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
          <span>&bull;</span>
          <span className="hover:text-white transition-colors cursor-pointer">SLA Agreement</span>
        </div>
      </div>
    </footer>
  );
}
