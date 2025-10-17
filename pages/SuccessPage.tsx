import React, { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { CheckCircle, LayoutDashboard, User } from 'lucide-react';

export const SuccessPage: React.FC = () => {
  const { navigateTo, upgradeSubscription } = useApp();

  useEffect(() => {
    // Simulate updating the user's subscription status upon landing on this page.
    upgradeSubscription('Creator'); // Hardcoding to 'Creator' for this example.
  }, [upgradeSubscription]);

  return (
    <div className="w-full max-w-2xl mx-auto my-auto text-center flex flex-col items-center justify-center p-4">
      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fade-in-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>
      
      <div className="relative mb-6">
        <CheckCircle className="h-24 w-24 text-green-500 animate-scale-in" strokeWidth={1.5} />
      </div>
      
      <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl animate-fade-in-up">
        Subscription Successful!
      </h2>
      <p className="mt-4 text-lg text-slate-600 max-w-md mx-auto animate-fade-in-up delay-100">
        Thank you for subscribing! Your plan has been upgraded, and you now have access to all the premium features.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-200">
        <button
          onClick={() => navigateTo('main')}
          className="w-full sm:w-auto h-11 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Go to Dashboard</span>
        </button>
        <button
          onClick={() => navigateTo('profile')}
          className="w-full sm:w-auto h-11 flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          <User className="h-5 w-5" />
          <span>View Profile</span>
        </button>
      </div>
    </div>
  );
};