import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Briefcase, Star, CheckCircle, Clock, MapPin, IndianRupee, ChevronRight, X, Star as StarIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { MOCK_WORKERS, TRADES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { Job, UserProfile } from '../types';

const EmployerDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [showPostJob, setShowPostJob] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<UserProfile | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<UserProfile[]>([]);
  const [hiredWorkers, setHiredWorkers] = useState<UserProfile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newJob, setNewJob] = useState({
    title: '',
    skillRequired: TRADES[0],
    location: '',
    duration: '',
    wage: 800,
    description: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'jobs'), where('employerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
      setMyJobs(jobsData);
    });

    return unsubscribe;
  }, [user]);

  const stats = [
    { label: 'Active Job Posts', value: myJobs.filter(j => j.status === 'active').length.toString(), icon: Briefcase, color: 'text-primary' },
    { label: 'Total Applicants', value: myJobs.reduce((acc, j) => acc + (j.applicantsCount || 0), 0).toString(), icon: Users, color: 'text-accent' },
    { label: 'Workers Hired', value: hiredWorkers.length.toString(), icon: CheckCircle, color: 'text-green-500' },
    { label: 'Avg Rating Given', value: '4.6★', icon: Star, color: 'text-yellow-500' },
  ];

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'jobs'), {
        employerId: user.uid,
        employerName: profile?.fullName || user.displayName,
        title: newJob.title,
        skillRequired: newJob.skillRequired,
        description: newJob.description,
        location: {
          city: newJob.location,
          district: newJob.location,
          lat: 20.5937,
          lng: 78.9629
        },
        duration: newJob.duration,
        wage: Number(newJob.wage),
        wageType: 'daily',
        status: 'active',
        applicantsCount: 0,
        createdAt: new Date().toISOString()
      });

      toast.success('Job posted successfully!');
      setShowPostJob(false);
      setNewJob({
        title: '',
        skillRequired: TRADES[0],
        location: '',
        duration: '',
        wage: 800,
        description: ''
      });
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchApplicants = async (jobId: string) => {
    setSelectedJobId(jobId);
    setIsSubmitting(true);
    try {
      const q = query(collection(db, 'applications'), where('jobId', '==', jobId));
      const snapshot = await getDocs(q);
      const workerIds = snapshot.docs.map(doc => doc.data().workerId);
      
      if (workerIds.length === 0) {
        setApplicants([]);
        setShowApplicants(true);
        return;
      }

      // Fetch worker profiles for these IDs
      const workersData: UserProfile[] = [];
      for (const uid of workerIds) {
        const workerDoc = await getDoc(doc(db, 'users', uid));
        if (workerDoc.exists()) {
          workersData.push({ uid: workerDoc.id, ...workerDoc.data() } as UserProfile);
        }
      }
      
      setApplicants(workersData);
      setShowApplicants(true);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      toast.error('Failed to load applicants');
      setApplicants(MOCK_WORKERS as UserProfile[]);
      setShowApplicants(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHire = async (worker: UserProfile) => {
    if (!selectedJobId) return;
    
    try {
      // Update application status in Firestore
      const q = query(
        collection(db, 'applications'), 
        where('jobId', '==', selectedJobId),
        where('workerId', '==', worker.uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const appDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'applications', appDoc.id), {
          status: 'hired',
          hiredAt: serverTimestamp()
        });
      }

      toast.success(`Hired ${worker.fullName}!`);
      setHiredWorkers([...hiredWorkers, worker]);
      setShowApplicants(false);
    } catch (error) {
      console.error('Error hiring worker:', error);
      toast.error('Failed to hire worker');
    }
  };

  const handleComplete = async () => {
    if (!selectedWorker) return;
    
    try {
      // Add review to Firestore
      await addDoc(collection(db, 'reviews'), {
        workerId: selectedWorker.uid,
        employerId: user?.uid,
        employerName: profile?.fullName || user?.displayName,
        rating: rating,
        comment: reviewText,
        createdAt: new Date().toISOString()
      });

      toast.success('Rating submitted! Daksh Score updated.');
      setShowRatingModal(false);
      setRating(0);
      setReviewText('');
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-display font-bold text-white">Employer Dashboard</h1>
        <button 
          onClick={() => setShowPostJob(!showPostJob)}
          className="btn-saffron px-6 py-3 rounded-xl font-bold text-white flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" /> Post New Job
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-6 rounded-2xl border-white/5"
          >
            <stat.icon className={`h-6 w-6 ${stat.color} mb-4`} />
            <h3 className="text-3xl font-display font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Post Job Form */}
      <AnimatePresence>
        {showPostJob && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-12"
          >
            <form onSubmit={handlePostJob} className="glass p-8 rounded-3xl border-primary/20 space-y-6">
              <h3 className="text-xl font-bold text-white mb-6">Create a New Job Posting</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Job Title</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none" 
                    placeholder="e.g. House Painting Project" 
                    value={newJob.title}
                    onChange={e => setNewJob({...newJob, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Skill Required</label>
                  <select 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none"
                    value={newJob.skillRequired}
                    onChange={e => setNewJob({...newJob, skillRequired: e.target.value})}
                  >
                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none" 
                    placeholder="City, District" 
                    value={newJob.location}
                    onChange={e => setNewJob({...newJob, location: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Duration</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none" 
                    placeholder="e.g. 5 days" 
                    value={newJob.duration}
                    onChange={e => setNewJob({...newJob, duration: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daily Wage (₹)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none" 
                    placeholder="800" 
                    value={newJob.wage}
                    onChange={e => setNewJob({...newJob, wage: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Job Description</label>
                <textarea 
                  className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none h-32 resize-none" 
                  placeholder="Describe the work details..."
                  value={newJob.description}
                  onChange={e => setNewJob({...newJob, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setShowPostJob(false)} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-saffron px-8 py-3 rounded-xl font-bold text-white disabled:opacity-50">
                  {isSubmitting ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* My Posted Jobs */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">My Posted Jobs</h3>
          <div className="space-y-4">
            {myJobs.map(job => (
              <div key={job.id} className="glass p-6 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{job.title}</h4>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="text-primary font-bold">{job.skillRequired}</span>
                      <span>•</span>
                      <span className={`font-bold capitalize ${job.status === 'active' ? 'text-green-500' : 'text-accent'}`}>{job.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{job.applicantsCount || 0}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Applicants</p>
                  </div>
                  <button 
                    onClick={() => fetchApplicants(job.id!)}
                    className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 hover:text-primary transition-all text-gray-400"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hired Workers */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-xl font-display font-bold text-white uppercase tracking-widest">Hired Workers</h3>
          <div className="space-y-4">
            {hiredWorkers.length > 0 ? hiredWorkers.map(worker => (
              <div key={worker.uid} className="glass p-6 rounded-2xl border-green-500/20">
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={worker.photo} 
                    alt={worker.fullName} 
                    className="h-12 w-12 rounded-full object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-white font-bold">{worker.fullName}</h4>
                    <p className="text-xs text-gray-500">{worker.trade} · Hired recently</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedWorker(worker);
                    setShowRatingModal(true);
                  }}
                  className="w-full py-2 bg-green-500/10 text-green-500 rounded-lg text-sm font-bold hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
                >
                  Mark Complete
                </button>
              </div>
            )) : (
              <div className="glass p-8 rounded-2xl text-center border-white/5">
                <p className="text-gray-500 text-sm">No workers hired yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applicants Side Panel */}
      <AnimatePresence>
        {showApplicants && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApplicants(false)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-full max-w-md bg-card h-full shadow-2xl border-l border-border p-8 overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-display font-bold text-white">Applicants (12)</h3>
                <button onClick={() => setShowApplicants(false)} className="text-gray-500 hover:text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {applicants.map(worker => (
                  <div key={worker.uid} className="glass p-6 rounded-2xl border-white/5 hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={worker.photo} 
                          alt={worker.fullName} 
                          className="h-12 w-12 rounded-full object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-white font-bold">{worker.fullName}</h4>
                          <p className="text-xs text-gray-500">{worker.location.district}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${worker.dakshScore > 70 ? 'text-green-500' : 'text-accent'}`}>{worker.dakshScore}</div>
                        <p className="text-[8px] text-gray-600 uppercase font-bold tracking-widest">Daksh Score</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {worker.skills.slice(0, 2).map(s => (
                        <span key={s} className="bg-white/5 text-gray-400 px-2 py-1 rounded text-[10px] font-bold">{s}</span>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => navigate(`/worker/${worker.uid}`)}
                        className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
                      >
                        View Profile
                      </button>
                      <button onClick={() => handleHire(worker)} className="flex-1 btn-saffron py-2 rounded-lg text-xs font-bold text-white">Hire Now</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-3xl max-w-sm w-full text-center border-primary/30"
            >
              <h3 className="text-2xl font-display font-bold text-white mb-4">Rate Worker</h3>
              <p className="text-gray-400 mb-8">How was your experience with {selectedWorker?.fullName}?</p>
              
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <button 
                    key={i} 
                    onClick={() => setRating(i)}
                    className={`p-2 transition-all ${rating >= i ? 'text-accent scale-110' : 'text-gray-700'}`}
                  >
                    <StarIcon className={`h-8 w-8 ${rating >= i ? 'fill-accent' : ''}`} />
                  </button>
                ))}
              </div>

              <textarea 
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-white focus:border-primary outline-none h-24 resize-none mb-6 text-sm"
                placeholder="Write a short review..."
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
              />

              <div className="flex gap-4">
                <button onClick={() => setShowRatingModal(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500">Cancel</button>
                <button 
                  onClick={handleComplete}
                  className="flex-1 btn-saffron py-3 rounded-xl font-bold text-white"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployerDashboard;
