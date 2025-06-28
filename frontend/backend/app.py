import os
import shutil
import tempfile
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging
import uuid

from converter.pdf_converter import PDFConverter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create a temporary directory for file storage
TEMP_DIR = os.path.join(tempfile.gettempdir(), "fileflip")
os.makedirs(TEMP_DIR, exist_ok=True)

app = FastAPI(
    title="FileFlip API",
    description="API for converting PDF files to CSV/XLSX formats",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class TableInfo(BaseModel):
    page: int
    rows: int
    columns: int
    extraction_method: str
    preview: dict

class ConversionResponse(BaseModel):
    job_id: str
    message: str
    
class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    output_files: Optional[List[str]] = None
    error_message: Optional[str] = None

# Store job statuses in-memory (would use a database in production)
jobs = {}

@app.post("/api/detect-tables", response_model=List[TableInfo])
async def detect_tables(file: UploadFile = File(...)):
    """
    Detect tables in a PDF file and return metadata about them.
    """
    # Save uploaded file temporarily
    temp_file_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_{file.filename}")
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Detect tables in the PDF
        converter = PDFConverter()
        tables_info = converter.detect_tables(temp_file_path)
        
        return tables_info
    
    except Exception as e:
        logger.error(f"Error detecting tables: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error detecting tables: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

def process_conversion(job_id: str, file_path: str, output_format: str, ocr_enabled: bool):
    """
    Background task to process the conversion.
    """
    try:
        # Update job status
        jobs[job_id]["status"] = "processing"
        
        # Create output directory
        output_dir = os.path.join(TEMP_DIR, job_id)
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize converter
        converter = PDFConverter(ocr_enabled=ocr_enabled)
        
        # Convert based on output format
        if output_format == "csv":
            output_files = converter.convert_to_csv(file_path, output_dir)
            jobs[job_id]["output_files"] = output_files
        elif output_format == "xlsx":
            output_file = converter.convert_to_xlsx(file_path, output_dir)
            if output_file:
                jobs[job_id]["output_files"] = [output_file]
            else:
                jobs[job_id]["output_files"] = []
        
        # Update job status
        if jobs[job_id].get("output_files"):
            jobs[job_id]["status"] = "completed"
        else:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error_message"] = "No tables could be extracted from the PDF"
    
    except Exception as e:
        logger.error(f"Error processing conversion: {str(e)}")
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error_message"] = str(e)
    
    finally:
        # Clean up input file
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/api/convert", response_model=ConversionResponse)
async def convert_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form(...),
    ocr_enabled: bool = Form(False)
):
    """
    Convert a PDF file to the specified output format (csv or xlsx).
    """
    if output_format not in ["csv", "xlsx"]:
        raise HTTPException(status_code=400, detail="Invalid output format. Use 'csv' or 'xlsx'.")
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Save uploaded file temporarily
    temp_file_path = os.path.join(TEMP_DIR, f"{job_id}_{file.filename}")
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Initialize job status
        jobs[job_id] = {
            "status": "queued",
            "output_files": None,
            "error_message": None
        }
        
        # Process conversion in background
        background_tasks.add_task(
            process_conversion,
            job_id,
            temp_file_path,
            output_format,
            ocr_enabled
        )
        
        return {
            "job_id": job_id,
            "message": "Conversion started. Check job status for results."
        }
    
    except Exception as e:
        logger.error(f"Error starting conversion: {str(e)}")
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Error starting conversion: {str(e)}")

@app.get("/api/job/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get the status of a conversion job.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "job_id": job_id,
        "status": jobs[job_id]["status"],
        "output_files": jobs[job_id].get("output_files"),
        "error_message": jobs[job_id].get("error_message")
    }

@app.get("/api/download/{job_id}/{file_index}")
async def download_file(job_id: str, file_index: int):
    """
    Download a converted file.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if jobs[job_id]["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")
    
    output_files = jobs[job_id].get("output_files", [])
    
    if not output_files or file_index >= len(output_files):
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = output_files[file_index]
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        file_path,
        filename=os.path.basename(file_path),
        media_type="application/octet-stream"
    )

@app.delete("/api/job/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a job and its files.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Delete output files
    output_files = jobs[job_id].get("output_files", [])
    for file_path in output_files:
        if os.path.exists(file_path):
            os.remove(file_path)
    
    # Delete job directory
    job_dir = os.path.join(TEMP_DIR, job_id)
    if os.path.exists(job_dir):
        shutil.rmtree(job_dir)
    
    # Remove job from memory
    del jobs[job_id]
    
    return {"message": "Job deleted successfully"}

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
