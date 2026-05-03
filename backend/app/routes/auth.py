"""
Auth Router — Endpoint untuk registrasi dan login user.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth_schema import RegisterRequest, LoginRequest, TokenResponse, UserResponse, ProfileUpdateRequest
from app.service.auth_service import hash_password, verify_password, create_access_token, require_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Daftarkan user baru."""

    # Cek apakah email sudah terdaftar
    existing_email = db.query(User).filter(User.email == req.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar",
        )

    # Cek apakah username sudah dipakai
    existing_username = db.query(User).filter(User.username == req.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username sudah digunakan",
        )

    # Buat user baru
    new_user = User(
        username=req.username,
        email=req.email,
        password=hash_password(req.password),
        role=UserRole.user,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        role=new_user.role.value,
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login dan dapatkan JWT token."""

    # Cari user berdasarkan email
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah dinonaktifkan",
        )

    # Buat access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            role=user.role.value,
        ),
    )

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    req: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Update detail profil user yang sedang login."""
    
    # Check email duplicate (jika email diubah)
    if req.email != current_user.email:
        existing_email = db.query(User).filter(User.email == req.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email sudah digunakan")
            
    # Check username duplicate (jika username diubah)
    if req.username != current_user.username:
        existing_username = db.query(User).filter(User.username == req.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username sudah digunakan")

    current_user.username = req.username
    current_user.email = req.email
    
    if req.password:
        current_user.password = hash_password(req.password)
        
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
    )
