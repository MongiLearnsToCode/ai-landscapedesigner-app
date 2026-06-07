import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-200/80 text-center sm:flex sm:justify-between">
      <p className="text-sm text-slate-500 mb-2 sm:mb-0">
        &copy; {currentYear} AI Landscape Designer. All rights reserved.
      </p>
      <div className="flex justify-center space-x-4">
        <Link
          to="/terms"
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          Terms of Service
        </Link>
        <Link
          to="/privacy"
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
};
