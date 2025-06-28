import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">About FileFlip</h1>
      <p className="text-base">
        FileFlip is a tool developed by Skunkworks and Jamtax to help users convert South African bank PDF statements
        into CSV or XLSX files compatible with Sage Accounting.
      </p>
    </div>
  );
};

export default AboutPage;
