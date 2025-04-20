// frontend/src/hooks/useConversion.ts
import { useState } from 'react';
// Ensure the correct path to the module
import { convertTable, ConversionOptions } from '../services/api'; // Verify this file exists or adjust the path

export function useConversion() {
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const convert = async (tableId: string, options: ConversionOptions) => {
    setIsConverting(true);
    setProgress(0);
    setError(null);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);
      
      await convertTable(tableId, options);
      
      clearInterval(progressInterval);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsConverting(false);
    }
  };
  
  return { convert, progress, isConverting, error };
}