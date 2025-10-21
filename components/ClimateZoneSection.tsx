import React from 'react';
import { ClimateSelector } from './ClimateSelector';

interface ClimateZoneSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export const ClimateZoneSection: React.FC<ClimateZoneSectionProps> = React.memo(({ value, onChange }) => {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-4">Specify Details</h2>
      <ClimateSelector value={value} onChange={onChange} />
    </div>
  );
});