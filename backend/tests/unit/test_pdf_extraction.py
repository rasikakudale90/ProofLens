import pytest
import fitz
from app.services.pdf_extraction import extract_pdf_pages
from app.core.errors import AppError


def make_test_pdf(pages_text: list) -> bytes:
    doc = fitz.open()
    for text in pages_text:
        page = doc.new_page()
        page.insert_text((50, 72), text)
    b = doc.tobytes()
    doc.close()
    return b


def test_extract_pdf_pages_success():
    texts = [
        "First page content with facts about system architecture.",
        "Second page detailing performance evaluations and citations.",
    ]
    pdf_bytes = make_test_pdf(texts)

    pages, count = extract_pdf_pages(pdf_bytes)
    assert count == 2
    assert len(pages) == 2
    assert pages[0].page_number == 1
    assert "First page" in pages[0].text
    assert pages[1].page_number == 2
    assert "Second page" in pages[1].text


def test_invalid_pdf_header_rejected():
    with pytest.raises(AppError) as exc:
        extract_pdf_pages(b"NOT_A_PDF_CONTENT")
    assert exc.value.code == "UNSUPPORTED_FILE_TYPE"
    assert exc.value.status_code == 415


def test_empty_text_pdf_rejected():
    # Empty page with no text
    doc = fitz.open()
    doc.new_page()
    pdf_bytes = doc.tobytes()
    doc.close()

    with pytest.raises(AppError) as exc:
        extract_pdf_pages(pdf_bytes)
    assert exc.value.code == "UNSUPPORTED_FILE_TYPE"
    assert "no extractable text" in exc.value.message.lower()
