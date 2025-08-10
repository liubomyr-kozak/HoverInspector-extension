import React from 'react';
import { LegendContainer } from './styled';

export const PropertyLegend: React.FC = () => {
  return (
    <LegendContainer>
      <span>#</span>
      <span>Property</span>
      <span>Snapshot 1</span>
      <span>Snapshot 2</span>
      <span>Copy</span>
    </LegendContainer>
  );
};