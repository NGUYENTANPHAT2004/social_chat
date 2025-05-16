import React from 'react';

interface FeatureCardProps {
  title: string;
  icon: React.ElementType;
  gradient: string;
  onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, icon: Icon, gradient, onClick }) => (
  <div 
    className={`bg-gradient-to-r ${gradient} p-4 rounded-xl text-white shadow-md hover:shadow-lg cursor-pointer transition-all text-center`}
    onClick={onClick}
  >
    <Icon size={28} className="mx-auto mb-2" />
    <p className="font-medium text-sm">{title}</p>
  </div>
);

export default FeatureCard;