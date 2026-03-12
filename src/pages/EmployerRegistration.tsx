import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, MapPin, Phone, Mail, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle, Briefcase, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../App';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';

const EmployerRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    district: '',
    address: '',
    gstNumber: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in first');
      await signIn();
      return;
    }

    setLoading(true);
    try {
      const employerProfile: UserProfile = {
        uid: user.uid,
        displayName: formData.contactPerson || user.displayName || 'Employer',
        fullName: formData.contactPerson || user.displayName || 'Employer',
        email: user.email || formData.email,
        photo: user.photoURL || '',
        role: 'employer',
        trade: formData.industry,
        experience: 0,
        skills: [],
        dakshScore: 0,
        verified: !!formData.gstNumber,
        isVerified: !!formData.gstNumber,
        location: {
          city: formData.city,
          district: formData.district,
          state: 'Maharashtra', // Default for demo
        },
        wage: 0,
        bio: `${formData.companyName} - ${formData.industry}`,
        badges: formData.gstNumber ? ['GST Verified'] : [],
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), employerProfile);
      toast.success('Employer profile created successfully!');
      navigate('/dashboard/employer');
    } catch (error) {
      console.error('Error creating employer profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-display font-bold text-white mb-4">Employer Registration</h1>
        <p className="text-gray-400">Join Daksh-Bharat to hire skilled, verified rural talent</p>
      </div>

      {/* Progress Bar */}
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />
        {[1, 2, 3].map((s) => (
          <div 
            key={s}
            className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= s ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,107,53,0.5)]' : 'bg-secondary text-gray-500 border border-border'
            }`}
          >
            {step > s ? <CheckCircle className="h-6 w-6" /> : s}
          </div>
        ))}
      </div>

      <div className="glass p-8 rounded-3xl border-primary/10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center">
                <Building2 className="mr-2 text-primary" /> Company Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Company / Business Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="e.g. Patil Constructions"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Industry</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                  >
                    <option value="">Select Industry</option>
                    <option value="Construction">Construction</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Solar/Energy">Solar/Energy</option>
                    <option value="Services">Services</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">GST Number (Optional)</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                  />
                </div>
              </div>
              <button onClick={nextStep} className="w-full btn-saffron py-4 rounded-xl font-bold text-white flex items-center justify-center">
                Next Step <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center">
                <User className="mr-2 text-primary" /> Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Person Name</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 00000 00000"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@company.com"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-xl font-bold text-white flex items-center justify-center border border-white/10">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </button>
                <button onClick={nextStep} className="flex-[2] btn-saffron py-4 rounded-xl font-bold text-white flex items-center justify-center">
                  Next Step <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center">
                <MapPin className="mr-2 text-primary" /> Business Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">City / Town</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g. Sangli"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="e.g. Sangli"
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Street, Landmark, Area..."
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none resize-none"
                  />
                </div>
              </div>

              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 mb-6">
                <div className="flex items-start">
                  <ShieldCheck className="h-6 w-6 text-primary mr-4 mt-1" />
                  <div>
                    <h4 className="text-white font-bold mb-1">Verification Badge</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      By registering, you agree to our terms of service. Providing a GST number will grant you a "Verified Employer" badge, increasing your trust score among workers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-xl font-bold text-white flex items-center justify-center border border-white/10">
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </button>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex-[2] btn-saffron py-4 rounded-xl font-bold text-white flex items-center justify-center disabled:opacity-50"
                >
                  {loading ? 'Creating Profile...' : 'Complete Registration'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmployerRegistration;
