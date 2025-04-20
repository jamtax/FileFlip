import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [convertedFile, setConvertedFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setConvertedFile(null);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsConverting(true);
    setError(null);
    
    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate API call (replace with actual API call when backend is ready)
      setTimeout(() => {
        setConvertedFile(`converted_${selectedFile.name.split('.')[0]}.txt`);
        setIsConverting(false);
      }, 2000);

      // For actual backend integration:
      // const response = await fetch('http://localhost:8000/convert', {
      //   method: 'POST',
      //   body: formData,
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Conversion failed');
      // }
      // 
      // const data = await response.json();
      // setConvertedFile(data.converted_file);
    } catch (err) {
      setError('An error occurred during conversion');
      console.error(err);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (convertedFile) {
      // In a real app, this would be a URL to the converted file
      const element = document.createElement('a');
      element.href = URL.createObjectURL(new Blob(['This is converted file content'], {type: 'text/plain'}));
      element.download = convertedFile;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">FileFlip</h1>
          <span className="text-sm text-gray-500">Convert your files with ease</span>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
              <div className="flex flex-col items-center space-y-6">
                <div className="w-full max-w-md">
                  <label 
                    htmlFor="file-upload" 
                    className="block text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    {selectedFile ? 'Change File' : 'Select File'}
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </div>
                
                {selectedFile && (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Selected file:</p>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
                
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  onClick={handleConvert}
                  disabled={!selectedFile || isConverting}
                >
                  {isConverting ? 'Converting...' : 'Convert File'}
                </button>
                
                {error && (
                  <div className="text-red-500 text-sm">{error}</div>
                )}
                
                {convertedFile && (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Conversion complete!</p>
                    <p className="font-medium">{convertedFile}</p>
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      onClick={handleDownload}
                    >
                      Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          FileFlip &copy; {new Date().getFullYear()} - A powerful file conversion tool
        </div>
      </footer>
    </div>
  );
}

export default App;