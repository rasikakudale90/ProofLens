import hashlib
from typing import List, Dict, Any, Tuple
import fitz  # PyMuPDF
from app.core.errors import AppError
from app.core.config import settings


class ExtractedPage:
    def __init__(self, page_number: int, text: str, text_hash: str):
        self.page_number = page_number  # 1-based
        self.text = text
        self.text_hash = text_hash


def calculate_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def extract_pdf_pages(pdf_bytes: bytes) -> Tuple[List[ExtractedPage], int]:
    """
    Extracts text page-by-page from raw PDF bytes using PyMuPDF.
    Returns a list of ExtractedPage objects (1-based page numbers) and total page count.
    """
    if not pdf_bytes.startswith(b"%PDF-"):
        raise AppError(
            code="UNSUPPORTED_FILE_TYPE",
            message="Uploaded file is not a valid PDF (missing %PDF signature).",
            status_code=415,
        )

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise AppError(
            code="CORRUPT_DOCUMENT",
            message=f"Could not parse PDF file: {str(e)}",
            status_code=400,
        )

    if doc.is_encrypted:
        raise AppError(
            code="ENCRYPTED_DOCUMENT",
            message="Password-protected or encrypted PDFs are not supported.",
            status_code=400,
        )

    page_count = len(doc)
    if page_count == 0:
        raise AppError(
            code="EMPTY_DOCUMENT",
            message="PDF contains zero pages.",
            status_code=400,
        )

    if page_count > settings.MAX_PDF_PAGES:
        raise AppError(
            code="FILE_LIMIT_EXCEEDED",
            message=f"PDF page count ({page_count}) exceeds maximum permitted ({settings.MAX_PDF_PAGES}).",
            status_code=413,
        )

    extracted_pages: List[ExtractedPage] = []
    total_text_length = 0

    for idx, page in enumerate(doc):
        page_num = idx + 1  # 1-based human-readable page number
        text = page.get_text("text").strip()
        total_text_length += len(text)
        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest() if text else ""
        extracted_pages.append(ExtractedPage(page_number=page_num, text=text, text_hash=text_hash))

    if total_text_length == 0:
        raise AppError(
            code="UNSUPPORTED_FILE_TYPE",
            message="PDF has no extractable text. Scanned or image-only PDFs are not supported in MVP.",
            status_code=415,
        )

    return extracted_pages, page_count
