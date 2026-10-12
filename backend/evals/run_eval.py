"""
ProofLens AI Evaluation Runner CLI
Usage:
    python evals/run_eval.py
"""
import sys
import os

# Add parent directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import SessionLocal, check_db_health
from app.storage import get_storage_service
from app.providers.gemini import get_ai_provider
from app.services.evaluation import run_evaluation_suite


def get_eval_session():
    if check_db_health():
        return SessionLocal()
    # Fallback to local SQLite file for standalone CLI evaluation
    print("[!] Primary PostgreSQL/Supabase database not reachable; using standalone local eval database (sqlite:///eval_benchmark.db).")
    engine = create_engine("sqlite:///eval_benchmark.db", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return session_factory()


def main():
    print("=" * 60)
    print("  ProofLens AI — Trust & Evaluation Benchmark Suite")
    print("=" * 60)
    db = get_eval_session()
    try:
        storage = get_storage_service()
        provider = get_ai_provider()
        print("\n[+] Running curated benchmark test cases...")
        summary = run_evaluation_suite(db=db, storage=storage, ai_provider=provider)

        print("\n" + "-" * 60)
        print("  BENCHMARK RESULTS")
        print("-" * 60)
        print(f"  Run ID                  : {summary.run_id}")
        print(f"  Total Test Cases        : {summary.sample_count}")
        print(f"  Retrieval Hit Rate      : {summary.retrieval_hit_rate}%")
        print(f"  Citation Validity Rate  : {summary.citation_validity_rate}%")
        print(f"  Abstention Success Rate : {summary.abstention_success_rate}%")
        print(f"  Average Latency         : {summary.average_latency_ms} ms")
        print("-" * 60)
        print("\nIndividual Case Details:")
        for res in summary.results:
            status_flag = "PASS" if res.passed else "FAIL"
            print(f"  [{status_flag}] Case {res.case_id} ({res.expected_behaviour}): {res.notes} ({res.latency_ms} ms)")
        print("\n" + "=" * 60)
        print("  Benchmark Run Complete.")
        print("=" * 60)
    finally:
        db.close()


if __name__ == "__main__":
    main()
