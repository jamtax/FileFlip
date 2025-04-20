import os
import tempfile
from pathlib import Path
import pandas as pd
import numpy as np
import tabula
import pdfplumber
import camelot
import PyPDF2
from typing import List, Dict, Any, Optional, Union, Tuple
import cv2
import pytesseract
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFConverter:
    """
    A class to convert PDF files to CSV or XLSX formats.
    """
    
    def __init__(self, ocr_enabled: bool = False, ocr_language: str = 'eng'):
        """
        Initialize the PDF converter.
        
        Args:
            ocr_enabled: Whether to use OCR for text extraction
            ocr_language: Language for OCR (default: 'eng')
        """
        self.ocr_enabled = ocr_enabled
        self.ocr_language = ocr_language
    
    def detect_tables(self, pdf_path: str) -> List[Dict[str, Any]]:
        """
        Detect tables in the PDF and return their metadata.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of dictionaries containing table metadata
        """
        tables_info = []
        
        # Try with tabula first
        try:
            tabula_tables = tabula.read_pdf(pdf_path, pages='all', multiple_tables=True)
            if tabula_tables:
                for i, table in enumerate(tabula_tables):
                    if not table.empty:
                        tables_info.append({
                            'page': i + 1,
                            'rows': len(table),
                            'columns': len(table.columns),
                            'extraction_method': 'tabula',
                            'preview': table.head(3).to_dict()
                        })
        except Exception as e:
            logger.warning(f"Tabula extraction failed: {str(e)}")
        
        # Try with camelot if no tables found
        if not tables_info:
            try:
                camelot_tables = camelot.read_pdf(pdf_path, pages='all')
                if camelot_tables:
                    for i, table in enumerate(camelot_tables):
                        df = table.df
                        if not df.empty:
                            tables_info.append({
                                'page': table.page,
                                'rows': len(df),
                                'columns': len(df.columns),
                                'extraction_method': 'camelot',
                                'preview': df.head(3).to_dict()
                            })
            except Exception as e:
                logger.warning(f"Camelot extraction failed: {str(e)}")
        
        return tables_info
    
    def extract_tables_with_tabula(self, pdf_path: str, pages: str = 'all') -> List[pd.DataFrame]:
        """
        Extract tables from PDF using tabula.
        
        Args:
            pdf_path: Path to the PDF file
            pages: Pages to extract tables from (default: 'all')
            
        Returns:
            List of pandas DataFrames containing extracted tables
        """
        try:
            tables = tabula.read_pdf(
                pdf_path, 
                pages=pages, 
                multiple_tables=True,
                guess=True,
                lattice=True,
                stream=True
            )
            # Clean up table headers and data
            for i, table in enumerate(tables):
                if not table.empty:
                    # Clean column names - remove newlines and excess whitespace
                    table.columns = [str(col).strip().replace('\r', ' ').replace('\n', ' ') for col in table.columns]
                    
                    # Fill NaN values with empty strings for text columns
                    for col in table.columns:
                        if table[col].dtype == 'object':
                            table[col] = table[col].fillna('')
                        else:
                            table[col] = table[col].fillna(0)
                    
                    tables[i] = table
            
            return tables
        except Exception as e:
            logger.error(f"Error extracting tables with tabula: {str(e)}")
            return []
    
    def extract_tables_with_camelot(self, pdf_path: str, pages: str = 'all') -> List[pd.DataFrame]:
        """
        Extract tables from PDF using camelot.
        
        Args:
            pdf_path: Path to the PDF file
            pages: Pages to extract tables from (default: 'all')
            
        Returns:
            List of pandas DataFrames containing extracted tables
        """
        try:
            tables = camelot.read_pdf(pdf_path, pages=pages, flavor='lattice')
            return [table.df for table in tables]
        except Exception as e:
            logger.error(f"Error extracting tables with camelot: {str(e)}")
            return []
    
    def extract_text_with_ocr(self, pdf_path: str, pages: Union[str, List[int]] = 'all') -> Dict[int, str]:
        """
        Extract text from PDF using OCR.
        
        Args:
            pdf_path: Path to the PDF file
            pages: Pages to extract text from (default: 'all')
            
        Returns:
            Dictionary mapping page numbers to extracted text
        """
        try:
            # Create a temporary directory to store images
            with tempfile.TemporaryDirectory() as temp_dir:
                # Convert PDF pages to images
                pdf_document = cv2.imread(pdf_path)
                
                # Apply OCR to each image
                text = pytesseract.image_to_string(
                    pdf_document,
                    lang=self.ocr_language,
                    config='--psm 6'  # Assume a single uniform block of text
                )
                
                return {1: text}  # Return text mapped to page 1 (simplified)
        except Exception as e:
            logger.error(f"Error extracting text with OCR: {str(e)}")
            return {}
    
    def parse_pdf_to_dataframes(self, pdf_path: str) -> List[pd.DataFrame]:
        """
        Parse PDF and convert to pandas DataFrames.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of pandas DataFrames containing extracted data
        """
        extracted_tables = []
        
        # First try tabula
        tabula_tables = self.extract_tables_with_tabula(pdf_path)
        if tabula_tables:
            extracted_tables.extend(tabula_tables)
        
        # If no tables found with tabula, try camelot
        if not extracted_tables:
            camelot_tables = self.extract_tables_with_camelot(pdf_path)
            if camelot_tables:
                extracted_tables.extend(camelot_tables)
        
        # If still no tables found and OCR is enabled, try OCR
        if not extracted_tables and self.ocr_enabled:
            try:
                # Use pdfplumber to get page images
                with pdfplumber.open(pdf_path) as pdf:
                    for i, page in enumerate(pdf.pages):
                        img = page.to_image()
                        img_path = f"temp_page_{i}.png"
                        img.save(img_path)
                        
                        # Apply OCR
                        text = pytesseract.image_to_string(
                            cv2.imread(img_path),
                            lang=self.ocr_language
                        )
                        
                        # Try to parse the OCR text into a structured format
                        # This is a simplistic approach; actual implementation would need to be more sophisticated
                        lines = [line for line in text.split('\n') if line.strip()]
                        if lines:
                            # Estimate columns by splitting the first line by whitespace
                            header = lines[0].split()
                            num_cols = len(header)
                            
                            data = []
                            for line in lines[1:]:
                                parts = line.split()
                                # Ensure all rows have the same number of columns
                                if len(parts) == num_cols:
                                    data.append(parts)
                            
                            if data:
                                extracted_tables.append(pd.DataFrame(data, columns=header))
                        
                        # Remove temporary image file
                        os.remove(img_path)
            except Exception as e:
                logger.error(f"Error during OCR processing: {str(e)}")
        
        return extracted_tables
    
    def convert_to_csv(self, pdf_path: str, output_dir: str = None) -> List[str]:
        """
        Convert PDF to CSV files.
        
        Args:
            pdf_path: Path to the PDF file
            output_dir: Directory to save output files (default: None, uses current directory)
            
        Returns:
            List of paths to the generated CSV files
        """
        dataframes = self.parse_pdf_to_dataframes(pdf_path)
        
        if not dataframes:
            logger.warning("No tables found in the PDF.")
            return []
        
        output_paths = []
        pdf_filename = os.path.basename(pdf_path)
        pdf_name = os.path.splitext(pdf_filename)[0]
        
        # Use output_dir if provided, otherwise use current directory
        save_dir = output_dir if output_dir else os.getcwd()
        os.makedirs(save_dir, exist_ok=True)
        
        for i, df in enumerate(dataframes):
            if df.empty:
                continue
                
            output_filename = f"{pdf_name}_table_{i+1}.csv"
            output_path = os.path.join(save_dir, output_filename)
            
            df.to_csv(output_path, index=False)
            output_paths.append(output_path)
            
        return output_paths
    
    def convert_to_xlsx(self, pdf_path: str, output_dir: str = None) -> Optional[str]:
        """
        Convert PDF to a single XLSX file with multiple sheets.
        
        Args:
            pdf_path: Path to the PDF file
            output_dir: Directory to save output file (default: None, uses current directory)
            
        Returns:
            Path to the generated XLSX file or None if no tables were found
        """
        dataframes = self.parse_pdf_to_dataframes(pdf_path)
        
        if not dataframes:
            logger.warning("No tables found in the PDF.")
            return None
        
        pdf_filename = os.path.basename(pdf_path)
        pdf_name = os.path.splitext(pdf_filename)[0]
        
        # Use output_dir if provided, otherwise use current directory
        save_dir = output_dir if output_dir else os.getcwd()
        os.makedirs(save_dir, exist_ok=True)
        
        output_filename = f"{pdf_name}.xlsx"
        output_path = os.path.join(save_dir, output_filename)
        
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            for i, df in enumerate(dataframes):
                if df.empty:
                    continue
                sheet_name = f"Table {i+1}"
                df.to_excel(writer, sheet_name=sheet_name, index=False)
        
        return output_path
