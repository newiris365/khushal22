"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { 
  Check, 
  Sparkles, 
  AlertCircle, 
  Shield, 
  Cpu, 
  Zap, 
  Lock, 
  Activity, 
  Building2, 
  Mail, 
  Phone, 
  ArrowRight, 
  Star, 
  RefreshCw, 
  Home 
} from 'lucide-react';

type PlanType = 'Seed' | 'Campus' | 'University' | 'Enterprise';

interface FormValues {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  institutionName: string;
  designation: string;
  institutionSize: string;
  additionalNotes: string;
}

const PLANS_DATA = [
  {
    id: 'Seed' as PlanType,
    name: 'IRIS Seed',
    forWhom: 'Schools',
    price: '₹4,999',
    period: '/month',
    features: ['3 Modules Included', 'Setup Fee ₹15,000', 'Basic Role Dashboards', 'Email Support'],
    color: 'from-blue-500/20 to-[#8A2BE2]/10',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'Campus' as PlanType,
    name: 'IRIS Campus',
    forWhom: 'Colleges',
    price: '₹12,999',
    period: '/month',
    features: ['6 Modules Included', 'Setup Fee ₹35,000', 'Advanced Dashboards', 'Priority Webhook Logs', '24/7 SLA Support'],
    badge: 'MOST POPULAR',
    color: 'from-[#8A2BE2]/20 to-[#06B6D4]/10',
    borderColor: 'border-[#8A2BE2]/50'
  },
  {
    id: 'University' as PlanType,
    name: 'IRIS University',
    forWhom: 'Universities',
    price: '₹29,999',
    period: '/month',
    features: ['All Modules Included', 'Setup Fee ₹60,000', 'Multi-tenant Isolation Desk', 'Dedicated Server Dispatcher', 'Leaflet GPS Route Sync'],
    color: 'from-[#06B6D4]/20 to-[#10b981]/10',
    borderColor: 'border-[#06B6D4]/40'
  },
  {
    id: 'Enterprise' as PlanType,
    name: 'IRIS Enterprise',
    forWhom: 'White Label',
    price: 'Custom Pricing',
    period: '',
    features: ['Custom Tailored Modules', 'Dedicated Custom SLA', 'White-labeled Mobile Portal', 'Private Database Cluster', 'Infinite Student Scale'],
    color: 'from-teal-500/20 to-emerald-500/10',
    borderColor: 'border-teal-500/30'
  }
];

export default function RequestDemoPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('Campus');
  const [pricingStudents, setPricingStudents] = useState<number>(500);
  
  const [formValues, setFormValues] = useState<FormValues>({
    firstName: '',
    lastName: '',
    contactNumber: '',
    email: '',
    institutionName: '',
    designation: '',
    institutionSize: '500 - 1500',
    additionalNotes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [submittedValues, setSubmittedValues] = useState<{ firstName: string; lastName: string; email: string; plan: PlanType } | null>(null);

  // Synchronize formValues.institutionSize with pricingStudents count
  useEffect(() => {
    let size = '';
    if (pricingStudents < 500) size = '< 500';
    else if (pricingStudents <= 1500) size = '500 - 1500';
    else if (pricingStudents <= 5000) size = '1500 - 5000';
    else size = '5000+';
    
    setFormValues(prev => {
      if (prev.institutionSize !== size) {
        return { ...prev, institutionSize: size };
      }
      return prev;
    });
  }, [pricingStudents]);

  const handleSizeChange = (size: string) => {
    let students = 500;
    if (size === '< 500') students = 250;
    else if (size === '500 - 1500') students = 1000;
    else if (size === '1500 - 5000') students = 3000;
    else if (size === '5000+') students = 5000;
    
    setPricingStudents(students);
    setFormValues(prev => ({ ...prev, institutionSize: size }));
  };

  const handlePlanClick = (planId: PlanType) => {
    setSelectedPlan(planId);
    const formEl = document.getElementById('pricing');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'institutionSize') {
      handleSizeChange(value);
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const calculateCost = () => {
    if (selectedPlan === 'Enterprise') return 'Custom Estimate';
    
    let ratePerStudent = 12;
    if (selectedPlan === 'Seed') ratePerStudent = 8;
    if (selectedPlan === 'University') ratePerStudent = 15;

    return (pricingStudents * ratePerStudent).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      style: 'currency',
      currency: 'INR'
    });
  };

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!formValues.firstName.trim()) tempErrors.firstName = "First name is required";
    if (!formValues.lastName.trim()) tempErrors.lastName = "Last name is required";
    if (!formValues.contactNumber.trim()) tempErrors.contactNumber = "Contact number is required";
    
    if (!formValues.email.trim()) {
      tempErrors.email = "Work email is required";
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      tempErrors.email = "Invalid email format";
    }
    
    if (!formValues.institutionName.trim()) tempErrors.institutionName = "Institution name is required";
    if (!formValues.designation) tempErrors.designation = "Please select your designation";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitStatus('sending');
      
      // Simulate submission for 1.8 seconds
      setTimeout(() => {
        setSubmittedValues({
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          email: formValues.email,
          plan: selectedPlan
        });
        setSubmitStatus('success');
      }, 1800);
    }
  };

  const handleReset = () => {
    setFormValues({
      firstName: '',
      lastName: '',
      contactNumber: '',
      email: '',
      institutionName: '',
      designation: '',
      institutionSize: '500 - 1500',
      additionalNotes: ''
    });
    setPricingStudents(500);
    setSelectedPlan('Campus');
    setErrors({});
    setSubmitStatus('idle');
    setSubmittedValues(null);
  };

  return (
    <div className="min-h-screen bg-[#050010] text-white flex flex-col font-sans antialiased relative overflow-x-hidden pb-20">
      {/* Ambient Background Video */}
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-40 mix-blend-screen"
        src="/bg-video.mp4"
      />
      {/* Background Font Loader */}
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
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#8A2BE2]/8 blur-[130px] -top-80 -left-60 pointer-events-none -z-10"></div>
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[#06B6D4]/5 blur-[150px] top-[40%] right-[-10%] pointer-events-none -z-10"></div>
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[#5B14B7]/6 blur-[140px] bottom-[-10%] left-[-10%] pointer-events-none -z-10"></div>

      {/* Navigation Header */}
      <Header />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto w-full px-6 pt-24 pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4] animate-pulse" />
            <span className="text-[9px] font-orbitron font-bold tracking-widest text-[#C4B5FD] uppercase">✨ CUSTOM TAILORED FOR YOUR INSTITUTION</span>
          </div>

          {/* Heading */}
          <h1 className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl text-white uppercase tracking-wider mb-6 leading-tight">
            Request a Demo of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] filter drop-shadow-[0_0_12px_rgba(108,43,217,0.3)]">IRIS 365</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#C4B5FD]/75 max-w-3xl leading-relaxed">
            Experience the complete institutional operating system before deployment. Explore modules, automation workflows, analytics, and AI-powered campus management tailored specifically for your institution.
          </p>
        </motion.div>
      </section>

      {/* Pricing Plans Section */}
      <section className="max-w-6xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS_DATA.map((plan, index) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => handlePlanClick(plan.id)}
                className={`p-6 rounded-[16px] border backdrop-blur-xl cursor-pointer relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-white/8 border-[#8A2BE2] shadow-[0_0_30px_rgba(138,43,226,0.15)] scale-[1.03]' 
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:scale-[1.01]'
                }`}
              >
                {/* Accent glow corner */}
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${plan.color} blur-2xl pointer-events-none -z-10`}></div>

                {/* Card Top */}
                <div>
                  {plan.badge && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-[#8A2BE2] to-[#6C2BD9] text-white text-[8px] font-orbitron font-extrabold px-2.5 py-0.5 rounded-full tracking-wider shadow">
                      {plan.badge}
                    </div>
                  )}

                  <span className="text-[10px] font-orbitron font-bold tracking-widest text-[#C4B5FD]/60 uppercase">{plan.forWhom}</span>
                  <h3 className="font-orbitron font-black text-lg text-white uppercase mt-1 tracking-wide">{plan.name}</h3>
                  
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-orbitron font-extrabold text-white">{plan.price}</span>
                    <span className="text-[10px] font-mono text-[#C4B5FD]/50">{plan.period}</span>
                  </div>

                  <hr className="border-white/5 my-5" />

                  <ul className="flex flex-col gap-3 text-[11px] text-[#C4B5FD]/85">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Bottom */}
                <div className="mt-8">
                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl text-[10px] font-orbitron font-bold uppercase tracking-wider transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#5B14B7] to-[#8A2BE2] text-white shadow-lg shadow-[#8A2BE2]/10'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
                    }`}
                  >
                    {isSelected ? 'Plan Selected' : 'Choose Plan'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Pricing Estimator Section */}
      <section id="pricing" className="max-w-4xl mx-auto w-full px-6 py-12">
        <div className="p-6 sm:p-10 rounded-[16px] bg-white/5 border border-white/12 backdrop-blur-xl shadow-[0_8px_32px_rgba(138,43,226,0.05)] text-left">
          <div className="text-center mb-8">
            <h2 className="font-orbitron font-black text-2xl tracking-wider text-white uppercase">Institution Plan Estimation</h2>
            <p className="text-xs text-[#C4B5FD]/70 mt-2">
              Select a tier and adjust the slider to estimate monthly licensing costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/3 border border-white/8 p-6 sm:p-8 rounded-[16px]">
            <div className="flex flex-col gap-6">
              {/* Product Tier Selection */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-orbitron font-bold tracking-wider text-[#C4B5FD] uppercase">Product Tier</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['Seed', 'Campus', 'University', 'Enterprise'] as PlanType[]).map((tier) => (
                    <button 
                      key={tier}
                      type="button"
                      onClick={() => setSelectedPlan(tier)}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-orbitron font-bold transition-all duration-300 ${
                        selectedPlan === tier 
                          ? "bg-gradient-to-r from-[#5B14B7] to-[#8A2BE2] border-transparent text-white shadow-md shadow-[#8A2BE2]/10" 
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-[#C4B5FD]/85"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#C4B5FD] uppercase tracking-wider text-[10px] font-orbitron">Estimated Students</span>
                  <span className="text-[#06B6D4] font-mono text-sm font-bold">{pricingStudents}</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="5000" 
                  step="50"
                  value={pricingStudents}
                  onChange={(e) => setPricingStudents(parseInt(e.target.value))}
                  className="w-full accent-[#06B6D4] bg-white/10 h-1.5 rounded-lg outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Estimated cost display */}
            <div className="flex flex-col items-center justify-center p-6 bg-white/3 rounded-[16px] border border-white/8 text-center h-full min-h-[180px]">
              <span className="text-[10px] text-[#C4B5FD]/60 uppercase tracking-widest font-orbitron font-bold">Estimated Monthly Fee</span>
              <span className="text-3xl sm:text-4xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] mt-4 tracking-tight drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                {calculateCost()}
              </span>
              <span className="text-[9px] text-[#C4B5FD]/45 mt-2 max-w-[200px] leading-relaxed">
                {selectedPlan === 'Enterprise' 
                  ? 'Subject to custom service bounds and integration scope.' 
                  : 'Billed annually. Dynamic institutional scaling discounts apply.'}
              </span>
              
              <button 
                type="button"
                onClick={() => {
                  const formEl = document.getElementById('request-demo-form');
                  if (formEl) {
                    formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="mt-6 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] hover:brightness-110 text-white font-orbitron font-bold text-[10px] uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#06B6D4]/10"
              >
                Apply Selected Plan to Form ↓
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Request Form Section */}
      <section className="max-w-4xl mx-auto w-full px-6 py-12">
        <AnimatePresence mode="wait">
          {submitStatus !== 'success' ? (
            <motion.div
              id="request-demo-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="p-6 sm:p-10 rounded-[16px] bg-white/5 border border-white/12 backdrop-blur-xl shadow-[0_8px_32px_rgba(138,43,226,0.05)] text-left"
            >
              {/* Form Heading */}
              <div className="text-center mb-8">
                <h2 className="font-orbitron font-black text-2xl tracking-wider text-white uppercase">REQUEST A DEMO</h2>
                <p className="text-xs text-[#C4B5FD]/70 mt-2">
                  Complete the form below and our team will contact you shortly.
                </p>
              </div>

              {/* Plan selector pills */}
              <div className="flex flex-wrap gap-2.5 justify-center mb-8">
                {(['Seed', 'Campus', 'University', 'Enterprise'] as PlanType[]).map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`px-5 py-2 rounded-full text-xs font-orbitron font-bold uppercase tracking-wider transition-all duration-300 ${
                      selectedPlan === plan
                        ? 'bg-gradient-to-r from-[#5B14B7] to-[#8A2BE2] border-transparent text-white shadow-md shadow-[#8A2BE2]/10'
                        : 'bg-white/5 border border-white/10 text-[#C4B5FD]/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>

              {/* Input form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* 1. First & Last Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">First Name *</label>
                    <input 
                      type="text" 
                      name="firstName"
                      value={formValues.firstName}
                      onChange={handleChange}
                      placeholder="Harshvardhan"
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
                      placeholder="Purohit"
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

                {/* 2. Contact Number & Work Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Contact Number *</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        name="contactNumber"
                        value={formValues.contactNumber}
                        onChange={handleChange}
                        placeholder="+91 73572 88703"
                        className={`w-full px-4 py-2.5 rounded-xl bg-white/3 border text-xs text-white placeholder-white/20 outline-none transition-all duration-300 ${
                          errors.contactNumber 
                            ? 'border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15' 
                            : 'border-white/10 focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10'
                        }`}
                      />
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                    </div>
                    {errors.contactNumber && (
                      <div className="flex items-center gap-1 mt-1 text-[#EF4444] text-[10px]">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.contactNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Work Email *</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        name="email"
                        value={formValues.email}
                        onChange={handleChange}
                        placeholder="contact@sintechnologies.in"
                        className={`w-full px-4 py-2.5 rounded-xl bg-white/3 border text-xs text-white placeholder-white/20 outline-none transition-all duration-300 ${
                          errors.email 
                            ? 'border-[#EF4444] focus:ring-4 focus:ring-[#EF4444]/15' 
                            : 'border-white/10 focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10'
                        }`}
                      />
                      <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                    </div>
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

                {/* 4. Institution Size */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Institution Size (Estimated Students)</label>
                  <select 
                    name="institutionSize"
                    value={formValues.institutionSize}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/10 text-xs text-white placeholder-white/20 outline-none transition-all duration-300 appearance-none focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%23ffffff\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                      backgroundPosition: 'right 1rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.25em auto',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="" className="text-gray-900 bg-white">Select Size</option>
                    <option value="< 500" className="text-gray-900 bg-white">&lt; 500 students</option>
                    <option value="500 - 1500" className="text-gray-900 bg-white">500 - 1,500 students</option>
                    <option value="1500 - 5000" className="text-gray-900 bg-white">1,500 - 5,000 students</option>
                    <option value="5000+" className="text-gray-900 bg-white">5,000+ students</option>
                  </select>
                </div>

                {/* 5. Additional Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#C4B5FD]/80">Additional Notes / Custom Requirements</label>
                  <textarea 
                    name="additionalNotes"
                    value={formValues.additionalNotes}
                    onChange={handleChange}
                    placeholder="Enter any additional requirements or questions..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/10 text-xs text-white placeholder-white/20 outline-none transition-all duration-300 resize-none focus:border-[#8A2BE2] focus:ring-4 focus:ring-[#8A2BE2]/10"
                  />
                </div>

                {/* Submit button */}
                <div className="mt-4">
                  <button 
                    type="submit"
                    disabled={submitStatus === 'sending'}
                    className={`w-full py-4 rounded-xl text-xs font-bold font-orbitron uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
                      submitStatus === 'sending'
                        ? 'bg-gradient-to-r from-[#5B14B7] to-[#8A2BE2] text-white opacity-85 cursor-wait animate-pulse'
                        : 'bg-gradient-to-r from-[#5B14B7] to-[#8A2BE2] hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] text-white shadow-[#8A2BE2]/20'
                    }`}
                  >
                    {submitStatus === 'sending' ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-white animate-spin" />
                        <span>Requesting Demo...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Request Demo</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="p-8 sm:p-12 rounded-[16px] bg-white/5 border border-white/12 backdrop-blur-xl shadow-[0_8px_32px_rgba(16,185,129,0.05)] text-center flex flex-col items-center gap-6"
            >
              {/* Green animated success icon */}
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]"
              >
                <Check className="w-8 h-8 stroke-[3px]" />
              </motion.div>

              <div>
                <h2 className="font-orbitron font-black text-2xl tracking-wider text-[#10B981] uppercase">
                  Demo Request Received
                </h2>
                
                <div className="text-xs sm:text-sm text-[#C4B5FD]/90 mt-5 space-y-4 max-w-xl mx-auto font-light leading-relaxed">
                  <p>Thank you, <strong className="text-white font-bold">{submittedValues?.firstName} {submittedValues?.lastName}</strong>.</p>
                  <p>We've received your request for the <strong className="text-[#06B6D4] font-bold">{submittedValues?.plan}</strong> plan.</p>
                  <p>Our IRIS team will contact you at <strong className="text-white font-semibold underline">{submittedValues?.email}</strong> shortly to schedule your personalized demonstration.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-6 w-full justify-center">
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 text-xs font-bold font-orbitron uppercase tracking-wider transition-all"
                >
                  Submit Another Request
                </button>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#5B14B7] to-[#8A2BE2] text-white hover:brightness-110 text-xs font-bold font-orbitron uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Return Home</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Trust & Compliance Section */}
      <section className="max-w-6xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-[16px] bg-white/3 border border-white/8 backdrop-blur-xl shadow-md text-left flex flex-col gap-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-[#8A2BE2]/30 flex items-center justify-center text-[#8A2BE2]">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-orbitron font-bold text-xs uppercase tracking-wider text-white">ISO 27001 Certified</h4>
              <p className="text-[10px] text-[#C4B5FD]/60 mt-1 leading-normal font-normal">
                Enterprise security metrics auditing mapped across compliance bounds.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-[16px] bg-white/3 border border-white/8 backdrop-blur-xl shadow-md text-left flex flex-col gap-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-[#8A2BE2]/30 flex items-center justify-center text-[#8A2BE2]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-orbitron font-bold text-xs uppercase tracking-wider text-white">AI Powered Automation</h4>
              <p className="text-[10px] text-[#C4B5FD]/60 mt-1 leading-normal font-normal">
                Llama-3 semantic maps and pgvector retrieval handlers integrated.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-[16px] bg-white/3 border border-white/8 backdrop-blur-xl shadow-md text-left flex flex-col gap-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-[#8A2BE2]/30 flex items-center justify-center text-[#8A2BE2]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-orbitron font-bold text-xs uppercase tracking-wider text-white">Instant API Onboarding</h4>
              <p className="text-[10px] text-[#C4B5FD]/60 mt-1 leading-normal font-normal">
                Stateless webhook endpoints sync client directories instantaneously.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-[16px] bg-white/3 border border-white/8 backdrop-blur-xl shadow-md text-left flex flex-col gap-4">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-[#8A2BE2]/30 flex items-center justify-center text-[#8A2BE2]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-orbitron font-bold text-xs uppercase tracking-wider text-white">Zero Vendor Lock-in</h4>
              <p className="text-[10px] text-[#C4B5FD]/60 mt-1 leading-normal font-normal">
                Open schema exports and standard SQL structures assure database portability.
              </p>
            </div>
        </div>
      </div>
    </section>

      {/* FOOTER SECTION */}
      <Footer />
    </div>
  );
}
