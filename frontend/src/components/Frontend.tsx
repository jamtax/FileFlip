// File: frontend/src/components/FileDropzone.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentPdf, Upload } from '@carbon/icons-react';
import { Button } from '@carbon/react';

interface FileDropzoneProps {
  onFilesSelected: (files: FileList | null) => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        // Convert to FileList-like object for compatibility with the handler
        const dataTransfer = new DataTransfer();
        acceptedFiles.forEach(file => {
          dataTransfer.items.add(file);
        });
        onFilesSelected(dataTransfer.files);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      onFilesSelected(files);
    }
  };

  React.useEffect(() => {
    setIsDragging(isDragActive);
  }, [isDragActive]);

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
        ${isDragging ? 'border-carbon-blue-60 bg-carbon-blue-10' : 'border-carbon-gray-30 dark:border-carbon-gray-70 hover:border-carbon-blue-40'}`}
    >
      <input {...getInputProps()} onChange={handleFileInputChange} />
      
      <div className="flex flex-col items-center">
        {selectedFile ? (
          <>
            <DocumentPdf size={48} className="text-carbon-blue-60 mb-4" />
            <p className="text-lg font-medium text-carbon-gray-100 dark:text-white mb-2">
              {selectedFile.name}
            </p>
            <p className="text-carbon-gray-70 dark:text-carbon-gray-30 mb-4">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
            <Button kind="tertiary" size="sm" onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}>
              Change File
            </Button>
          </>
        ) : (
          <>
            <Upload size={48} className="text-carbon-gray-70 dark:text-carbon-gray-30 mb-4" />
            <p className="text-lg text-carbon-gray-70 dark:text-carbon-gray-30 mb-4">
              Drag & drop your PDF here or click to browse
            </p>
            <Button>Select PDF File</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default FileDropzone;

// File: frontend/src/components/TablePreviewCard.tsx
import React from 'react';
import { Tile, Button, DataTable, TableContainer, TableToolbar, TableToolbarContent, TableToolbarSearch, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, Tag } from '@carbon/react';
import { Download, Edit } from '@carbon/icons-react';
import { TablePreview } from "frontend-structure";

interface TablePreviewCardProps {
  table: TablePreview;
  onConvert: (table: TablePreview) => void;
}

const TablePreviewCard: React.FC<TablePreviewCardProps> = ({ table, onConvert }) => {
  return (
    <Tile className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white">
            Table from Page {table.page}
          </h3>
          <div className="flex mt-2">
            <Tag type="blue">Rows: {table.rows}</Tag>
            <Tag type="teal" className="ml-2">Columns: {table.columns}</Tag>
            {table.has_multi_header && (
              <Tag type="purple" className="ml-2">Multi-header</Tag>
            )}
          </div>
        </div>
        <Button
          renderIcon={Download}
          onClick={() => onConvert(table)}
        >
          Convert
        </Button>
      </div>
      
      <DataTable
        rows={table.preview_data}
        headers={table.column_names.map(name => ({ header: name, key: name }))}
        isSortable
      >
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer title="Table Preview" description="First 5 rows of data">
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch onChange={() => {}} />
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(header => (
                    <TableHeader {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <TableRow {...getRowProps({ row })}>
                    {row.cells.map(cell => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </Tile>
  );
};

export default TablePreviewCard;

// File: frontend/src/services/api.ts
import axios from 'axios';
import { ConversionOptions } from '../../types';
import { TablePreview } from "frontend-structure";

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Upload a PDF file for processing
 * 
 * @param formData FormData containing the PDF file
 * @returns Array of extracted tables
 */
export const uploadPDF = async (formData: FormData): Promise<TablePreview[]> => {
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Error uploading PDF');
    }
    throw error;
  }
};

/**
 * Convert a table to the specified format
 * 
 * @param tableId ID of the table to convert
 * @param options Conversion options
 */
export const convertTable = async (tableId: string, options: ConversionOptions): Promise<void> => {
  try {
    // Convert to form data for compatibility with backend
    const formData = new FormData();
    formData.append('format', options.format);
    
    if (options.delimiter) {
      formData.append('delimiter', options.delimiter);
    }
    
    if (options.sheet_name) {
      formData.append('sheet_name', options.sheet_name);
    }
    
    if (options.output_filename) {
      formData.append('output_filename', options.output_filename);
    }
    
    formData.append('include_headers', options.include_headers ? 'true' : 'false');
    
    if (typeof options.skip_rows === 'number') {
      formData.append('skip_rows', options.skip_rows.toString());
    }
    
    // Use a different approach for file downloads
    const response = await api.post(`/convert/${tableId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
    
    // Create a download link and trigger the download
    const contentDisposition = response.headers['content-disposition'];
    let filename = options.output_filename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    if (!filename) {
      filename = `table_${tableId}.${options.format}`;
    }
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Error converting table');
    }
    throw error;
  }
};

/**
 * Convert all tables in a file to a single output file
 * 
 * @param fileId ID of the file containing the tables
 * @param options Conversion options
 */
export const batchConvert = async (fileId: string, options: ConversionOptions): Promise<void> => {
  try {
    // Convert to form data
    const formData = new FormData();
    formData.append('file_id', fileId);
    formData.append('format', options.format);
    
    if (options.delimiter) {
      formData.append('delimiter', options.delimiter);
    }
    
    if (options.sheet_name) {
      formData.append('sheet_name', options.sheet_name);
    }
    
    if (options.output_filename) {
      formData.append('output_filename', options.output_filename);
    }
    
    // Request the file as a blob for download
    const response = await api.post('/batch-convert', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });
    
    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = options.output_filename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }
    
    if (!filename) {
      filename = `all_tables.${options.format}`;
    }
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Error in batch conversion');
    }
    throw error;
  }
};
