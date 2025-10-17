import React, { useState, useEffect } from 'react';
import { Orbit } from 'lucide-react';

const LOADING_MESSAGES = [
  "Warming up the digital wheelbarrow...",
  "Consulting with garden gnomes for layout approval...",
  "Planting the virtual seeds of creativity...",
  "Unrolling the fresh sod... careful, it's pixel-perfect.",
  "Choosing the perfect patio furniture. Wicker or teak?",
  "Building a pergola... just need the digital Allen key.",
  "Watering the new plants with 1s and 0s...",
  "Shhh... the AI is concentrating on the fine details.",
  "Negotiating with squirrels about bird feeder placement...",
  "Finding the sunniest spot for the sunflowers...",
  "Polishing the final design for the grand reveal!",
];

export const EngagingLoader: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % LOADING_MESSAGES.length);
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, []);
  
  const message = LOADING_MESSAGES[messageIndex];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 flex flex-col items-center justify-center min-h-[400px] w-full text-center xl:min-h-0 xl:h-full">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full bg-slate-200 animate-pulse"></div>
        <div className="absolute inset-2 rounded-full bg-white"></div>
        <Orbit className="absolute inset-4 h-8 w-8 text-slate-500 animate-spin" style={{ animationDuration: '3s' }}/>
      </div>
      <h3 className="mt-6 text-xl font-medium text-slate-800">Redesigning in Progress...</h3>
      <div className="mt-2 text-slate-500 h-10 flex items-center justify-center">
         <p key={message} className="animate-fade-in">
            {message}
        </p>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
