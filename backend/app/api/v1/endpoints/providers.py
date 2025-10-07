# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlalchemy.ext.asyncio import AsyncSession
# from typing import Optional, Tuple
# import httpx
# from datetime import datetime, timedelta
# import asyncio
# import logging

# from app.core.config import settings
# from app.core.database import get_async_db
# from app.api.dependencies import get_current_active_user
# from app.models.user import User, UserRole

# router = APIRouter()
# logger = logging.getLogger(__name__)


# def require_admin_or_manager_role(current_user: User = Depends(get_current_active_user)):
#     """Dependency for admin or manager access (RBAC)"""
#     if (getattr(current_user, "role", None) not in [UserRole.ADMIN, UserRole.MANAGER]) and not getattr(current_user, "is_superuser", False):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Admin or Manager access required"
#         )
#     return current_user


# @router.get(
#     "/providers",
#     summary="List Providers",
#     description="Return the list of supported providers based on ENV configuration (e.g., 'g2a')."
# )
# async def list_providers():
#     """List supported providers (ENV-based)."""
#     providers = []
#     if settings.G2A_CLIENT_ID and settings.G2A_CLIENT_SECRET:
#         providers.append("g2a")
#     return {"providers": providers}


# @router.post(
#     "/g2a/token",
#     summary="Generate G2A Token",
#     description="Admin-only. Generates a fresh OAuth token from G2A using ENV credentials."
# )
# async def generate_g2a_token(current_user: User = Depends(require_admin_or_manager_role)):
#     """Generate G2A OAuth token using ENV credentials (admin-only)"""
#     if not (settings.G2A_CLIENT_ID and settings.G2A_CLIENT_SECRET):
#         raise HTTPException(status_code=400, detail="G2A credentials not configured in environment")

#     token_url = f"{settings.G2A_BASE_URL}/oauth/token"
#     payload = {
#         "client_id": settings.G2A_CLIENT_ID,
#         "client_secret": settings.G2A_CLIENT_SECRET,
#         "grant_type": "client_credentials",
#     }

#     try:
#         async with httpx.AsyncClient(timeout=15.0) as client:
#             resp = await client.post(token_url, json=payload)
#             resp.raise_for_status()
#             data = resp.json()
#             return {
#                 "access_token": data.get("access_token"),
#                 "token_type": data.get("token_type", "bearer"),
#                 "expires_in": data.get("expires_in"),
#                 "issued_at": datetime.utcnow().isoformat() + "Z"
#             }
#     except httpx.HTTPStatusError as e:
#         raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
#     except Exception as e:
#         raise HTTPException(status_code=502, detail=f"Failed to get G2A token: {str(e)}")


# _g2a_token: Optional[str] = None
# _g2a_token_expires_at: Optional[datetime] = None
# _g2a_token_lock = asyncio.Lock()


# async def _get_g2a_token() -> str:
#     """Get a cached G2A token or fetch a new one using ENV creds.
#     Adds a 60s safety buffer before expiry.
#     """
#     global _g2a_token, _g2a_token_expires_at

#     if not (settings.G2A_CLIENT_ID and settings.G2A_CLIENT_SECRET):
#         raise HTTPException(status_code=400, detail="G2A credentials not configured in environment")

#     async with _g2a_token_lock:
#         if _g2a_token and _g2a_token_expires_at and datetime.utcnow() < _g2a_token_expires_at:
#             return _g2a_token

#         base = _normalized_g2a_base()
#         token_url = f"{base}/oauth/token"
#         payload = {
#             "client_id": settings.G2A_CLIENT_ID,
#             "client_secret": settings.G2A_CLIENT_SECRET,
#             "grant_type": "client_credentials",
#         }
#         async with httpx.AsyncClient(timeout=15.0) as client:
#             resp = await client.post(token_url, json=payload)
#             resp.raise_for_status()
#             data = resp.json()
#             token = data.get("access_token")
#             ttl = data.get("expires_in", 300)
#             if not token:
#                 raise HTTPException(status_code=502, detail="G2A did not return access_token")
#             _g2a_token = token
#             _g2a_token_expires_at = datetime.utcnow() + timedelta(seconds=max(ttl - 60,60))
#             logger.info("G2A token obtained (ttl=%s)s", ttl)
#             return _g2a_token


# @router.get(
#     "/g2a/products",
#     summary="Proxy G2A Products",
#     description=(
#         "Public endpoint. Automatically handles G2A token, caches it, and refreshes on 401.\n"
#         "- If `id` is provided, returns a single product.\n"
#         "- Otherwise, returns a paginated list using `page` and `perPage`."
#     )
# )
# async def proxy_g2a_products(
#     id: Optional[str] = Query(None, description="G2A product ID to fetch a single product"),
#     page: int = Query(1, ge=1, description="Page number for listing"),
#     perPage: int = Query(25, ge=1, le=100, description="Items per page for listing"),
# ):
#     """Get product(s) from G2A via the backend proxy."""
#     try:
#         access_token = await _get_g2a_token()
#         base = _normalized_g2a_base()
#         products_url = f"{base}/v1/products"
#         headers = {"Authorization": f"Bearer {access_token}"}
#         params = {"page": page, "perPage": perPage}
#         if id:
#             params = {"id": id}

#         async with httpx.AsyncClient(timeout=15.0) as client:
#             logger.info("G2A products request: url=%s params=%s auth_header=%s...", products_url, params, headers.get("Authorization", "")[:16])
#             resp = await client.get(products_url, headers=headers, params=params)
#             if resp.status_code == 401:
#                 # Refresh token once and 
#                 await _force_refresh_g2a_token()
#                 headers["Authorization"] = f"Bearer {await _get_g2a_token()}"
#                 logger.warning("G2A 401 received. Refreshed token and retrying")
#                 resp = await client.get(products_url, headers=headers, params=params)
#             resp.raise_for_status()
#             return resp.json()
#     except httpx.HTTPStatusError as e:
#         try:
#             detail = e.response.json()
#         except Exception:
#             detail = e.response.text
#         raise HTTPException(status_code=e.response.status_code, detail=detail)
#     except Exception as e:
#         raise HTTPException(status_code=502, detail=f"Failed to fetch products from G2A: {str(e)}")


# async def _force_refresh_g2a_token() -> None:
#     """Invalidate cached token so next _get_g2a_token fetches a new one."""
#     global _g2a_token, _g2a_token_expires_at
#     _g2a_token = None
#     _g2a_token_expires_at = None

# def _normalized_g2a_base() -> str:
#     """Ensure base URL has no trailing slash and no trailing '/v1'."""
#     base = (settings.G2A_BASE_URL or "https://api.g2a.com").strip()
#     if base.endswith('/'):
#         base = base[:-1]
#     if base.endswith('/v1'):
#         base = base[:-3] 
#     return base


# # ------------------ Explicit, Swagger-visible endpoints ------------------

# async def _fetch_g2a(
#     *, product_id: Optional[str] = None, page: int = 1, per_page: int = 25
# ):
#     access_token = await _get_g2a_token()
#     base = _normalized_g2a_base()
#     products_url = f"{base}/v1/products"
#     headers = {"Authorization": f"Bearer {access_token}"}
#     params = {"page": page, "perPage": per_page} if not product_id else {"id": product_id}

#     async with httpx.AsyncClient(timeout=15.0) as client:
#         logger.info(
#             "G2A products request: url=%s params=%s auth_header=%s...",
#             products_url,
#             params,
#             headers.get("Authorization", "")[:16],
#         )
#         resp = await client.get(products_url, headers=headers, params=params)
#         if resp.status_code == 401:
#             await _force_refresh_g2a_token()
#             headers["Authorization"] = f"Bearer {await _get_g2a_token()}"
#             logger.warning("G2A 401 received on explicit endpoint. Retrying once with refreshed token")
#             resp = await client.get(products_url, headers=headers, params=params)
#         resp.raise_for_status()
#         return resp.json()


# @router.get(
#     "/g2a/products/list",
#     summary="List G2A Products",
#     description="Public. Returns a paginated list of G2A products using page and perPage.",
# )
# async def list_g2a_products(
#     page: int = Query(1, ge=1, description="Page number for listing"),
#     perPage: int = Query(25, ge=1, le=100, description="Items per page for listing"),
# ):
#     try:
#         return await _fetch_g2a(page=page, per_page=perPage)
#     except httpx.HTTPStatusError as e:
#         try:
#             detail = e.response.json()
#         except Exception:
#             detail = e.response.text
#         raise HTTPException(status_code=e.response.status_code, detail=detail)
#     except Exception as e:
#         raise HTTPException(status_code=502, detail=f"Failed to list G2A products: {str(e)}")


# @router.get(
#     "/g2a/products/{product_id}",
#     summary="Get G2A Product By ID",
#     description="Public. Returns a single G2A product by its ID.",
# )
# async def get_g2a_product(product_id: str):
#     try:
#         return await _fetch_g2a(product_id=product_id)
#     except httpx.HTTPStatusError as e:
#         try:
#             detail = e.response.json()
#         except Exception:
#             detail = e.response.text
#         raise HTTPException(status_code=e.response.status_code, detail=detail)
#     except Exception as e:
#         raise HTTPException(status_code=502, detail=f"Failed to fetch G2A product: {str(e)}")


# @router.get(
#     "/g2a/bestsellers",
#     summary="Full Bestseller Products",
#     description="Return bestsellers with full product details and pagination support."
# )
# async def g2a_bestsellers(
#     page: int = Query(1, ge=1, description="Page number for pagination"),
#     per_page: int = Query(25, ge=1, le=100, description="Items per page")
# ):
#     try:
#         access_token = await _get_g2a_token()
#         base = _normalized_g2a_base()
#         url = f"{base}/v3/sales/bestsellers"
#         headers = {"Authorization": f"Bearer {access_token}"}

#         async with httpx.AsyncClient(timeout=15.0) as client:
#             resp = await client.get(url, headers=headers)
#             resp.raise_for_status()
#             bestseller_list = resp.json()["data"]

#         total_items = len(bestseller_list)
#         start_index = (page - 1) * per_page
#         end_index = start_index + per_page
#         paginated_bestsellers = bestseller_list[start_index:end_index]
#         full_products = []
#         for item in paginated_bestsellers:
#             product_id = item["productId"]
#             full_detail = await get_g2a_product(product_id)
            
#             if isinstance(full_detail, dict):
#                 full_detail["qty"] = item.get("soldItemsQuantity", 0)
#                 full_products.append(full_detail)

      
#         total_pages = (total_items + per_page - 1) // per_page  
#         return {
#             "total": total_items,
#             "page": page,
#             "per_page": per_page,
#             "total_pages": total_pages,
#             "has_next": page < total_pages,
#             "has_prev": page > 1,
#             "docs": full_products
#         }

#     except httpx.HTTPStatusError as e:
#         try:
#             detail = e.response.json()
#         except Exception:
#             detail = e.response.text
#         raise HTTPException(status_code=e.response.status_code, detail=detail)
#     except Exception as e:
#         raise HTTPException(status_code=502, detail=f"Failed to fetch G2A bestsellers: {str(e)}")
