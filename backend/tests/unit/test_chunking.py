from app.services.pdf_extraction import ExtractedPage
from app.services.chunking import chunk_extracted_pages


def test_chunking_short_page():
    page = ExtractedPage(page_number=1, text="ProofLens AI provides evidence-first intelligence.", text_hash="abc")
    chunks = chunk_extracted_pages([page], chunk_size=100, chunk_overlap=10)

    assert len(chunks) == 1
    assert chunks[0].page_number == 1
    assert chunks[0].chunk_index == 0
    assert "evidence-first" in chunks[0].text


def test_chunking_multi_page_and_overlap():
    long_text = " ".join([f"fact_{i}" for i in range(120)])
    p1 = ExtractedPage(page_number=1, text=long_text, text_hash="h1")
    p2 = ExtractedPage(page_number=2, text="Second page short summary.", text_hash="h2")

    chunks = chunk_extracted_pages([p1, p2], chunk_size=50, chunk_overlap=10)

    assert len(chunks) > 2
    # Verify sequential global index
    for idx, c in enumerate(chunks):
        assert c.chunk_index == idx

    # Verify 1-based page numbers are preserved
    p1_chunks = [c for c in chunks if c.page_number == 1]
    p2_chunks = [c for c in chunks if c.page_number == 2]
    assert len(p1_chunks) >= 2
    assert len(p2_chunks) == 1
    assert p2_chunks[0].page_number == 2
