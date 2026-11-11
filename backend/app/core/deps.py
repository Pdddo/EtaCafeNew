from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Set

from app.db.database import get_db
from app.models.models import User
from app.core.security import decode_access_token

# HTTPBearer dengan auto_error=False agar kita bisa kontrol pesan error 401 kustom
bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency untuk mengekstrak dan memvalidasi JWT Bearer token dari header Authorization.
    Mengembalikan data user aktif dari database (berdasarkan email_or_phone).
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token otentikasi tidak ditemukan. Silakan login terlebih dahulu.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau telah kedaluwarsa.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    identifier: Optional[str] = payload.get("sub")
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Klaim token (sub) tidak ditemukan.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.email_or_phone == identifier).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Pengguna pemilik token ini tidak ditemukan di sistem.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency opsional: mengembalikan User jika token valid, atau None jika tanpa token / token tidak valid.
    Cocok untuk endpoint publik yang tetap bisa mengenali user jika sedang login (misal: checkout pelanggan).
    """
    if not credentials or not credentials.credentials:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None

    identifier = payload.get("sub")
    if not identifier:
        return None

    return db.query(User).filter(User.email_or_phone == identifier).first()


def require_role(*allowed_roles: str):
    """
    Factory dependency untuk membatasi endpoint hanya bagi role tertentu.
    Mendukung pemanggilan:
      - require_role("kasir")
      - require_role("kasir", "manajer")
      - require_role(["kasir", "manajer"])
    """
    roles_set: Set[str] = set()
    for r in allowed_roles:
        if isinstance(r, (list, tuple, set)):
            roles_set.update(str(item) for item in r)
        else:
            roles_set.add(str(r))

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles_set:
            allowed_str = ", ".join(sorted(roles_set))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak: role '{current_user.role}' tidak memiliki izin (dibutuhkan: {allowed_str})."
            )
        return current_user

    return role_checker
