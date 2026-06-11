import React from 'react';

export const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="relative">
      <div className="w-10 h-10 rounded-full border-4 border-slate-100" />
      <div className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
    </div>
  </div>
);

export default Spinner;
