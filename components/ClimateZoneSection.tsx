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
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((val: string) => {
    setLocalValue(val);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onChange(val);
    }, 300);
  }, [onChange]);

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-4">Specify Details</h2>
      <ClimateSelector value={localValue} onChange={handleChange} />
    </div>
  );
});