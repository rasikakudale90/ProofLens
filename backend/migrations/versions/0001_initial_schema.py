"""Initial schema with pgvector

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-12 20:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = None

# revision identifiers, used by Alembic.
revision = '0001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Enable pgvector extension if on PostgreSQL
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2. workspaces
    op.create_table(
        'workspaces',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 3. documents
    op.create_table(
        'documents',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('workspace_id', sa.String(length=36), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('storage_key', sa.String(length=512), nullable=False),
        sa.Column('size_bytes', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('page_count', sa.Integer(), nullable=True),
        sa.Column('checksum', sa.String(length=64), nullable=True),
        sa.Column('error_code', sa.String(length=100), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_documents_workspace_id', 'documents', ['workspace_id'])
    op.create_index('ix_documents_status', 'documents', ['status'])

    # 4. document_pages
    op.create_table(
        'document_pages',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('document_id', sa.String(length=36), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('text_hash', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('document_id', 'page_number', name='uq_document_page'),
    )
    op.create_index('ix_document_pages_document_id', 'document_pages', ['document_id'])

    # 5. document_chunks
    chunk_columns = [
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('document_id', sa.String(length=36), sa.ForeignKey('documents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('start_char', sa.Integer(), nullable=True),
        sa.Column('end_char', sa.Integer(), nullable=True),
        sa.Column('embedding_model', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    ]
    if conn.dialect.name == "postgresql" and Vector is not None:
        chunk_columns.append(sa.Column('embedding', Vector(768), nullable=True))
    else:
        chunk_columns.append(sa.Column('embedding', sa.JSON(), nullable=True))

    op.create_table('document_chunks', *chunk_columns)
    op.create_index('ix_document_chunks_document_id', 'document_chunks', ['document_id'])
    op.create_unique_constraint('uq_document_chunk_idx', 'document_chunks', ['document_id', 'chunk_index'])

    # HNSW vector index for pgvector
    if conn.dialect.name == "postgresql":
        op.execute("""
            CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
            ON document_chunks USING hnsw (embedding vector_cosine_ops);
        """)

    # 6. query_runs
    op.create_table(
        'query_runs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('workspace_id', sa.String(length=36), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('selected_document_ids', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('latency_ms', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_query_runs_workspace_id', 'query_runs', ['workspace_id'])

    # 7. answers
    op.create_table(
        'answers',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('query_run_id', sa.String(length=36), sa.ForeignKey('query_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('answer_text', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('limitations', sa.JSON(), nullable=False),
        sa.Column('model_metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_answers_query_run_id', 'answers', ['query_run_id'])

    # 8. citations
    op.create_table(
        'citations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('answer_id', sa.String(length=36), sa.ForeignKey('answers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chunk_id', sa.String(length=36), sa.ForeignKey('document_chunks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('citation_order', sa.Integer(), nullable=False),
        sa.Column('excerpt', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_citations_answer_id', 'citations', ['answer_id'])
    op.create_index('ix_citations_chunk_id', 'citations', ['chunk_id'])

    # 9. analysis_runs
    op.create_table(
        'analysis_runs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('workspace_id', sa.String(length=36), sa.ForeignKey('workspaces.id', ondelete='CASCADE'), nullable=False),
        sa.Column('analysis_type', sa.String(length=50), nullable=False),
        sa.Column('input_data', sa.JSON(), nullable=False),
        sa.Column('result_data', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_analysis_runs_workspace_id', 'analysis_runs', ['workspace_id'])

    # 10. evaluation_cases
    op.create_table(
        'evaluation_cases',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('case_key', sa.String(length=100), unique=True, nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('expected_evidence', sa.JSON(), nullable=False),
        sa.Column('expected_behaviour', sa.String(length=100), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 11. evaluation_runs
    op.create_table(
        'evaluation_runs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('metrics', sa.JSON(), nullable=False),
        sa.Column('sample_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('evaluation_runs')
    op.drop_table('evaluation_cases')
    op.drop_table('analysis_runs')
    op.drop_table('citations')
    op.drop_table('answers')
    op.drop_table('query_runs')
    op.drop_table('document_chunks')
    op.drop_table('document_pages')
    op.drop_table('documents')
    op.drop_table('workspaces')
