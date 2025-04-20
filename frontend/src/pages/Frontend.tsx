// File: frontend/src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Grid, Column, Section } from '@carbon/react';
import { DocumentPdf, ArrowRight, Upload } from '@carbon/icons-react';

const HomePage: React.FC = () => {
  return (
    <div className="bg-white dark:bg-carbon-gray-100">
      {/* Hero Section */}
      <Section className="bg-carbon-blue-10 dark:bg-carbon-gray-90 py-16">
        <Grid>
          <Column lg={8} md={8} sm={4}>
            <h1 className="text-5xl font-bold mb-4 text-carbon-gray-100 dark:text-white">
              FileFlip
            </h1>
            <p className="text-xl mb-8 text-carbon-gray-70 dark:text-carbon-gray-30">
              Convert PDF documents to CSV, XLSX and other worksheet formats with ease.
              Upload directly to Sage accounting software.
            </p>
            <Link to="/convert">
              <Button size="lg" renderIcon={ArrowRight}>
                Start Converting
              </Button>
            </Link>
          </Column>
          <Column lg={8} md={8} sm={4} className="flex justify-center items-center">
            <div className="transform transition-transform hover:scale-105">
              <DocumentPdf size={196} className="text-carbon-blue-60 dark:text-carbon-blue-40" />
              <ArrowRight size={64} className="mx-4 text-carbon-gray-70 dark:text-carbon-gray-30" />
              <span className="text-3xl font-mono bg-carbon-blue-60 dark:bg-carbon-blue-80 text-white px-3 py-1 rounded">CSV</span>
            </div>
          </Column>
        </Grid>
      </Section>

      {/* Features Section */}
      <Section className="py-16">
        <Grid>
          <Column lg={16} className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-carbon-gray-100 dark:text-white">
              Features
            </h2>
            <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
              Everything you need to convert and use your PDF data
            </p>
          </Column>

          <Column lg={4} md={4} sm={4} className="mb-8">
            <div className="h-full p-6 border border-carbon-gray-20 dark:border-carbon-gray-80 rounded-lg transition-all hover:shadow-md hover:border-carbon-blue-40">
              <Upload size={32} className="mb-4 text-carbon-blue-60" />
              <h3 className="text-xl font-semibold mb-2 text-carbon-gray-100 dark:text-white">
                Easy Upload
              </h3>
              <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
                Drag and drop your PDF files or browse to select them
              </p>
            </div>
          </Column>

          <Column lg={4} md={4} sm={4} className="mb-8">
            <div className="h-full p-6 border border-carbon-gray-20 dark:border-carbon-gray-80 rounded-lg transition-all hover:shadow-md hover:border-carbon-blue-40">
              <div className="mb-4 text-carbon-blue-60 font-mono text-2xl font-bold">
                CSV
              </div>
              <h3 className="text-xl font-semibold mb-2 text-carbon-gray-100 dark:text-white">
                Multiple Formats
              </h3>
              <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
                Convert to CSV, XLSX or Sage-compatible formats
              </p>
            </div>
          </Column>

          <Column lg={4} md={4} sm={4} className="mb-8">
            <div className="h-full p-6 border border-carbon-gray-20 dark:border-carbon-gray-80 rounded-lg transition-all hover:shadow-md hover:border-carbon-blue-40">
              <div className="mb-4 text-carbon-blue-60 text-2xl">
                ⚡
              </div>
              <h3 className="text-xl font-semibold mb-2 text-carbon-gray-100 dark:text-white">
                Fast Processing
              </h3>
              <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
                Advanced algorithms for quick and accurate data extraction
              </p>
            </div>
          </Column>

          <Column lg={4} md={4} sm={4} className="mb-8">
            <div className="h-full p-6 border border-carbon-gray-20 dark:border-carbon-gray-80 rounded-lg transition-all hover:shadow-md hover:border-carbon-blue-40">
              <div className="mb-4 text-carbon-blue-60 text-2xl">
                🔍
              </div>
              <h3 className="text-xl font-semibold mb-2 text-carbon-gray-100 dark:text-white">
                Table Detection
              </h3>
              <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
                Automatically detects and extracts tables from PDF documents
              </p>
            </div>
          </Column>
        </Grid>
      </Section>

      {/* Call to Action */}
      <Section className="bg-carbon-blue-60 dark:bg-carbon-blue-80 py-16 text-white">
        <Grid>
          <Column lg={16} className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to convert your PDF files?
            </h2>
            <p className="text-xl mb-6 text-carbon-gray-10">
              Start using FileFlip today and save time on manual data entry.
            </p>
            <Link to="/convert">
              <Button kind="secondary" size="lg">
                Get Started
              </Button>
            </Link>
          </Column>
        </Grid>
      </Section>

      {/* Footer */}
      <footer className="bg-carbon-gray-10 dark:bg-carbon-gray-90 py-8">
        <Grid>
          <Column lg={16} className="text-center">
            <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
              © {new Date().getFullYear()} JamTax Accounting. All rights reserved.
            </p>
            <p className="text-carbon-gray-60 dark:text-carbon-gray-40 mt-2">
              <a href="https://jamtax.co.za" className="hover:text-carbon-blue-60 dark:hover:text-carbon-blue-40 transition-colors">
                jamtax.co.za
              </a>
            </p>
          </Column>
        </Grid>
      </footer>
    </div>
  );
};

export default HomePage;

// File: frontend/src/pages/ConversionPage.tsx
import React, { useState } from 'react';
import {
  FileUploader,
  Loading,
  InlineNotification,
  Tile,
  Button,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  DataTable,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Modal,
  RadioButtonGroup,
  RadioButton,
  TextInput,
  NumberInput,
  FormGroup,
  Checkbox
} from '@carbon/react';
import { Download, DocumentAdd, DocumentPdf, Add } from '@carbon/icons-react';
import { ConversionOptions } from '../../types';
import { TablePreview } from "frontend-structure";
import FileDropzone from '../components/FileDropzone';
import { uploadPDF, convertTable } from '../services/api';

const ConversionPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<TablePreview[]>([]);
  const [selectedTable, setSelectedTable] = useState<TablePreview | null>(null);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [conversionOptions, setConversionOptions] = useState<ConversionOptions>({
    format: 'csv',
    delimiter: ',',
    sheet_name: 'Sheet1',
    include_headers: true,
    skip_rows: 0
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);
    setTables([]);

    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      
      const extractedTables = await uploadPDF(formData);
      setTables(extractedTables);
      
      if (extractedTables.length === 0) {
        setError('No tables found in the PDF. Try another file or adjust the scan settings.');
      }
    } catch (err) {
      setError(`Error processing PDF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!selectedTable) return;
    
    setLoading(true);
    try {
      await convertTable(selectedTable.table_id, conversionOptions);
      setIsConversionModalOpen(false);
    } catch (err) {
      setError(`Error converting table: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const openConversionModal = (table: TablePreview) => {
    setSelectedTable(table);
    setIsConversionModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-carbon-gray-100 p-4">
      {loading && <Loading description="Processing your file..." withOverlay />}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-carbon-gray-100 dark:text-white">
          Convert PDF to CSV/XLSX
        </h1>

        {error && (
          <InlineNotification
            kind="error"
            title="Error"
            subtitle={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        {tables.length === 0 ? (
          <Tile className="mb-6 p-8">
            <h2 className="text-xl font-semibold mb-4 text-carbon-gray-100 dark:text-white">
              Upload your PDF file
            </h2>
            <p className="mb-6 text-carbon-gray-70 dark:text-carbon-gray-30">
              Drag and drop your PDF file here or click to browse.
            </p>
            <FileDropzone onFilesSelected={handleFileUpload} />
          </Tile>
        ) : (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-carbon-gray-100 dark:text-white">
                Extracted Tables
              </h2>
              <Button
                kind="ghost"
                renderIcon={DocumentAdd}
                onClick={() => {
                  setTables([]);
                  setSelectedTable(null);
                }}
              >
                New Conversion
              </Button>
            </div>

            <Tabs>
              {tables.map((table, index) => (
                <Tab
                  key={table.table_id}
                  label={`Table ${index + 1} (Page ${table.page})`}
                >
                  <div className="p-4">
                    <div className="mb-4 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-medium text-carbon-gray-100 dark:text-white">
                          Table from page {table.page}
                        </h3>
                        <p className="text-carbon-gray-70 dark:text-carbon-gray-30">
                          {table.rows} rows × {table.columns} columns
                        </p>
                      </div>
                      <Button
                        renderIcon={Download}
                        onClick={() => openConversionModal(table)}
                      >
                        Convert & Download
                      </Button>
                    </div>

                    <DataTable rows={table.preview_data} headers={table.column_names.map(name => ({ header: name, key: name }))}>
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
                  </div>
                </Tab>
              ))}
            </Tabs>
          </div>
        )}

        {/* Conversion Options Modal */}
        <Modal
          open={isConversionModalOpen}
          modalHeading="Conversion Options"
          primaryButtonText="Convert & Download"
          secondaryButtonText="Cancel"
          onRequestSubmit={handleConvert}
          onRequestClose={() => setIsConversionModalOpen(false)}
        >
          <div className="p-4">
            <FormGroup legendText="Output Format">
              <RadioButtonGroup
                name="format"
                valueSelected={conversionOptions.format}
                onChange={(value) => setConversionOptions({...conversionOptions, format: value as 'csv' | 'xlsx' | 'sage'})}
              >
                <RadioButton
                  id="format-csv"
                  labelText="CSV (Comma Separated Values)"
                  value="csv"
                />
                <RadioButton
                  id="format-xlsx"
                  labelText="XLSX (Excel Workbook)"
                  value="xlsx"
                />
                <RadioButton
                  id="format-sage"
                  labelText="Sage (Accounting Format)"
                  value="sage"
                />
              </RadioButtonGroup>
            </FormGroup>

            {conversionOptions.format === 'csv' && (
              <FormGroup legendText="CSV Options">
                <TextInput
                  id="delimiter"
                  labelText="Delimiter"
                  value={conversionOptions.delimiter}
                  onChange={(e) => setConversionOptions({...conversionOptions, delimiter: e.target.value})}
                  placeholder=","
                />
              </FormGroup>
            )}

            {conversionOptions.format === 'xlsx' && (
              <FormGroup legendText="Excel Options">
                <TextInput
                  id="sheet-name"
                  labelText="Sheet Name"
                  value={conversionOptions.sheet_name}
                  onChange={(e) => setConversionOptions({...conversionOptions, sheet_name: e.target.value})}
                  placeholder="Sheet1"
                />
              </FormGroup>
            )}

            <FormGroup legendText="Additional Options">
              <Checkbox
                id="include-headers"
                labelText="Include Headers"
                checked={conversionOptions.include_headers}
                onChange={(_, { checked }) => setConversionOptions({...conversionOptions, include_headers: checked})}
              />
              
              <NumberInput
                id="skip-rows"
                label="Skip Rows"
                min={0}
                value={conversionOptions.skip_rows}
                onChange={(e, { value }) => setConversionOptions({...conversionOptions, skip_rows: value})}
                helperText="Number of rows to skip from the beginning"
              />
              
              <TextInput
                id="output-filename"
                labelText="Custom Filename (Optional)"
                value={conversionOptions.output_filename || ''}
                onChange={(e) => setConversionOptions({...conversionOptions, output_filename: e.target.value})}
                placeholder="Leave blank for default"
              />
            </FormGroup>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ConversionPage;

// File: frontend/src/pages/AboutPage.tsx
import React from 'react';
import { Grid, Column, Link } from '@carbon/react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-carbon-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-carbon-gray-100 dark:text-white">
          About FileFlip
        </h1>

        <Grid>
          <Column lg={16} md={8} sm={4}>
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-carbon-gray-100 dark:text-white">
                Our Mission
              </h2>
              <p className="text-lg mb-4 text-carbon-gray-70 dark:text-carbon-gray-30">
                FileFlip was created to simplify the process of converting PDF documents to usable data formats
                for accounting and business purposes. Our goal is to save you time and reduce errors by automating
                the extraction of data from PDFs.
              </p>
              <p className="text-lg text-carbon-gray-70 dark:text-carbon-gray-30">
                As part of JamTax Accounting services, FileFlip is designed specifically for accountants
                and businesses who need to quickly convert financial documents for import into accounting software.
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-carbon-gray-100 dark:text-white">
                How It Works
              </h2>
              <ol className="list-decimal pl-6 space-y-4 text-carbon-gray-70 dark:text-carbon-gray-30">
                <li className="text-lg">
                  <span className="font-medium text-carbon-gray-100 dark:text-white">Upload your PDF</span> - 
                  Simply drag and drop your PDF file or select it from your device.
                </li>
                <li className="text-lg">
                  <span className="font-medium text-carbon-gray-100 dark:text-white">Extract tables</span> - 
                  Our advanced algorithms detect and extract tables from your document.
                </li>
                <li className="text-lg">
                  <span className="font-medium text-carbon-gray-100 dark:text-white">Review and edit</span> - 
                  Preview the extracted data and make any necessary adjustments.
                </li>
                <li className="text-lg">
                  <span className="font-medium text-carbon-gray-100 dark:text-white">Convert and download</span> - 
                  Choose your preferred output format (CSV, XLSX, or Sage) and download the converted file.
                </li>
              </ol>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-carbon-gray-100 dark:text-white">
                Technology
              </h2>
              <p className="text-lg mb-4 text-carbon-gray-70 dark:text-carbon-gray-30">
                FileFlip uses cutting-edge technologies to ensure accurate and reliable data extraction:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-carbon-gray-70 dark:text-carbon-gray-30">
                <li className="text-lg">
                  Advanced PDF parsing algorithms for accurate table detection
                </li>
                <li className="text-lg">
                  Multiple extraction methods to handle different PDF structures
                </li>
                <li className="text-lg">
                  Intelligent data type inference for proper formatting
                </li>
                <li className="text-lg">
                  Optimized for financial and accounting documents
                </li>
              </ul>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-carbon-gray-100 dark:text-white">
                Contact Us
              </h2>
              <p className="text-lg mb-4 text-carbon-gray-70 dark:text-carbon-gray-30">
                Have questions or need assistance? Contact JamTax Accounting:
              </p>
              <div className="space-y-2 text-carbon-gray-70 dark:text-carbon-gray-30">
                <p className="text-lg">
                  <span className="font-medium">Email:</span> jolean@jamtax.co.za
                </p>
                <p className="text-lg">
                  <span className="font-medium">Phone:</span> 079 765 6234
                </p>
                <p className="text-lg">
                  <span className="font-medium">Website:</span> <a href="https://jamtax.co.za" className="text-carbon-blue-60 dark:text-carbon-blue-40 hover:underline">jamtax.co.za</a>
                </p>
              </div>
            </div>
          </Column>
        </Grid>

        <footer className="mt-12 pt-8 border-t border-carbon-gray-20 dark:border-carbon-gray-80 text-center text-carbon-gray-70 dark:text-carbon-gray-30">
          <p>© {new Date().getFullYear()} JamTax Accounting. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default AboutPage;
