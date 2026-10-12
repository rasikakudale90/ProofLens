import io
import pytest


def test_local_storage_upload_and_download(temp_storage):
    content = b"%PDF-1.4 Mock PDF content for test"
    key = "test_doc.pdf"

    # Upload
    uploaded_key = temp_storage.upload_file(key, content)
    assert uploaded_key == key
    assert temp_storage.file_exists(key) is True

    # Download
    downloaded = temp_storage.download_file(key)
    assert downloaded == content

    # Delete
    deleted = temp_storage.delete_file(key)
    assert deleted is True
    assert temp_storage.file_exists(key) is False


def test_local_storage_file_not_found(temp_storage):
    with pytest.raises(FileNotFoundError):
        temp_storage.download_file("non_existent.pdf")
