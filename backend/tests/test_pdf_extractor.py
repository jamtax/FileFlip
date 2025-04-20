# backend/tests/test_pdf_extractor.py
import pytest
from app.services.pdf_extractor import PDFExtractor, DataConverter
import io

def test_clean_dataframe():
    extractor = PDFExtractor()
    # Test with sample data
    df = pd.DataFrame({
        'Unnamed: 0': [1, 2, 3],
        'Description': ['Item 1', 'Item 2', 'Item 3'],
        'Amount': [100.50, 200.75, 300.00]
    })
    cleaned_df = extractor._clean_dataframe(df)
    assert 'Unnamed: 0' not in cleaned_df.columns
    assert 'Description' in cleaned_df.columns