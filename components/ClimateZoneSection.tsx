import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClimateSelector } from './ClimateSelector';

interface ClimateZoneSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export const ClimateZoneSection: React.FC<ClimateZoneSectionProps> = React.memo(({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((val: string, immediate?: boolean) => {
    setLocalValue(val);
    if (immediate) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onChange(val);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onChange(val);
        timeoutRef.current = null;
      }, 300);
    }
  }, [onChange]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-4">Specify Details</h2>
      <ClimateSelector value={localValue} onChange={handleChange} />
    </div>
  );
});