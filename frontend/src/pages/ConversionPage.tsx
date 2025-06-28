import React, { useState } from 'react';

const ConversionPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) throw new Error("No file selected.");
      // TODO: Add parsing logic
      console.log("Uploaded file:", file.name);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Convert Your Statement</h1>
      <input type="file" accept="application/pdf" onChange={handleFileUpload} className="mb-4" />
      {error && <p className="text-red-500">Error: {error}</p>}
    </div>
  );
};

export default ConversionPage;
