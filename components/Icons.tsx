// components/Icons.tsx
import React from 'react';
import { FiInfo, FiTool, FiArrowLeft } from 'react-icons/fi';

export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FiInfo className={className} />
);

export const ToolIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FiTool className={className} />
);

export const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <FiArrowLeft className={className} />
);
