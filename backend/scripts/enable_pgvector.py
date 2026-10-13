import sys
sys.stdout.reconfigure(encoding='utf-8')
import psycopg

def main():
    print("Testing pgvector in PostgreSQL database 'prooflens'...")
    try:
        conn = psycopg.connect("postgresql://postgres:rasika@localhost:5432/prooflens")
        with conn.cursor() as cur:
            cur.execute("SELECT name, default_version, installed_version FROM pg_available_extensions WHERE name = 'vector';")
            ext = cur.fetchone()
            if not ext:
                print("❌ pgvector files not detected in PostgreSQL 16 share/extension directory yet.")
                print("👉 Please right-click 'install_pgvector.bat' and choose 'Run as administrator'.")
                sys.exit(1)
            
            print(f"✅ Extension available: {ext[0]} (default version: {ext[1]}, installed: {ext[2]})")
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            conn.commit()
            print("✅ Successfully executed 'CREATE EXTENSION IF NOT EXISTS vector;'")

            # Test vector operation
            cur.execute("SELECT '[1,2,3]'::vector <=> '[1,2,4]'::vector AS cosine_dist;")
            dist = cur.fetchone()[0]
            print(f"✅ Vector distance calculation verified (sample distance: {dist})")

            # Ensure document_chunks table embedding column is migrated to vector(768)
            cur.execute("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'document_chunks' 
                        AND column_name = 'embedding' 
                        AND data_type = 'json'
                    ) THEN
                        ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(768) USING (embedding::text)::vector;
                    END IF;
                END $$;
            """)
            conn.commit()
            print("✅ document_chunks table schema verified for pgvector storage")

        conn.close()
        print("\n🎉 pgvector is 100% functional and ready in database 'prooflens'!")
    except Exception as e:
        print(f"❌ Error enabling pgvector: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
