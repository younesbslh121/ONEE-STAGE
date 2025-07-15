import React from 'react';

const OnepLogo: React.FC<{ width?: number; height?: number }> = ({ width = 100, height = 100 }) => {
  return (
    <svg width={width} height={height} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {/* Cercle extérieur noir */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="#000000" strokeWidth="8"/>
      
      {/* Fond bleu clair */}
      <circle cx="100" cy="100" r="88" fill="#ADD8E6"/>
      
      {/* Vagues bleues */}
           <path d="M 20 80 Q 40 60 60 80 Q 80 100 100 80 Q 120 60 140 80 Q 160 100 180 80 L 180 120 Q 160 100 140 120 Q 120 140 100 120 Q 80 100 60 120 Q 40 140 20 120 Z" fill="#1E90FF"/>

           <path d="M 20 90 Q 40 70 60 90 Q 80 110 100 90 Q 120 70 140 90 Q 160 110 180 90 L 180 130 Q 160 110 140 130 Q 120 150 100 130 Q 80 110 60 130 Q 40 150 20 130 Z" fill="#0066CC"/>

           <path d="M 20 100 Q 40 80 60 100 Q 80 120 100 100 Q 120 80 140 100 Q 160 120 180 100 L 180 140 Q 160 120 140 140 Q 120 160 100 140 Q 80 120 60 140 Q 40 160 20 140 Z" fill="#003399"/>


      
      {/* Texte ONEP */}
      <text x="100" y="270" textAnchor="middle" fontSize="36" fontWeight="bold" fill="#0066CC" fontFamily="Arial, sans-serif">ONEP</text>
    </svg>
  );
};

export default OnepLogo;
