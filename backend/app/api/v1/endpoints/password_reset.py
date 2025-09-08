from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.services.auth_service import AuthService

router = APIRouter()


@router.get("/verify", response_class=HTMLResponse)
async def verify_password_reset_token(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_async_db)
):
    """Verify password reset token and show reset form"""
    auth_service = AuthService(db)
    user = await auth_service.verify_password_reset_token(token)
    
    if not user:
        return HTMLResponse(
            content="""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invalid Reset Link</title>
                <style>
                    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                    .error { color: #dc3545; background: #f8d7da; padding: 15px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h2>Invalid or Expired Reset Link</h2>
                    <p>This password reset link is invalid or has expired. Please request a new password reset.</p>
                </div>
            </body>
            </html>
            """,
            status_code=400
        )
    
    return HTMLResponse(
        content=f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reset Password</title>
            <style>
                body {{ 
                    font-family: Arial, sans-serif; 
                    max-width: 600px; 
                    margin: 50px auto; 
                    padding: 20px; 
                    background: #f5f5f5;
                }}
                .form-container {{ 
                    background: white; 
                    padding: 30px; 
                    border-radius: 10px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .form-group {{ margin-bottom: 20px; }}
                label {{ display: block; margin-bottom: 5px; font-weight: bold; }}
                input[type="password"] {{ 
                    width: 100%; 
                    padding: 12px; 
                    border: 1px solid #ddd; 
                    border-radius: 5px; 
                    font-size: 16px;
                }}
                .btn {{ 
                    background: #007bff; 
                    color: white; 
                    padding: 12px 30px; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer; 
                    font-size: 16px;
                }}
                .btn:hover {{ background: #0056b3; }}
                .success {{ color: #28a745; background: #d4edda; padding: 15px; border-radius: 5px; margin-top: 20px; }}
                .error {{ color: #dc3545; background: #f8d7da; padding: 15px; border-radius: 5px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="form-container">
                <h2>Reset Your Password</h2>
                <p>Hi <strong>{user.username}</strong>, enter your new password below:</p>
                
                <form id="resetForm" onsubmit="resetPassword(event)">
                    <div class="form-group">
                        <label for="password">New Password:</label>
                        <input type="password" id="password" name="password" required minlength="8" 
                               pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?\":{{}}|<>]).{{8,}}$"
                               title="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character">
                        <small style="color: #666; font-size: 12px;">
                            Password must contain: 8+ characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirmPassword">Confirm Password:</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required minlength="8">
                    </div>
                    
                    <button type="submit" class="btn">Reset Password</button>
                </form>
                
                <div id="message"></div>
            </div>

            <script>
                async function resetPassword(event) {{
                    event.preventDefault();
                    
                    const password = document.getElementById('password').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const messageDiv = document.getElementById('message');
                    
                    // Client-side password validation
                    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{{}}|<>]).{{8,}}$/;
                    
                    if (!passwordRegex.test(password)) {{
                        messageDiv.innerHTML = '<div class="error">Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.</div>';
                        return;
                    }}
                    
                    if (password !== confirmPassword) {{
                        messageDiv.innerHTML = '<div class="error">Passwords do not match!</div>';
                        return;
                    }}
                    
                    try {{
                        const response = await fetch('/api/v1/auth/password-reset/confirm', {{
                            method: 'POST',
                            headers: {{
                                'Content-Type': 'application/json',
                            }},
                            body: JSON.stringify({{
                                token: '{token}',
                                new_password: password,
                                confirm_password: confirmPassword
                            }})
                        }});
                        
                        const result = await response.json();
                        
                        if (response.ok) {{
                            messageDiv.innerHTML = '<div class="success">Password reset successful! You can now login with your new password.</div>';
                            document.getElementById('resetForm').style.display = 'none';
                        }} else {{
                            messageDiv.innerHTML = `<div class="error">${{result.detail || 'Password reset failed'}}</div>`;
                        }}
                    }} catch (error) {{
                        messageDiv.innerHTML = '<div class="error">Network error. Please try again.</div>';
                    }}
                }}
            </script>
        </body>
        </html>
        """
    )
