import uuid
from sqlalchemy import (
    create_engine,
    Column,
    ForeignKey,
    DateTime,
    Float,
    Boolean,
    JSON,
    func
)
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

class UUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        
        # Ensure value is a UUID object before processing
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(value)
            
        if dialect.name == 'postgresql':
            return str(value)
        else:
            return value.hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(value)
        
        return value

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Course(Base):
    __tablename__ = "courses"
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    total_distance_km = Column(Float, nullable=False)
    is_favorite = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    route_points = Column(JSON, nullable=False)
    drawing_points = Column(JSON, nullable=False)