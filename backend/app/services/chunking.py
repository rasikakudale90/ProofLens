from typing import List, Dict, Any
from app.services.pdf_extraction import ExtractedPage
from app.core.config import settings


class ChunkData:
    def __init__(
        self,
        chunk_index: int,
        page_number: int,
        text: str,
        start_char: int,
        end_char: int,
    ):
        self.chunk_index = chunk_index
        self.page_number = page_number  # 1-based page number
        self.text = text
        self.start_char = start_char
        self.end_char = end_char


def chunk_extracted_pages(
    pages: List[ExtractedPage],
    chunk_size: int = settings.CHUNK_SIZE,
    chunk_overlap: int = settings.CHUNK_OVERLAP,
) -> List[ChunkData]:
    """
    Chunks extracted pages while strictly preserving 1-based page numbers.
    Uses word-based chunking with configurable window and overlap.
    """
    chunks: List[ChunkData] = []
    global_chunk_idx = 0

    for page in pages:
        text = page.text
        if not text:
            continue

        words = text.split()
        if not words:
            continue

        # If page is shorter than chunk_size words, take it as a single chunk
        if len(words) <= chunk_size:
            chunks.append(
                ChunkData(
                    chunk_index=global_chunk_idx,
                    page_number=page.page_number,
                    text=text,
                    start_char=0,
                    end_char=len(text),
                )
            )
            global_chunk_idx += 1
            continue

        # Sliding window with overlap
        step = max(1, chunk_size - chunk_overlap)
        for i in range(0, len(words), step):
            window_words = words[i : i + chunk_size]
            chunk_text = " ".join(window_words)
            # Find approximate character offsets within page
            start_char = text.find(window_words[0]) if window_words else 0
            end_char = start_char + len(chunk_text)

            chunks.append(
                ChunkData(
                    chunk_index=global_chunk_idx,
                    page_number=page.page_number,
                    text=chunk_text,
                    start_char=max(0, start_char),
                    end_char=max(0, end_char),
                )
            )
            global_chunk_idx += 1

            if i + chunk_size >= len(words):
                break

    return chunks
