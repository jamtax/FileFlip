"""
FileFlip PDF Data Extraction Service
-----------------------------------
This module handles extraction of tabular data from PDF files.
"""

import io
import os
import pandas as pd
import pdfplumber
import tabula
from typing import List, Dict, Any, Tuple, Optional
from fastapi import UploadFile
import logging

logger = logging.getLogger(__name__)

class PDFExtractor:
    """Extracts tabular data from PDF files using multiple strategies."""

    def __init__(self):
        self.extraction_methods = [
            self._extract_with_pdfplumber,
            self._extract_with_tabula
        ]

    async def extract_tables(self, file: UploadFile) -> List[Dict[str, Any]]:
        """
        Extract tables from a PDF file.
        
        Args:
            file: The uploaded PDF file
            
        Returns:
            A list of dictionaries, each containing a table and metadata
        """
        try:
            # Read the file into memory
            contents = await file.read()
            file_obj = io.BytesIO(contents)
            
            # Try different extraction methods
            for method in self.extraction_methods:
                tables = method(file_obj)
                if tables and len(tables) > 0:
                    return self._prepare_tables_output(tables, file.filename)
            
            # If no tables are found
            logger.warning(f"No tables found in {file.filename}")
            return []
            
        except Exception as e:
            logger.error(f"Error extracting tables from PDF: {str(e)}")
            raise
        finally:
            # Reset file pointer for potential reuse
            await file.seek(0)

    def _extract_with_pdfplumber(self, file_obj: io.BytesIO) -> List[pd.DataFrame]:
        """Extract tables using pdfplumber library."""
        tables = []
        
        try:
            with pdfplumber.open(file_obj) as pdf:
                for i, page in enumerate(pdf.pages):
                    extracted_tables = page.extract_tables()
                    for j, table in enumerate(extracted_tables):
                        if table and len(table) > 1:  # Skip empty tables
                            # Convert to DataFrame
                            df = pd.DataFrame(table[1:], columns=table[0])
                            # Clean up column names
                            df.columns = [str(col).strip() for col in df.columns]
                            tables.append({
                                'data': df,
                                'page': i + 1,
                                'table_index': j,
                                'method': 'pdfplumber'
                            })
            
            file_obj.seek(0)  # Reset file pointer for potential reuse
            return tables
        except Exception as e:
            logger.error(f"pdfplumber extraction failed: {str(e)}")
            file_obj.seek(0)  # Reset file pointer
            return []

    def _extract_with_tabula(self, file_obj: io.BytesIO) -> List[pd.DataFrame]:
        """Extract tables using tabula-py library."""
        tables = []
        
        try:
            # Save the BytesIO to a temporary file since tabula requires a file path
            temp_file_path = "temp_pdf.pdf"
            with open(temp_file_path, 'wb') as f:
                f.write(file_obj.getvalue())
            
            # Extract tables with tabula
            extracted_dfs = tabula.read_pdf(temp_file_path, pages='all', multiple_tables=True)
            
            for i, df in enumerate(extracted_dfs):
                if not df.empty:
                    tables.append({
                        'data': df,
                        'page': i + 1,  # This is an approximation
                        'table_index': i,
                        'method': 'tabula'
                    })
            
            # Clean up temp file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                
            return tables
        except Exception as e:
            logger.error(f"tabula extraction failed: {str(e)}")
            if os.path.exists("temp_pdf.pdf"):
                os.remove("temp_pdf.pdf")
            return []

    def _prepare_tables_output(self, tables: List[Dict], filename: str) -> List[Dict[str, Any]]:
        """Prepare tables for output, with basic data cleaning."""
        results = []
        
        for table_info in tables:
            df = table_info['data']
            
            # Basic data cleaning
            df = self._clean_dataframe(df)
            
            # Detect if it's a multi-header table (when first rows look like headers)
            has_multi_header = self._detect_multi_header(df)
            
            results.append({
                'table_id': f"{filename.replace('.pdf', '')}_p{table_info['page']}_t{table_info['table_index']}",
                'page': table_info['page'],
                'rows': len(df),
                'columns': len(df.columns),
                'method': table_info['method'],
                'preview_data': df.head(5).to_dict('records'),
                'has_multi_header': has_multi_header,
                'column_names': df.columns.tolist(),
                'data': df.to_dict('records'),
                'filename': filename
            })
            
        return results

    def _clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and prepare the dataframe."""
        # Remove unnamed columns
        df = df.loc[:, ~df.columns.str.contains('^Unnamed')]
        
        # Fill NaN with empty strings
        df = df.fillna('')
        
        # Convert all column names to strings
        df.columns = df.columns.astype(str)
        
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()
        
        # Replace empty strings and all-space strings in column names
        df.columns = [col if col.strip() else f"Column_{i}" for i, col in enumerate(df.columns)]
        
        # Remove duplicate column names by adding a suffix
        seen = {}
        new_cols = []
        for i, col in enumerate(df.columns):
            if col in seen:
                seen[col] += 1
                new_cols.append(f"{col}_{seen[col]}")
            else:
                seen[col] = 0
                new_cols.append(col)
        df.columns = new_cols
        
        return df

    def _detect_multi_header(self, df: pd.DataFrame) -> bool:
        """Detect if the table likely has multiple header rows."""
        # Skip if too few rows
        if len(df) < 3:
            return False
        
        # Check if first row looks like a header
        first_row = df.iloc[0]
        cells_with_text = sum(1 for cell in first_row if str(cell).strip() != '')
        
        # If >50% of cells have content and content is mostly text, it might be a header
        if cells_with_text / len(first_row) > 0.5:
            numeric_cells = sum(1 for cell in first_row if str(cell).strip().replace('.', '', 1).isdigit())
            if numeric_cells / cells_with_text < 0.3:  # Less than 30% numeric
                return True
                
        return False


class DataConverter:
    """Converts extracted data to various formats."""
    
    def to_csv(self, data: List[Dict], delimiter: str = ',') -> io.StringIO:
        """
        Convert table data to CSV format.
        
        Args:
            data: List of dictionaries representing table rows
            delimiter: CSV delimiter character
            
        Returns:
            StringIO object containing CSV data
        """
        df = pd.DataFrame(data)
        output = io.StringIO()
        df.to_csv(output, index=False, sep=delimiter)
        output.seek(0)
        return output
    
    def to_excel(self, data: List[Dict], sheet_name: str = 'Sheet1') -> io.BytesIO:
        """
        Convert table data to Excel format.
        
        Args:
            data: List of dictionaries representing table rows
            sheet_name: Name for the Excel sheet
            
        Returns:
            BytesIO object containing Excel data
        """
        df = pd.DataFrame(data)
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name=sheet_name)
            
            # Auto-adjust column widths
            worksheet = writer.sheets[sheet_name]
            for i, col in enumerate(df.columns):
                max_len = max(
                    df[col].astype(str).map(len).max(),
                    len(str(col))
                ) + 2  # Adding a little extra space
                
                # Convert to excel column letter (A, B, C, etc.)
                col_letter = writer.sheets[sheet_name].cell(1, i + 1).column_letter
                worksheet.column_dimensions[col_letter].width = min(max_len, 50)  # Cap width at 50 characters
        
        output.seek(0)
        return output

    def to_sage_format(self, data: List[Dict]) -> io.BytesIO:
        """
        Convert table data to a format compatible with Sage accounting software.
        
        Args:
            data: List of dictionaries representing table rows
            
        Returns:
            BytesIO object containing Sage-compatible data
        """
        # Map columns to Sage-expected format if possible
        df = pd.DataFrame(data)
        
        # Attempt to identify and rename columns to match Sage format
        column_mapping = self._get_sage_column_mapping(df.columns)
        if column_mapping:
            df = df.rename(columns=column_mapping)
        
        # Filter to only include columns needed by Sage
        sage_columns = [
            'Description', 'Reference', 'Date', 'Amount', 'VAT', 'Account'
        ]
        
        # Keep only the columns that exist in the DF
        available_sage_columns = [col for col in sage_columns if col in df.columns]
        
        # If we have enough Sage columns, keep only those
        if len(available_sage_columns) >= 3:
            df = df[available_sage_columns]
        
        # Format dates if a Date column exists
        if 'Date' in df.columns:
            try:
                df['Date'] = pd.to_datetime(df['Date']).dt.strftime('%d/%m/%Y')
            except:
                # Keep original if conversion fails
                pass
                
        # Format numbers
        for col in ['Amount', 'VAT']:
            if col in df.columns:
                try:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                    df[col] = df[col].fillna(0).round(2)
                except:
                    # Keep original if conversion fails
                    pass
        
        # Convert to Excel
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Sage Import')
            
        output.seek(0)
        return output
        
    def _get_sage_column_mapping(self, columns: List[str]) -> Dict[str, str]:
        """
        Attempt to map existing columns to Sage-expected format.
        
        Args:
            columns: List of current column names
            
        Returns:
            Dictionary mapping current names to Sage names
        """
        mapping = {}
        columns_lower = [col.lower() for col in columns]
        
        # Map for common column names
        sage_mappings = {
            'description': ['description', 'desc', 'item', 'details', 'transaction', 'narration'],
            'reference': ['reference', 'ref', 'ref no', 'no', 'number', 'invoice no', 'invoice'],
            'date': ['date', 'invoice date', 'transaction date', 'doc date'],
            'amount': ['amount', 'total', 'net amount', 'value', 'sum', 'netto', 'price', 'cost', 'net'],
            'vat': ['vat', 'tax', 'gst', 'sales tax', 'vat amount', 'tax amount'],
            'account': ['account', 'account code', 'acc', 'gl code', 'ledger', 'nominal']
        }
        
        for sage_col, possible_names in sage_mappings.items():
            for i, col_lower in enumerate(columns_lower):
                if any(name in col_lower for name in possible_names):
                    mapping[columns[i]] = sage_col.capitalize()
                    break
                    
        return mapping
