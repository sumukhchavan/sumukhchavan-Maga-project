import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { Toaster, toast } from 'react-hot-toast';
import { Hammer, Search, Briefcase, Info, User as UserIcon, LogOut, Menu, X, CheckCircle, MapPin, Star, Phone, Share2, PlusCircle, LayoutDashboard, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { UserProfile, Job } from './types';
import { useTranslation } from 'react-i18next';
import LandingPage from './pages/LandingPage';
import JobBoard from './pages/JobBoard';
import WorkerProfile from './pages/WorkerProfile';
import WorkerRegistration from './pages/WorkerRegistration';
import EmployerDashboard from './pages/EmployerDashboard';
import BrowseWorkers from './pages/BrowseWorkers';
import EmployerRegistration from './pages/EmployerRegistration';
import PostJob from './pages/PostJob';

// Context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

import AIChatbot from './components/AIChatbot';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, signIn, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'mr', name: 'मराठी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'kn', name: 'ಕನ್ನಡ' }
  ];

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.findJobs'), path: '/jobs' },
    { name: t('nav.postJob'), path: '/post-job' },
    { name: t('nav.browseWorkers'), path: '/browse' },
    { name: t('nav.howItWorks'), path: '/#how-it-works' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <div className="p-2 bg-primary rounded-lg group-hover:rotate-12 transition-transform">
                  <Hammer className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-display font-bold text-white leading-none">Daksh-Bharat</span>
                  <span className="text-[10px] text-accent font-medium tracking-widest uppercase">{t('hero.subtitle')}</span>
                </div>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === link.path ? 'text-primary' : 'text-gray-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Language Selector */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-300 hover:text-primary transition-colors py-2">
                  <Languages className="h-4 w-4" />
                  <span className="text-sm font-medium uppercase">{i18n.language.split('-')[0]}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-32 glass border border-border rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-white/5 transition-colors ${
                        i18n.language === lang.code ? 'text-primary' : 'text-gray-300'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {user ? (
                <div className="flex items-center space-x-4">
                  {profile?.role === 'employer' ? (
                    <Link to="/dashboard/employer" className="btn-saffron px-4 py-2 rounded-lg text-sm font-bold text-white flex items-center">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      {t('nav.dashboard')}
                    </Link>
                  ) : profile?.role === 'worker' ? (
                    <Link to={`/worker/${user.uid}`} className="btn-saffron px-4 py-2 rounded-lg text-sm font-bold text-white flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      {t('nav.myProfile')}
                    </Link>
                  ) : (
                    <Link to="/register/worker" className="border border-primary text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/10 transition-colors">
                      Complete Setup
                    </Link>
                  )}
                  <button onClick={signOut} className="text-gray-400 hover:text-white transition-colors">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link to="/register/worker" className="text-sm font-bold text-gray-300 hover:text-white transition-colors">
                    {t('nav.registerWorker')}
                  </Link>
                  <Link to="/post-job" className="btn-saffron px-6 py-2 rounded-lg text-sm font-bold text-white">
                    {t('nav.postJob')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
              {/* Mobile Language Selector */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-300 hover:text-primary transition-colors">
                  <Languages className="h-5 w-5" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-32 glass border border-border rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => i18n.changeLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-white/5 transition-colors ${
                        i18n.language === lang.code ? 'text-primary' : 'text-gray-300'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white p-2"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass border-t border-border overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-4 text-base font-medium text-gray-300 hover:text-primary hover:bg-white/5 rounded-lg"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 flex flex-col space-y-3">
                  {user ? (
                    <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="flex items-center space-x-2 px-3 py-2 text-gray-300">
                      <LogOut className="h-5 w-5" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  ) : (
                    <>
                      <Link to="/register/worker" onClick={() => setIsMenuOpen(false)} className="px-3 py-2 text-gray-300">
                        {t('nav.registerWorker')}
                      </Link>
                      <Link to="/post-job" onClick={() => setIsMenuOpen(false)} className="btn-saffron px-6 py-3 rounded-lg text-sm font-bold text-white w-full text-center">
                        {t('nav.postJob')}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-secondary border-t border-border pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Hammer className="h-8 w-8 text-primary" />
                <span className="text-3xl font-display font-bold text-white">Daksh-Bharat</span>
              </div>
              <p className="text-gray-400 max-w-md mb-6">
                India's first skill-verified labor exchange platform. Connecting verified rural talent with local opportunities — digitally, transparently, and fairly.
              </p>
              <span className="text-accent font-display font-bold text-lg italic">"Har Haath Ko Kaam, Har Kaam Ko Pehchaan"</span>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Quick Links</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link to="/" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/#how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
                <li><Link to="/jobs" className="hover:text-primary transition-colors">Find Jobs</Link></li>
                <li><Link to="/browse" className="hover:text-primary transition-colors">Browse Workers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Support</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link to="/" className="hover:text-primary transition-colors">For Workers</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">For Employers</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
            <p>© 2025 Daksh-Bharat. All rights reserved.</p>
            <p className="mt-4 md:mt-0">Made with ❤️ for Rural India</p>
          </div>
        </div>
      </footer>
      <AIChatbot />
      <Toaster position="bottom-right" />
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      const user = await signInWithGoogle();
      toast.success(`Welcome, ${user.displayName}!`);
    } catch (error: any) {
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show an error toast
        return;
      }
      if (error.code === 'auth/cancelled-popup-request') {
        // Another popup request was made, ignore this one
        return;
      }
      console.error('Sign in error:', error);
      toast.error('Failed to sign in');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        >
          <Hammer className="h-12 w-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn: handleSignIn, signOut: handleSignOut }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/jobs" element={<JobBoard />} />
            <Route path="/worker/:id" element={<WorkerProfile />} />
            <Route path="/register/worker" element={<WorkerRegistration />} />
            <Route path="/register/employer" element={<EmployerRegistration />} />
            <Route path="/dashboard/employer" element={<EmployerDashboard />} />
            <Route path="/browse" element={<BrowseWorkers />} />
            <Route path="/post-job" element={<PostJob />} />
          </Routes>
        </Layout>
      </Router>
    </AuthContext.Provider>
  );
}
