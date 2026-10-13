import logging
from sqlalchemy import text
from app.db.session import engine, SessionLocal
from app.db.models import Base, User, Workspace

logger = logging.getLogger(__name__)

DEFAULT_USERS = [
    {
        "name": "Rasika Kudale",
        "email": "rasika@prooflens.ai",
        "role": "Lead Forensic Auditor",
        "avatar_color": "#6366f1",
    },
    {
        "name": "Alex Vance",
        "email": "alex@prooflens.ai",
        "role": "Senior Research Analyst",
        "avatar_color": "#06b6d4",
    },
    {
        "name": "Devin Hayes",
        "email": "devin@prooflens.ai",
        "role": "Compliance Officer",
        "avatar_color": "#10b981",
    },
]


def init_db():
    """
    Creates any missing tables, ensures migrations/columns exist,
    and seeds initial users.
    """
    try:
        # 1. Create tables if not present
        Base.metadata.create_all(bind=engine)

        # 2. Ensure schema columns exist on PostgreSQL
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name = 'workspaces' AND column_name = 'user_id'
                        ) THEN
                            ALTER TABLE workspaces ADD COLUMN user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL;
                        END IF;

                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name = 'users' AND column_name = 'hashed_password'
                        ) THEN
                            ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255);
                        END IF;
                    END $$;
                    """
                )
            )

        # 3. Seed users if needed
        from app.core.security import hash_password
        default_pwd_hash = hash_password("password123")

        db = SessionLocal()
        try:
            created_users = []
            for u_data in DEFAULT_USERS:
                existing = db.query(User).filter(User.email == u_data["email"]).first()
                if not existing:
                    u = User(
                        name=u_data["name"],
                        email=u_data["email"],
                        hashed_password=default_pwd_hash,
                        role=u_data["role"],
                        avatar_color=u_data["avatar_color"],
                    )
                    db.add(u)
                    created_users.append(u)
                else:
                    if not existing.hashed_password:
                        existing.hashed_password = default_pwd_hash
                    created_users.append(existing)
            db.commit()

            # Assign orphaned workspaces to primary user
            primary_user = db.query(User).filter(User.email == "rasika@prooflens.ai").first()
            if primary_user:
                orphans = db.query(Workspace).filter(Workspace.user_id.is_(None)).all()
                for ws in orphans:
                    ws.user_id = primary_user.id
                db.commit()

            logger.info("Database initialized successfully with multiuser authentication support.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error during init_db: {e}", exc_info=True)
