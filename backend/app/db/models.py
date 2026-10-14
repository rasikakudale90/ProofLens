import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    Float,
    JSON,
    Enum,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator

try:
    import pgvector.vector
    from pgvector.sqlalchemy import Vector

    _orig_vector_from_db = pgvector.vector.Vector._from_db

    def _safe_vector_from_db(cls, value, /):
        if value is None:
            return None
        if isinstance(value, list):
            return [float(v) for v in value]
        return _orig_vector_from_db(value)

    pgvector.vector.Vector._from_db = classmethod(_safe_vector_from_db)
except ImportError:
    Vector = None  # type: ignore

Base = declarative_base()


class FlexibleVector(TypeDecorator):
    """
    Uses pgvector's Vector(dimensions) on PostgreSQL,
    and falls back to JSON on other dialects (such as SQLite during unit tests).
    """
    impl = Text
    cache_ok = True

    def __init__(self, dimensions: int = 768, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dimensions = dimensions

    def load_dialect_impl(self, dialect):
        from app.core.config import settings
        if dialect.name == "postgresql" and getattr(settings, "USE_PGVECTOR", False) and Vector is not None:
            return dialect.type_descriptor(Vector(self.dimensions))
        return dialect.type_descriptor(JSON())

    def process_bind_param(self, value, dialect):
        return value

    def process_result_value(self, value, dialect):
        return value


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    role = Column(String(100), default="Lead Forensic Auditor", nullable=False)
    avatar_color = Column(String(50), default="#6366f1", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    workspaces = relationship("Workspace", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")


class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    user = relationship("User", back_populates="workspaces")
    documents = relationship("Document", back_populates="workspace", cascade="all, delete-orphan")
    query_runs = relationship("QueryRun", back_populates="workspace", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="workspace", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="workspace", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    storage_key = Column(String(512), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    status = Column(String(50), default="uploaded", nullable=False, index=True)  # uploaded, processing, ready, failed
    page_count = Column(Integer, nullable=True)
    checksum = Column(String(64), nullable=True)
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    workspace = relationship("Workspace", back_populates="documents")
    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentPage(Base):
    __tablename__ = "document_pages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)  # 1-based
    text = Column(Text, nullable=False)
    text_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    document = relationship("Document", back_populates="pages")

    __table_args__ = (
        UniqueConstraint("document_id", "page_number", name="uq_document_page"),
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page_number = Column(Integer, nullable=False)  # 1-based provenance
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    start_char = Column(Integer, nullable=True)
    end_char = Column(Integer, nullable=True)
    embedding_model = Column(String(100), nullable=True)
    embedding = Column(FlexibleVector(768), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    document = relationship("Document", back_populates="chunks")
    citations = relationship("Citation", back_populates="chunk", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("document_id", "chunk_index", name="uq_document_chunk_idx"),
    )


class QueryRun(Base):
    __tablename__ = "query_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    selected_document_ids = Column(JSON, nullable=True)
    status = Column(String(50), default="completed", nullable=False)
    latency_ms = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    workspace = relationship("Workspace", back_populates="query_runs")
    answers = relationship("Answer", back_populates="query_run", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    query_run_id = Column(String(36), ForeignKey("query_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    answer_text = Column(Text, nullable=False)
    status = Column(String(50), default="answered", nullable=False)  # answered, insufficient_evidence
    limitations = Column(JSON, default=list, nullable=False)
    model_metadata = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    query_run = relationship("QueryRun", back_populates="answers")
    citations = relationship("Citation", back_populates="answer", cascade="all, delete-orphan")


class Citation(Base):
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    answer_id = Column(String(36), ForeignKey("answers.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("document_chunks.id", ondelete="CASCADE"), nullable=False, index=True)
    citation_order = Column(Integer, default=1, nullable=False)
    excerpt = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    answer = relationship("Answer", back_populates="citations")
    chunk = relationship("DocumentChunk", back_populates="citations")


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    analysis_type = Column(String(50), nullable=False)  # claim_ledger, contradiction_radar, research_brief
    input_data = Column(JSON, default=dict, nullable=False)
    result_data = Column(JSON, default=dict, nullable=False)
    status = Column(String(50), default="completed", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    workspace = relationship("Workspace", back_populates="analysis_runs")


class EvaluationCase(Base):
    __tablename__ = "evaluation_cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    case_key = Column(String(100), unique=True, nullable=False)
    question = Column(Text, nullable=False)
    expected_evidence = Column(JSON, default=list, nullable=False)
    expected_behaviour = Column(String(100), nullable=False)  # answerable, abstain
    tags = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    metrics = Column(JSON, default=dict, nullable=False)
    sample_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), default="New Conversation", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    workspace = relationship("Workspace", back_populates="conversations")
    user = relationship("User", back_populates="conversations")
    messages = relationship(
        "ConversationMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ConversationMessage.created_at.asc()",
    )


class ConversationMessage(Base):
    __tablename__ = "conversation_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    status = Column(String(50), nullable=True)  # "answered", "insufficient_evidence"
    citations = Column(JSON, default=list, nullable=False)
    limitations = Column(JSON, default=list, nullable=False)
    model_metadata = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
