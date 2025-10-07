# #!/usr/bin/env python3
# """
# Entry point for running the email worker as a standalone process
# Usage: python -m app.workers.email_worker
# """
# import sys
# from pathlib import Path

# backend_dir = Path(__file__).parent
# sys.path.insert(0, str(backend_dir))

# from app.workers.email_worker import start_email_worker
# import asyncio

# if __name__ == "__main__":
#     try:
#         asyncio.run(start_email_worker())
#     except KeyboardInterrupt:
#         print("Email worker interrupted by user")
#     except Exception as e:
#         print(f"Email worker failed: {str(e)}")
#         sys.exit(1)
