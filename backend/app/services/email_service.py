import asyncio
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict, Any
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path
import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

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
        text_content: Optional[str] = None,
        max_retries: int = 3,
        retry_delay: float = 2.0
    ) -> bool:
        """Send an email with retry logic"""
        last_exception = None
        
        for attempt in range(max_retries + 1):
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
                
                if attempt > 0:
                    print(f"Email sent successfully to {to_email} on attempt {attempt + 1}")
                return True

            except Exception as e:
                last_exception = e
                if attempt < max_retries:
                    print(f"Email attempt {attempt + 1} failed for {to_email}: {str(e)}. Retrying in {retry_delay}s...")
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 1.5  # Exponential backoff
                else:
                    print(f"Email failed permanently for {to_email} after {max_retries + 1} attempts: {str(e)}")
        
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

    async def send_license_key_email(
        self, 
        to_email: str, 
        username: str, 
        product_name: str,
        license_key: str,
        order_id: str
    ) -> bool:
        """Send license key delivery email"""
        try:
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lootamo - Your License Key</title>
                <style>
                    body {{ 
                        font-family: Helvetica, Arial, sans-serif;
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0; 
                        padding: 20px;
                        background-color: #f5f5f5;
                    }}
                    .container {{ 
                        max-width: 650px; 
                        margin: 0 auto; 
                        background: white;
                        border: 1px solid #ddd;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }}
                    .header {{ 
                        background: white;
                        padding: 30px 30px 20px 30px;
                        border-bottom: 2px solid #1a73e8;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 20px;
                        font-weight: bold;
                        color: #333;
                        font-family: Helvetica, Arial, sans-serif;
                    }}
                    .content {{ 
                        padding: 30px;
                    }}
                    .content p {{
                        font-size: 14px;
                        margin: 15px 0;
                    }}
                    .license-table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        border: 1px solid #ddd;
                    }}
                    .license-table th {{
                        background: #f5f5f5;
                        padding: 12px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 14px;
                        border-bottom: 1px solid #ddd;
                    }}
                    .license-table td {{
                        padding: 12px;
                        border-bottom: 1px solid #ddd;
                        font-size: 14px;
                    }}
                    .license-table tr:nth-child(even) {{
                        background: #f9f9f9;
                    }}
                    .license-key-cell {{
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 13px;
                        word-break: break-all;
                        background: #f8f8f8;
                        padding: 8px;
                        border-radius: 3px;
                    }}
                    .order-info {{
                        background: #f5f5f5;
                        padding: 15px;
                        margin: 20px 0;
                        border-left: 4px solid #1a73e8;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: #1a73e8;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: bold;
                        margin: 20px 0;
                    }}
                    .footer {{ 
                        padding: 20px 30px; 
                        text-align: center; 
                        background: #f5f5f5;
                        border-top: 1px solid #ddd;
                        color: #666;
                        font-size: 12px;
                    }}
                    .footer p {{
                        margin: 10px 0;
                    }}
                    
                    /* Mobile responsiveness */
                    @media only screen and (max-width: 600px) {{
                        .container {{
                            margin: 10px;
                            max-width: none;
                        }}
                        .header, .content, .footer {{
                            padding: 20px;
                        }}
                        .license-table {{
                            font-size: 12px;
                        }}
                        .license-table th, .license-table td {{
                            padding: 8px;
                        }}
                        .license-key-cell {{
                            font-size: 11px;
                        }}
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Lootamo - Your License Key</h1>
                    </div>
                    <div class="content">
                        <p>Hi {username},</p>
                        <p>Thank you for your purchase! Your license key is now available:</p>
                        
                        <table class="license-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Quantity</th>
                                    <th>License Key</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{product_name}</td>
                                    <td>1</td>
                                    <td><div class="license-key-cell">{license_key}</div></td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="order-info">
                            <strong>Order ID:</strong> {order_id}
                        </div>
                        
                        <p>Please save this license key in a safe place. You can also retrieve it anytime from your account dashboard.</p>
                        
                        <p>If you have any questions or need support, please don't hesitate to contact us.</p>
                        
                        <a href="https://lootamo.com" class="cta-button">Visit Lootamo.com</a>
                    </div>
                    <div class="footer">
                        <p>Thank you for your purchase! Visit <a href="https://lootamo.com" style="color: #1a73e8;">lootamo.com</a> for more great deals.</p>
                        <p><small>This is an automated message. Please do not reply to this email.</small></p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
Hi {username},

Thank you for your purchase! Your license key for {product_name} is now available.

Your License Key: {license_key}
Order ID: {order_id}

Please save this license key in a safe place. You can also retrieve it anytime from your account dashboard.

If you have any questions or need support, please don't hesitate to contact us.

Enjoy your purchase!

Best regards,
The Lootamo Team
            """.strip()
            
            from app.services.simple_email_queue import simple_email_queue_service
            
            try:
                email_id = simple_email_queue_service.queue_email(
                    to_email=to_email,
                    subject=f"Your License Key for {product_name} - Order #{order_id}",
                    html_content=html_content,
                    text_content=text_content,
                    email_type="license_key",
                    order_id=order_id,
                    priority=1  # High priority for license keys
                )
                print(f"License key email queued (ID: {email_id}) for {to_email}")
                return True
            except Exception as e:
                print(f"❌ Failed to queue license key email for {to_email}: {str(e)}")
                return await self.send_email(
                    to_email=to_email,
                    subject=f"Your License Key for {product_name} - Order #{order_id}",
                    html_content=html_content,
                    text_content=text_content
                )
        except Exception as e:
            print(f"Failed to send license key email: {str(e)}")
            return False

    async def send_multi_license_key_email(
        self,
        to_email: str,
        username: str,
        license_keys: list,
        order_id: str,
        partial_delivery: bool = False
    ) -> bool:
        """Send multi-item license key delivery email"""
        try:
            license_key_html = ""
            license_key_text = ""
            
            for i, key_data in enumerate(license_keys, 1):
                product_name = key_data.get('product_name', key_data['product_id'])
                license_key = key_data['license_key']
                quantity = key_data.get('quantity', 1)
                
                quantity_text = f" (x{quantity})" if quantity > 1 else ""
                
                license_key_html += f"""
                <tr>
                    <td>{product_name}</td>
                    <td>{quantity}</td>
                    <td><div class="license-key-cell">{license_key}</div></td>
                </tr>
                """
                
                license_key_text += f"{i}. {product_name}{quantity_text}\nLicense Key: {license_key}\n\n"
            
            partial_notice_html = ""
            partial_notice_text = ""
            if partial_delivery:
                partial_notice_html = """
                <div class="partial-notice">
                    <p style="margin: 0;"><strong>📦 Partial Delivery Notice:</strong> Some license keys are still being processed and will be sent in a separate email once ready.</p>
                </div>
                """
                partial_notice_text = "\n📦 Partial Delivery Notice: Some license keys are still being processed and will be sent in a separate email once ready.\n"
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lootamo - Your License Keys</title>
                <style>
                    body {{ 
                        font-family: Helvetica, Arial, sans-serif;
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0; 
                        padding: 20px;
                        background-color: #f5f5f5;
                    }}
                    .container {{ 
                        max-width: 650px; 
                        margin: 0 auto; 
                        background: white;
                        border: 1px solid #ddd;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }}
                    .header {{ 
                        background: white;
                        padding: 30px 30px 20px 30px;
                        border-bottom: 2px solid #1a73e8;
                    }}
                    .header h1 {{
                        margin: 0;
                        font-size: 20px;
                        font-weight: bold;
                        color: #333;
                        font-family: Helvetica, Arial, sans-serif;
                    }}
                    .content {{ 
                        padding: 30px;
                    }}
                    .content p {{
                        font-size: 14px;
                        margin: 15px 0;
                    }}
                    .license-table {{
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        border: 1px solid #ddd;
                    }}
                    .license-table th {{
                        background: #f5f5f5;
                        padding: 12px;
                        text-align: left;
                        font-weight: bold;
                        font-size: 14px;
                        border-bottom: 1px solid #ddd;
                    }}
                    .license-table td {{
                        padding: 12px;
                        border-bottom: 1px solid #ddd;
                        font-size: 14px;
                    }}
                    .license-table tr:nth-child(even) {{
                        background: #f9f9f9;
                    }}
                    .license-key-cell {{
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 13px;
                        word-break: break-all;
                        background: #f8f8f8;
                        padding: 8px;
                        border-radius: 3px;
                    }}
                    .order-info {{
                        background: #f5f5f5;
                        padding: 15px;
                        margin: 20px 0;
                        border-left: 4px solid #1a73e8;
                    }}
                    .cta-button {{
                        display: inline-block;
                        background: #1a73e8;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 4px;
                        font-weight: bold;
                        margin: 20px 0;
                    }}
                    .footer {{ 
                        padding: 20px 30px; 
                        text-align: center; 
                        background: #f5f5f5;
                        border-top: 1px solid #ddd;
                        color: #666;
                        font-size: 12px;
                    }}
                    .footer p {{
                        margin: 10px 0;
                    }}
                    .partial-notice {{
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                        color: #856404;
                    }}
                    
                    /* Mobile responsiveness */
                    @media only screen and (max-width: 600px) {{
                        .container {{
                            margin: 10px;
                            max-width: none;
                        }}
                        .header, .content, .footer {{
                            padding: 20px;
                        }}
                        .license-table {{
                            font-size: 12px;
                        }}
                        .license-table th, .license-table td {{
                            padding: 8px;
                        }}
                        .license-key-cell {{
                            font-size: 11px;
                        }}
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Lootamo - Your License Keys</h1>
                    </div>
                    <div class="content">
                        <p>Hi {username},</p>
                        <p>Thank you for your purchase! Your license keys are now available:</p>
                        
                        {partial_notice_html}
                        
                        <table class="license-table">
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Quantity</th>
                                    <th>License Key</th>
                                </tr>
                            </thead>
                            <tbody>
                                {license_key_html}
                            </tbody>
                        </table>
                        
                        <div class="order-info">
                            <strong>Order ID:</strong> {order_id}
                        </div>
                        
                        <p>Please save these license keys in a safe place. You can also retrieve them anytime from your account dashboard.</p>
                        
                        <p>If you have any questions or need support, please don't hesitate to contact us.</p>
                        
                        <a href="https://lootamo.com" class="cta-button">Visit Lootamo.com</a>
                    </div>
                    <div class="footer">
                        <p>Thank you for your purchase! Visit <a href="https://lootamo.com" style="color: #1a73e8;">lootamo.com</a> for more great deals.</p>
                        <p><small>This is an automated message. Please do not reply to this email.</small></p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = f"""
Hi {username},

Thank you for your purchase! Your license keys are now available.
{partial_notice_text}
Your License Keys:
{license_key_text}
Order ID: {order_id}

Please save these license keys in a safe place. You can also retrieve them anytime from your account dashboard.

If you have any questions or need support, please don't hesitate to contact us.

Enjoy your purchases!

Best regards,
The Lootamo Team
            """.strip()
            
            subject = f"Your License Keys - Order #{order_id}"
            if partial_delivery:
                subject = f"Your License Keys (Partial Delivery) - Order #{order_id}"
            
            from app.services.simple_email_queue import simple_email_queue_service
            
            try:
                email_id = simple_email_queue_service.queue_email(
                    to_email=to_email,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content,
                    email_type="multi_license_key",
                    order_id=order_id,
                    priority=1  
                )
                print(f"Multi-license key email queued (ID: {email_id}) for {to_email}")
                return True
            except Exception as e:
                print(f"Failed to queue multi-license key email for {to_email}: {str(e)}")
                return await self.send_email(
                    to_email=to_email,
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content
                )
        except Exception as e:
            print(f"Failed to send multi-item license key email: {str(e)}")
            return False


email_service = EmailService()
