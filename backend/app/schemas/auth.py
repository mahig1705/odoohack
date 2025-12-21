from pydantic import BaseModel, EmailStr
from typing import Optional
class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "CUSTOMER" 

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class EmailVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetOTPVerify(BaseModel):
    email: EmailStr
    otp: str

class PasswordReset(BaseModel):
    reset_token: str
    new_password: str
