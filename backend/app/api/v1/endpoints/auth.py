from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserOut, Token, LoginRequest, RegisterRequest
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_customer(payload: RegisterRequest, db: Session = Depends(get_db)):
    """FR-01: Registrasi akun baru pelanggan menggunakan nama, email/no telp dan sandi."""
    existing = db.query(User).filter(User.email_or_phone == payload.email_or_phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email atau nomor telepon sudah terdaftar."
        )

    user = User(
        name=payload.name,
        email_or_phone=payload.email_or_phone,
        hashed_password=get_password_hash(payload.password),
        role="pelanggan",   # Default role registrasi mandiri adalah pelanggan
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """FR-02: Login pengguna dengan verifikasi bcrypt & token JWT."""
    user = db.query(User).filter(User.email_or_phone == payload.username_or_email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/nomor telepon atau kata sandi tidak valid."
        )

    access_token = create_access_token(data={"sub": user.email_or_phone, "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(user: User = Depends(get_current_user)):
    """Mendapatkan informasi akun pengguna yang sedang login berdasarkan Bearer token."""
    return user
