import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Users, Smartphone, Zap, Heart, Gift } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Collaborative',
      description: 'Invite anyone to contribute - no account needed for participants'
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Mobile First',
      description: 'Beautiful on any device, designed for phones first'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Real-time',
      description: 'See messages appear instantly as others contribute'
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Free to Use',
      description: 'Generous free tier with all essential features'
    }
  ];

  const occasions = [
    { emoji: '🎂', label: 'Birthdays' },
    { emoji: '👋', label: 'Farewells' },
    { emoji: '🎉', label: 'Celebrations' },
    { emoji: '🙏', label: 'Thank You' },
    { emoji: '🤗', label: 'Welcome' },
    { emoji: '💍', label: 'Anniversaries' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 text-white py-20 md:py-32">
        <div className="absolute inset-0 pattern-confetti opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Create memories together</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Beautiful Appreciation Boards for Every Occasion
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Celebrate birthdays, farewells, and special moments with a collaborative board 
              where friends and colleagues can share messages, photos, and GIFs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to={isAuthenticated ? '/create' : '/register'}
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors shadow-lg"
              >
                <Gift className="w-5 h-5" />
                Create a Board
              </Link>
              <Link 
                to="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/30 transition-colors"
              >
                View Demo
              </Link>
            </div>
          </motion.div>

          {/* Floating cards preview */}
          <motion.div 
            className="mt-16 relative max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-100 to-orange-100">
              <div className="absolute inset-0 pattern-dots opacity-50" />
              
              {/* Sample cards */}
              <motion.div 
                className="absolute top-[10%] left-[5%] bg-yellow-200 p-4 rounded-lg shadow-lg w-40 transform -rotate-3"
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <p className="text-sm text-slate-700">Happy Birthday! 🎉 Wishing you all the best!</p>
                <p className="text-xs text-slate-500 mt-2">- Sarah</p>
              </motion.div>
              
              <motion.div 
                className="absolute top-[20%] right-[10%] bg-pink-200 p-4 rounded-lg shadow-lg w-44 transform rotate-2"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
              >
                <p className="text-sm text-slate-700">You're the best teammate! We'll miss you! 💜</p>
                <p className="text-xs text-slate-500 mt-2">- Mike</p>
              </motion.div>
              
              <motion.div 
                className="absolute bottom-[15%] left-[20%] bg-blue-200 p-4 rounded-lg shadow-lg w-48 transform rotate-1"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, delay: 1 }}
              >
                <p className="text-sm text-slate-700">Congratulations on your promotion! 🚀 So well deserved!</p>
                <p className="text-xs text-slate-500 mt-2">- Team</p>
              </motion.div>
              
              <motion.div 
                className="absolute bottom-[25%] right-[5%] bg-green-200 p-4 rounded-lg shadow-lg w-36 transform -rotate-2"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2.8, delay: 0.3 }}
              >
                <p className="text-sm text-slate-700">Thank you for everything! ❤️</p>
                <p className="text-xs text-slate-500 mt-2">- Alex</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Occasions Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-slate-800 mb-4">
              Perfect for Every Occasion
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Create boards for any celebration or milestone
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {occasions.map((occasion, index) => (
              <motion.div
                key={occasion.label}
                className="flex items-center gap-2 bg-slate-100 px-6 py-3 rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-2xl">{occasion.emoji}</span>
                <span className="font-medium text-slate-700">{occasion.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-800 mb-4">
              Why Choose Kudoboard?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              The simplest, most beautiful way to create group appreciation boards
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Celebrate?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Create your first board in seconds. It's free!
          </p>
          <Link 
            to={isAuthenticated ? '/create' : '/register'}
            className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/90 transition-colors shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
