import React, { useState, useRef, useEffect } from 'react';
import type { RedesignDensity } from '../types';
import { ChevronsUpDown } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface DensitySelectorProps {
  value: RedesignDensity;
  onChange: (value: RedesignDensity) => void;
}

const DENSITY_OPTIONS: { id: RedesignDensity; name: string; description: string }[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Prioritizes open space and simplicity, using a limited number of high-impact plants and features.',
  },
  {
    id: 'default',
    name: 'Balanced',
    description: 'A harmonious mix of planted areas and functional open space like lawns or patios.',
  },
  {
    id: 'lush',
    name: 'Lush',
    description: 'Maximizes planting to create a dense, layered, and abundant garden with minimal empty space.',
  },
];

export const DensitySelector: React.FC<DensitySelectorProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = DENSITY_OPTIONS.find(option => option.id === value) || DENSITY_OPTIONS[1];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Mobile Dropdown View */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-16 px-4 py-2 text-left bg-slate-100/80 border border-slate-200/80 rounded-lg flex justify-between items-center"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <div>
            <p className="font-semibold text-sm text-slate-800">{selectedOption.name}</p>
            <p className="text-xs text-slate-500">{selectedOption.description}</p>
          </div>
          <ChevronsUpDown className="h-5 w-5 text-slate-500" />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200/80 rounded-lg shadow-lg z-10 p-1">
            {DENSITY_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  value === option.id ? 'bg-slate-100' : 'hover:bg-slate-50'
                }`}
                role="option"
                aria-selected={value === option.id}
              >
                 <p className="font-semibold text-sm text-slate-800">{option.name}</p>
                 <p className="text-xs text-slate-500">{option.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Button View */}
      <div className="hidden sm:grid sm:grid-cols-3 sm:gap-2 sm:text-center">
        {DENSITY_OPTIONS.map((option) => (
          <Tooltip key={option.id} content={option.description} position="bottom">
            <button
              type="button"
              onClick={() => onChange(option.id)}
              className={`w-full px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 ${
                value === option.id
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-slate-100/80 text-slate-700 border-slate-200/80 hover:bg-slate-200'
              }`}
              aria-pressed={value === option.id}
            >
              {option.name}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
