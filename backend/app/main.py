# Add to backend/app/main.py
@app.post("/api/upload", response_model=List[TablePreview])
async def upload_file(file: UploadFile = File(...)):
    # Check file size (limit to 10MB)
    MAX_SIZE = 10 * 1024 * 1024  # 10MB
    file_size = 0
    chunk_size = 1024  # 1KB
    chunk = await file.read(chunk_size)
    while chunk:
        file_size += len(chunk)
        if file_size > MAX_SIZE:
            raise HTTPException(status_code=413, detail="File too large (max 10MB)")
        chunk = await file.read(chunk_size)
    
    # Reset file pointer
    await file.seek(0)
    # Add to backend/app/main.py
app = FastAPI(
    title="FileFlip API",
    description="API for converting PDF documents to CSV/XLSX formats",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)