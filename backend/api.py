"""
FileFlip API
-----------
FastAPI application for PDF to CSV/XLSX conversion.
"""

import io
import tempfile
import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging

# Import the PDF extraction and conversion modules
from app.services.pdf_extractor import PDFExtractor, DataConverter

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the FastAPI app
app = FastAPI(
    title="FileFlip API",
    description="API for converting PDF documents to CSV/XLSX formats",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create instances of our services
pdf_extractor = PDFExtractor()
data_converter = DataConverter()

# Models
class TablePreview(BaseModel):
    table_id: str
    page: int
    rows: int
    columns: int
    preview_data: List[Dict[str, Any]]
    has_multi_header: bool
    column_names: List[str]
    
class ConversionRequest(BaseModel):
    table_id: str
    format: str
    options: Optional[Dict[str, Any]] = None

# Temporary storage for uploaded files
# In a production environment, use a proper storage solution
temp_files = {}

@app.post("/api/upload", response_model=List[TablePreview])
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a PDF file for processing.
    
    Returns table previews extracted from the PDF.
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
        
    try:
        # Extract tables from the PDF
        tables = await pdf_extractor.extract_tables(file)
        
        if not tables:
            return JSONResponse(
                status_code=200,
                content={"message": "No tables found in the PDF", "tables": []}
            )
        
        # Store file in memory for later conversion
        contents = await file.read()
        temp_file = io.BytesIO(contents)
        temp_file_id = f"temp_{file.filename}"
        temp_files[temp_file_id] = {
            "file_obj": temp_file,
            "filename": file.filename,
            "tables": tables
        }
        
        # Return previews of the tables
        previews = []
        for table in tables:
            previews.append(TablePreview(
                table_id=table["table_id"],
                page=table["page"],
                rows=table["rows"],
                columns=table["columns"],
                preview_data=table["preview_data"],
                has_multi_header=table["has_multi_header"],
                column_names=table["column_names"]
            ))
        
        return previews
        
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/convert/{table_id}")
async def convert_table(
    table_id: str,
    format: str = Form(...),
    output_filename: Optional[str] = Form(None),
    delimiter: Optional[str] = Form(','),
    sheet_name: Optional[str] = Form('Sheet1'),
    include_headers: bool = Form(True),
    skip_rows: int = Form(0)
):
    """
    Convert an extracted table to the specified format.
    
    Args:
        table_id: ID of the table to convert
        format: Output format (csv, xlsx, sage)
        output_filename: Custom filename for the output
        delimiter: Delimiter for CSV files
        sheet_name: Sheet name for Excel files
        include_headers: Whether to include headers in the output
        skip_rows: Number of rows to skip from the beginning
    
    Returns:
        The converted file as a download.
    """
    # Find the table in our temporary storage
    for temp_id, temp_data in temp_files.items():
        for table in temp_data["tables"]:
            if table["table_id"] == table_id:
                try:
                    # Get the table data
                    data = table["data"]
                    
                    # Apply options
                    if skip_rows > 0:
                        data = data[skip_rows:]
                    
                    # Convert to the requested format
                    if format.lower() == "csv":
                        result = data_converter.to_csv(data, delimiter=delimiter)
                        media_type = "text/csv"
                        if not output_filename:
                            output_filename = f"{table_id}.csv"
                    
                    elif format.lower() == "xlsx":
                        result = data_converter.to_excel(data, sheet_name=sheet_name)
                        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        if not output_filename:
                            output_filename = f"{table_id}.xlsx"
                    
                    elif format.lower() == "sage":
                        result = data_converter.to_sage_format(data)
                        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        if not output_filename:
                            output_filename = f"{table_id}_sage.xlsx"
                    
                    else:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Unsupported format: {format}"
                        )
                    
                    # Return the file as a download
                    return StreamingResponse(
                        result,
                        media_type=media_type,
                        headers={"Content-Disposition": f"attachment; filename={output_filename}"}
                    )
                
                except Exception as e:
                    logger.error(f"Error converting table: {str(e)}")
                    raise HTTPException(
                        status_code=500,
                        detail=f"Error converting table: {str(e)}"
                    )
    
    # If we get here, the table was not found
    raise HTTPException(status_code=404, detail=f"Table not found: {table_id}")

@app.post("/api/batch-convert")
async def batch_convert(
    file_id: str = Form(...),
    format: str = Form(...),
    output_filename: Optional[str] = Form(None),
    delimiter: Optional[str] = Form(','),
    sheet_name: Optional[str] = Form('Sheet1')
):
    """
    Convert all tables in a file to a single output file.
    
    Args:
        file_id: ID of the uploaded file
        format: Output format (csv, xlsx, sage)
        output_filename: Custom filename for the output
        delimiter: Delimiter for CSV files
        sheet_name: Sheet name for Excel files
    
    Returns:
        The converted file as a download.
    """
    if file_id not in temp_files:
        raise HTTPException(status_code=404, detail=f"File not found: {file_id}")
    
    try:
        temp_data = temp_files[file_id]
        tables = temp_data["tables"]
        
        if not tables:
            raise HTTPException(status_code=400, detail="No tables found in the file")
        
        # For Excel, we can combine multiple tables into multiple sheets
        if format.lower() == "xlsx":
            output = io.BytesIO()
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                for i, table in enumerate(tables):
                    sheet_name = f"Table_{i+1}"
                    data_df = pd.DataFrame(table["data"])
                    data_df.to_excel(writer, sheet_name=sheet_name, index=False)
                    
                    # Auto-adjust column widths
                    worksheet = writer.sheets[sheet_name]
                    for j, col in enumerate(data_df.columns):
                        max_len = max(
                            data_df[col].astype(str).map(len).max(),
                            len(str(col))
                        ) + 2
                        
                        col_letter = worksheet.cell(1, j + 1).column_letter
                        worksheet.column_dimensions[col_letter].width = min(max_len, 50)
            
            output.seek(0)
            if not output_filename:
                output_filename = f"{temp_data['filename'].replace('.pdf', '')}_all_tables.xlsx"
                
            return StreamingResponse(
                output,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={output_filename}"}
            )
            
        # For CSV, we concatenate all tables
        elif format.lower() == "csv":
            # Combine all tables (this is a simplistic approach - may not work for all cases)
            all_data = []
            for table in tables:
                all_data.extend(table["data"])
                
            result = data_converter.to_csv(all_data, delimiter=delimiter)
            
            if not output_filename:
                output_filename = f"{temp_data['filename'].replace('.pdf', '')}_all_tables.csv"
                
            return StreamingResponse(
                result,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={output_filename}"}
            )
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format for batch conversion: {format}"
            )
            
    except Exception as e:
        logger.error(f"Error in batch conversion: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error in batch conversion: {str(e)}"
        )

@app.on_event("shutdown")
def cleanup():
    """Clean up temporary files on shutdown."""
    temp_files.clear()

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
