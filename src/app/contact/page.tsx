"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Phone, 
  Globe, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Youtube, 
  Check, 
  MapPin, 
  Building2, 
  Mail, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  Users
} from 'lucide-react';

interface FormValues {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  institutionName: string;
  designation: string;
  message: string;
  consent: boolean;
}

export default function ContactPage() {
  const [formValues, setFormValues] = useState<FormValues>({
    firstName: '',
    lastName: '',
    contactNumber: '',
    email: '',
    institutionName: '',
    designation: '',
    message: '',
    consent: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [showToast, setShowToast] = useState(false);

  // Auto-dismiss toast notification after 4 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormValues(prev => ({ ...prev, consent: checked }));
    if (errors.consent) {
      setErrors(prev => ({ ...prev, consent: '' }));
    }
  };

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!formValues.firstName.trim()) tempErrors.firstName = "This field is required";
    if (!formValues.lastName.trim()) tempErrors.lastName = "This field is required";
    if (!formValues.contactNumber.trim()) tempErrors.contactNumber = "This field is required";
    if (!formValues.email.trim()) {
      tempErrors.email = "This field is required";
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      tempErrors.email = "Invalid email format";
    }
    if (!formValues.institutionName.trim()) tempErrors.institutionName = "This field is required";
    if (!formValues.designation) tempErrors.designation = "This field is required";
    if (!formValues.message.trim()) tempErrors.message = "This field is required";
    if (!formValues.consent) tempErrors.consent = "This field is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitStatus('sending');
      
      // Simulate submission delay
      setTimeout(() => {
        setSubmitStatus('success');
        setShowToast(true);
        
        // Reset form values
        setFormValues({
          firstName: '',
          lastName: '',
          contactNumber: '',
          email: '',
          institutionName: '',
          designation: '',
          message: '',
          consent: false
        });

        // Revert submit button back to idle after 3 seconds
        setTimeout(() => {
          setSubmitStatus('idle');
        }, 3000);
      }, 1500);
    }
  };

  // Demo scroll handler
  const handleDemoSetup = () => {
    const formCard = document.getElementById('contact-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setFormValues(prev => ({ ...prev, designation: 'Director' }));
      if (errors.designation) {
        setErrors(prev => ({ ...prev, designation: '' }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050010] text-white flex flex-col font-sans antialiased relative overflow-x-hidden pb-16">
      {/* Ambient Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40 mix-blend-screen"
        src="/bg-video.mp4"
      />
      {/* Background Google Fonts Loader */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Inter:wght@300;400;500;600;700&display=swap');
        .font-orbitron {
          font-family: 'Orbitron', sans-serif;
        }
        .font-sans {
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      {/* Cyber Mesh & Ambient Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(138,43,226,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(138,43,226,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none -z-10"></div>
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#8A2BE2]/8 blur-[130px] -top-100 -left-100 pointer-events-none -z-10"></div>
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[#5B14B7]/6 blur-[150px] bottom-[-20%] right-[-10%] pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <Header />

      {/* Hero Header Section */}
      <section className="max-w-6xl mx-auto w-full px-6 pt-24 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-md mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8A2BE2] animate-pulse"></span>
            <span className="text-[9px] font-orbitron font-bold tracking-widest text-[#C4B5FD] uppercase">GET IN TOUCH</span>
          </div>

          {/* Title */}
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl text-white uppercase tracking-wider mb-4 drop-shadow-[0_0_15px_rgba(138,43,226,0.2)]">
            Contact Us
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#C4B5FD]/75 max-w-2xl leading-relaxed">
            Have a question about IRIS 365? Want to see it live at your institution? Our team is ready to help.
          </p>
        </motion.div>
      </section>

      {/* Layout Architecture Grid */}
      <main className="max-w-6xl mx-auto w-full px-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (58% width / md:col-span-7) */}
        <motion.div 
          id="contact-form-card"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-7 p-6 sm:p-8 rounded-[16px] bg-white/5 border border-white/12 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(138,43,226,0.05)] text-left"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* 1. First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">First Name *</label>
                <input 
                  type="text" 
                  name="firstName"
                  value={formValues.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Harshvardhan"
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/3 border text-xs text-white placeholder-white/20 outline-none transition-all duration-300 ${
                    errors.firstName 
                      ? 'border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15' 
                      : 'border-white/10 focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10'
                  }`}
                />
                {errors.firstName && (
                  <div className="flex items-center gap-1 mt-1 text-[#EF4444] text-[10px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.firstName}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Last Name *</label>
                <input 
                  type="text" 
                  name="lastName"
                  value={formValues.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Purohit"
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/3 border text-xs text-white placeholder-white/20 outline-none transition-all duration-300 ${
                    errors.lastName 
                      ? 'border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15' 
                      : 'border-white/10 focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10'
                  }`}
                />
                {errors.lastName && (
                  <div className="flex items-center gap-1 mt-1 text-[#EF4444] text-[10px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.lastName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Contact Number & Email ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Contact Number *</label>
                <input 
                  type="text" 
                  name="contactNumber"
                  value={formValues.contactNumber}
                  onChange={handleChange}
                  placeholder="e.g. +91 73572 88703"
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/3 border text-xs text-white placeholder-white/20 outline-none transition-all duration-300 ${
                    errors.contactNumber 
                      ? 'border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15' 
                      : 'border-white/10 focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10'
                  }`}
                />
                {errors.contactNumber && (
                  <div className="flex items-center gap-1 mt-1 text-[#EF4444] text-[10px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.contactNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Email ID *</label>
                <input 
                  type="email" 
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  placeholder="e.g. contact@sintechnologies.in"
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/3 border text-xs text-white placeholder-white/20 outline-none transition-all duration-300 ${
                    errors.email 
                      ? 'border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15' 
                      : 'border-white/10 focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10'
                  }`}
                />
                {errors.email && (
                  <div className="flex items-center gap-1 mt-1 text-[#EF4444] text-[10px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Institution Name & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Institution Name *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    name="institutionName"
                    value={formValues.institutionName}
                    onChange={handleChange}
                    placeholder="e.g. SIET Jodhpur"
                    className={`w-full px-4 py-2.5 rounded-xl bg-white/3 border text-xs text-white placeholder-white/20 outline-none transition-all duration-300 ${
                      errors.institutionName 
                        ? 'border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15' 
                        : 'border-white/10 focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10'
                    }`}
                  />
                  <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                </div>
                {errors.institutionName && (
                  <div className="flex items-center gap-1 mt-1 text-[#EF4444] text-[10px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.institutionName}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Designation *</label>
                <select 
                  name="designation"
                  value={formValues.designation}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/3 border text-xs text-white placeholder-white/20 outline-none transition-all duration-300 appearance-none ${
                    errors.designation 
                      ? 'border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15' 
                      : 'border-white/10 focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10'
                  }`}
                  style={{
                    backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23ffffff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                    backgroundPosition: 'right 1rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25em auto',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="" disabled className="text-gray-900 bg-white">Select Designation</option>
                  <option value="Director" className="text-gray-900 bg-white">Director</option>
                  <option value="Principal" className="text-gray-900 bg-white">Principal</option>
                  <option value="Administrator" className="text-gray-900 bg-white">Administrator</option>
                  <option value="Faculty" className="text-gray-900 bg-white">Faculty</option>
                  <option value="Student" className="text-gray-900 bg-white">Student</option>
                  <option value="IT Manager" className="text-gray-900 bg-white">IT Manager</option>
                  <option value="Other" className="text-gray-900 bg-white">Other</option>
                </select>
                {errors.designation && (
                  <div className="flex items-center gap-1 mt-1 text-[#EF4444] text-[10px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.designation}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Message Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Message *</label>
              <textarea 
                name="message"
                value={formValues.message}
                onChange={handleChange}
                placeholder="How can IRIS 365 support your institutional goals?"
                rows={4}
                className={`w-full px-4 py-2.5 rounded-xl bg-white/3 border text-xs text-white placeholder-white/20 outline-none transition-all duration-300 resize-none ${
                  errors.message 
                    ? 'border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15' 
                    : 'border-white/10 focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10'
                }`}
              />
              {errors.message && (
                <div className="flex items-center gap-1 mt-1 text-[#EF4444] text-[10px]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.message}</span>
                </div>
              )}
            </div>

            {/* 5. Consent Checkbox */}
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-3 cursor-pointer group mt-2">
                <input 
                  type="checkbox"
                  name="consent"
                  checked={formValues.consent}
                  onChange={handleCheckboxChange}
                  className="sr-only peer"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-300 peer-focus:ring-2 peer-focus:ring-[#8A2BE2]/20 ${
                  formValues.consent 
                    ? 'bg-[#8A2BE2] border-[#8A2BE2]' 
                    : errors.consent 
                      ? 'border-[#EF4444] bg-[#EF4444]/5' 
                      : 'border-white/20 bg-white/3 group-hover:border-[#8A2BE2]'
                }`}>
                  {formValues.consent && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                    </motion.div>
                  )}
                </div>
                <span className="text-[11px] text-[#C4B5FD]/70 select-none leading-tight font-normal">
                  I agree to receive updates and communications from SIN Education and Technology Pvt. Ltd.
                </span>
              </label>
              {errors.consent && (
                <div className="flex items-center gap-1 mt-1.5 pl-7 text-[#EF4444] text-[10px]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.consent}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-4">
              <button 
                type="submit"
                disabled={submitStatus === 'sending'}
                className={`w-full py-3.5 rounded-xl text-xs font-bold font-orbitron uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                  submitStatus === 'success' 
                    ? 'bg-[#10B981] text-white shadow-[#10B981]/25 hover:brightness-105' 
                    : submitStatus === 'sending'
                      ? 'bg-gradient-to-r from-[#5B14B7] to-[#8A2BE2] text-white opacity-80 cursor-wait animate-pulse'
                      : 'bg-gradient-to-r from-[#5B14B7] to-[#8A2BE2] hover:brightness-110 text-white shadow-[#8A2BE2]/20 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {submitStatus === 'success' ? (
                  <>
                    <Check className="w-4 h-4 text-white stroke-[2.5px]" />
                    <span>Message Sent!</span>
                  </>
                ) : submitStatus === 'sending' ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </motion.div>

        {/* Right Column (38% width / md:col-span-5) */}
        <div className="md:col-span-5 flex flex-col gap-6 w-full text-left">
          
          {/* Card 1: Reach Us */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 rounded-[16px] bg-white/5 border border-white/12 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(138,43,226,0.05)] border-l-[3px] border-l-[#5B14B7] flex flex-col gap-5"
          >
            <div>
              <h3 className="font-orbitron font-bold text-xs uppercase tracking-widest text-purple-300">Reach Us</h3>
              <p className="text-[10px] font-mono text-[#C4B5FD]/50 uppercase mt-0.5">DIRECT ENQUIRY PORTAL</p>
            </div>

            <div className="flex flex-col gap-4 text-xs font-mono">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-white/5 border border-white/8 text-purple-300 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <a href="tel:+917357288703" className="font-bold text-white hover:text-[#8A2BE2] transition-colors block">+91 73572 88703</a>
                  <span className="text-[10px] text-[#C4B5FD]/60 mt-0.5 block">Mon–Sat, 10AM–6PM IST</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-white/5 border border-white/8 text-purple-300 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <a href="https://sintechnologies.in" target="_blank" rel="noopener noreferrer" className="font-bold text-white hover:text-[#8A2BE2] transition-colors flex items-center gap-1.5">
                    <span>sintechnologies.in</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#C4B5FD]/45" />
                  </a>
                  <span className="text-[10px] text-[#C4B5FD]/60 mt-0.5 block">Enterprise Operations Gateway</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Request Demo */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 rounded-[16px] bg-white/5 border border-white/12 backdrop-blur-xl shadow-[inset_0_0_12px_rgba(138,43,226,0.18),0_8px_32px_rgba(138,43,226,0.05)] border-r-[3.5px] border-r-[#8A2BE2] flex flex-col gap-4"
          >
            <div>
              <h3 className="font-orbitron font-bold text-sm tracking-wide text-white uppercase">Request a Personalised Demo</h3>
              <p className="text-[10px] text-[#C4B5FD]/75 mt-1 leading-relaxed">
                Want to see how IRIS 365 automates operations? Trigger our instant routing selector.
              </p>
            </div>
            
            <button 
              onClick={handleDemoSetup}
              className="w-full py-2.5 rounded-xl border border-[#8A2BE2]/40 bg-[#8A2BE2]/10 hover:bg-[#8A2BE2]/20 hover:border-[#8A2BE2]/70 text-xs font-bold text-white font-orbitron uppercase tracking-wider transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              Get Custom Demo Setup
            </button>
          </motion.div>

          {/* Card 3: About SIN Education & Tech */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 rounded-[16px] bg-white/5 border border-white/12 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(138,43,226,0.05)] border-l-[3px] border-l-[#0F766E] flex flex-col gap-4"
          >
            <div>
              <h3 className="font-orbitron font-bold text-xs uppercase tracking-widest text-teal-400">CORPORATE PROFILE</h3>
              <p className="text-[10px] font-mono text-[#C4B5FD]/50 uppercase mt-0.5">SIN Education & Technology Pvt. Ltd.</p>
            </div>

            <p className="text-xs text-[#C4B5FD]/80 leading-relaxed font-normal">
              Founded in 2024 and DPIIT registered, SIN Education & Technology Pvt. Ltd. bridges the gaps in traditional education by leveraging AI, machine learning, and data analytics to optimize institutional workflows and student outcomes.
            </p>

            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/3 border border-white/8 text-[9px] font-mono text-white">
                <MapPin className="w-3 h-3 text-[#10B981]" />
                <span>Jodhpur, Rajasthan</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/3 border border-white/8 text-[9px] font-mono text-white">
                <Users className="w-3 h-3 text-[#8A2BE2]" />
                <span>51–200 Employees</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/3 border border-white/8 text-[9px] font-mono text-white">
                <Check className="w-3 h-3 text-[#10B981]" />
                <span>ISO 9001:2015 Certified</span>
              </span>
            </div>
          </motion.div>

          {/* Card 4: Social Channels */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 rounded-[16px] bg-white/5 border border-white/12 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(138,43,226,0.05)] flex flex-col gap-4"
          >
            <div>
              <h3 className="font-orbitron font-bold text-xs uppercase tracking-widest text-[#C4B5FD]/80">Connect Globally</h3>
              <p className="text-[10px] font-mono text-[#C4B5FD]/40 uppercase mt-0.5">SOCIAL TELEMETRY LINKS</p>
            </div>

            <div className="flex items-center gap-3">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full border border-white/10 hover:border-[#8A2BE2] hover:bg-[#8A2BE2]/10 flex items-center justify-center text-white/60 hover:text-white hover:scale-110 transition-all duration-300 shadow-md"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full border border-white/10 hover:border-[#8A2BE2] hover:bg-[#8A2BE2]/10 flex items-center justify-center text-white/60 hover:text-white hover:scale-110 transition-all duration-300 shadow-md"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href="https://x.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full border border-white/10 hover:border-[#8A2BE2] hover:bg-[#8A2BE2]/10 flex items-center justify-center text-white/60 hover:text-white hover:scale-110 transition-all duration-300 shadow-md"
                aria-label="X (Twitter)"
              >
                <span className="font-bold text-[13px] tracking-tighter">𝕏</span>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full border border-white/10 hover:border-[#8A2BE2] hover:bg-[#8A2BE2]/10 flex items-center justify-center text-white/60 hover:text-white hover:scale-110 transition-all duration-300 shadow-md"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full border border-white/10 hover:border-[#8A2BE2] hover:bg-[#8A2BE2]/10 flex items-center justify-center text-white/60 hover:text-white hover:scale-110 transition-all duration-300 shadow-md"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Success Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-[99999] p-4 rounded-xl border border-[#10B981]/30 bg-[#050010] shadow-[0_8px_32px_rgba(16,185,129,0.15)] flex items-center gap-3.5 max-w-sm"
          >
            <div className="w-8 h-8 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shrink-0">
              <Check className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <div>
              <h5 className="font-orbitron font-bold text-[10px] tracking-wider text-[#10B981] uppercase">Message Received!</h5>
              <p className="text-[11px] text-[#C4B5FD] mt-0.5 leading-normal font-normal">
                We'll get back to you within 24 hours.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER SECTION */}
      <Footer />
    </div>
  );
}
