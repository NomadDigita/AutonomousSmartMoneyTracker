import React from 'react';

export const GlassLogo: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-14 h-14 select-none">
      {/* Glow Layer in background */}
      <div className="absolute w-12 h-12 bg-cyan-500/30 blur-xl rounded-full animate-pulse-glow" />
      <div className="absolute w-10 h-10 bg-indigo-500/30 blur-lg rounded-full animate-float-medium" />

      {/* Primary Reflective Sphere Layer */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-cyan-400/20 rounded-full border border-white/20 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] animate-liquid-flow" />

      {/* Floating 3D Intersecting Ring */}
      <div className="absolute w-10 h-6 border-2 border-white/40 rounded-full transform -rotate-45 shadow-[0_4px_10px_rgba(0,0,0,0.3)] animate-float-slow" />
      
      {/* Central Solid Power Core */}
      <div className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_12px_#ffffff]" />
    </div>
  );
};