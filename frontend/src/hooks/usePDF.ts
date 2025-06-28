import { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';

if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  textItems: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

interface UsePDFReturn {
  pagesInfo: PDFPageInfo[];
  totalPages: number;
  loading: boolean;
  error: string | null;
}

export const usePDF = (file: File | null): UsePDFReturn => {
  const [pagesInfo, setPagesInfo] = useState<PDFPageInfo[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPagesInfo([]);
      setTotalPages(0);
      setError(null);
      return;
    }

    const processDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const loadingTask = pdfjs.getDocument(uint8Array);
        const pdfDocument = await loadingTask.promise;

        setTotalPages(pdfDocument.numPages);
        const pages: PDFPageInfo[] = [];

        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          const textContent = await page.getTextContent();
          
          const textItems = textContent.items.map((item: any) => {
            const transform = pdfjs.Util.transform(viewport.transform, item.transform);
            return {
              text: item.str,
              x: transform[4],
              y: transform[5],
              width: item.width || 0,
              height: item.height || 0
            };
          });

          pages.push({ pageNumber: i, width: viewport.width, height: viewport.height, textItems });
        }

        setPagesInfo(pages);
      } catch (err) {
        console.error("PDF processing error:", err);
        setError(`Failed to process PDF: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    processDocument();
  }, [file]);

  return { pagesInfo, totalPages, loading, error };
};
