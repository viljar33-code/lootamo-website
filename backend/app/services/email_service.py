import asyncio
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from jinja2 import Environment, FileSystemLoader, select_autoescape
import os
from pathlib import Path

from app.core.config import settings


class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.use_tls = settings.SMTP_USE_TLS
        
        template_dir = Path(__file__).parent.parent / "templates" / "emails"
        template_dir.mkdir(parents=True, exist_ok=True)
        
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send an email"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)

            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                start_tls=self.use_tls,
                username=self.smtp_username,
                password=self.smtp_password,
            )
            return True

        except Exception as e:
            print(f"Failed to send email to {to_email}: {str(e)}")
            return False

    async def send_welcome_email(self, to_email: str, username: str) -> bool:
        """Send welcome email to new user"""
        try:
            template = self.jinja_env.get_template("welcome.html")
            html_content = template.render(username=username)
            
            return await self.send_email(
                to_email=to_email,
                subject="Welcome to Lootamo!",
                html_content=html_content,
                text_content=f"Welcome to Lootamo, {username}! Thank you for joining us."
            )
        except Exception as e:
            print(f"Failed to send welcome email: {str(e)}")
            return False

    async def send_password_reset_email(
        self, 
        to_email: str, 
        username: str, 
        reset_token: str
    ) -> bool:
        """Send password reset email"""
        try:
            from app.core.config import settings
            template = self.jinja_env.get_template("password_reset.html")
            # Redirect to frontend reset password page with the token
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            
            html_content = template.render(
                username=username,
                reset_url=reset_url,
                reset_token=reset_token
            )
            
            text_content = f"""
Hi {username},

You requested a password reset for your Lootamo account.

Click this link to reset your password:
{reset_url}

This link will expire in 1 hour for security reasons.
If you didn't request this, please ignore this email.

Best regards,
Lootamo Team
            """.strip()
            
            return await self.send_email(
                to_email=to_email,
                subject="Reset Your Lootamo Password",
                html_content=html_content,
                text_content=text_content
            )
        except Exception as e:
            print(f"Failed to send password reset email: {str(e)}")
            return False

    async def send_verification_email(
        self, 
        to_email: str, 
        username: str, 
        verification_token: str
    ) -> bool:
        """Send email verification email"""
        try:
            template = self.jinja_env.get_template("email_verification.html")
            verification_url = f"http://localhost:3000/verify-email?token={verification_token}"
            
            html_content = template.render(
                username=username,
                verification_url=verification_url,
                verification_token=verification_token
            )
            
            text_content = f"""
Hi {username},

Please verify your email address for your Lootamo account.

Click the link below to verify your email:
{verification_url}

Best regards,
Lootamo Team
            """.strip()
            
            return await self.send_email(
                to_email=to_email,
                subject="Verify Your Lootamo Email",
                html_content=html_content,
                text_content=text_content
            )
        except Exception as e:
            print(f"Failed to send verification email: {str(e)}")
            return False


email_service = EmailService()
