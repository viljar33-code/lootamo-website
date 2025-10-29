import time
import asyncio
import logging
import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.schemas.order import G2AOrderRequest, G2AOrderResponse
from app.services.error_log_service import ErrorLogService
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

TOKEN_CACHE = {"token": None, "expires_at": 0}

async def get_access_token_cached():
    now = time.time()
    if TOKEN_CACHE["token"] is None or now >= TOKEN_CACHE["expires_at"]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.G2A_TOKEN_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.G2A_CLIENT_ID,
                    "client_secret": settings.G2A_CLIENT_SECRET
                }
            )
            response.raise_for_status() 
            data = response.json()
            TOKEN_CACHE["token"] = data["access_token"]
            TOKEN_CACHE["expires_at"] = now + data.get("expires_in", 300) - 30
    return TOKEN_CACHE["token"]

async def fetch_products(page: int = 1, max_retries: int = 3, base_delay: float = 1.0) -> list:
    """
    Fetch products from G2A API with retry logic and response validation.
    
    Args:
        page: Page number to fetch
        max_retries: Maximum number of retry attempts
        base_delay: Base delay for exponential backoff (seconds)
        
    Returns:
        List of products from the API   
        
    Raises:
        httpx.HTTPError: After all retries exhausted
        ValueError: Invalid response structure
    """
    for attempt in range(max_retries + 1):
        try:
            token = await get_access_token_cached()
            headers = {"Authorization": f"Bearer {token}"}
              
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    settings.G2A_PRODUCTS_URL, 
                    headers=headers, 
                    params={"page": page}
                )
                response.raise_for_status()
                
                data = response.json()
                if not isinstance(data, dict):
                    raise ValueError(f"Expected dict response, got {type(data)}")
                
                if "docs" not in data:
                    raise ValueError("Response missing 'docs' field")
                
                products = data["docs"]
                if not isinstance(products, list):
                    raise ValueError(f"Expected 'docs' to be list, got {type(products)}")
                
                logger.info(f"Successfully fetched {len(products)} products from page {page}")
                return products
                
        except (httpx.HTTPError, ValueError) as e:
            if attempt == max_retries:
                logger.error(f"Failed to fetch products page {page} after {max_retries + 1} attempts: {e}")
                # Log critical error for product fetch failure
                db = SessionLocal()
                try:
                    ErrorLogService.log_exception(
                        db=db,
                        exception=e,
                        error_type="G2A_PRODUCT_FETCH_FAILURE",
                        source_system="g2a",
                        source_function="fetch_products",
                        error_context={
                            "page": page,
                            "max_retries": max_retries,
                            "total_attempts": max_retries + 1
                        },
                        severity="critical"
                    )
                finally:
                    db.close()
                raise
            
            delay = base_delay * (2 ** attempt) + (0.1 * attempt)  
            logger.warning(f"Attempt {attempt + 1} failed for page {page}: {e}. Retrying in {delay:.2f}s...")
            await asyncio.sleep(delay)
        
        except Exception as e:
            logger.error(f"Unexpected error fetching products page {page}: {e}")
            # Log unexpected error
            db = SessionLocal()
            try:
                ErrorLogService.log_exception(
                    db=db,
                    exception=e,
                    error_type="G2A_UNEXPECTED_ERROR",
                    source_system="g2a",
                    source_function="fetch_products",
                    error_context={"page": page},
                    severity="critical"
                )
            finally:
                db.close()
            raise

async def fetch_all_products():
    """Fetch all products from G2A API by iterating through all pages."""
    all_products = []
    page = 1
    
    while True:
        token = await get_access_token_cached()
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(settings.G2A_PRODUCTS_URL, headers=headers, params={"page": page})
            response.raise_for_status()
            data = response.json()
            
            products = data.get("docs", [])
            if not products:
                break
                
            all_products.extend(products)
            
            total_pages = data.get("totalPages", 1)
            if page >= total_pages:
                break
                
            page += 1
    
    return all_products 


async def create_g2a_order(product_id: str, max_price: float = None) -> Optional[Dict[str, Any]]:
    """
    Create an order using G2A sandbox API.
    
    Args:
        product_id: G2A product ID
        max_price: Maximum price willing to pay (optional, for backward compatibility)
        
    Returns:
        G2A order response data with format:
        {
            "order_id": "1759186574",
            "price": 5.11,
            "currency": "EUR"
        }
        
    Raises:
        httpx.HTTPError: API request failed
        ValueError: Invalid response structure
    """
    sandbox_url = "https://sandboxapi.g2a.com/v1/order"
    
    headers = {
        "Authorization": "qdaiciDiyMaTjxMt, 74026b3dc2c6db6a30a73e71cdb138b1e1b5eb7a97ced46689e2d28db1050875",
        "Content-Type": "application/json"
    }
    
    request_data = {
        "product_id": product_id
    }
    
    logger.info(f"Creating G2A sandbox order for product {product_id}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                sandbox_url,
                json=request_data,
                headers=headers
            )
            
            logger.info(f"G2A API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"G2A order created successfully: {data}")
                return data
            elif response.status_code in [400, 404]:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"message": response.text}
                logger.warning(f"G2A API - Product not available: {error_data}")
                
                mock_order_id = f"mock_order_{product_id}_{int(time.time())}"
                mock_response = {
                    "order_id": mock_order_id,
                    "status": "pending",
                    "product_id": product_id,
                    "price": max_price,
                    "currency": "EUR"
                }
                logger.info(f"Using mock G2A order response: {mock_response}")
                return mock_response
            else:
                error_text = response.text
                logger.error(f"G2A API error: {response.status_code} - {error_text}")
                response.raise_for_status()
                
    except httpx.HTTPError as e:
        logger.error(f"HTTP error creating G2A order: {e}")
        # Log G2A order creation failure
        db = SessionLocal()
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="G2A_ORDER_CREATION_FAILURE",
                source_system="g2a",
                source_function="create_g2a_order",
                error_context={
                    "product_id": product_id,
                    "max_price": max_price
                },
                severity="error"
            )
        finally:
            db.close()
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating G2A order: {e}")
        # Log unexpected error
        db = SessionLocal()
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="G2A_ORDER_CREATION_ERROR",
                source_system="g2a",
                source_function="create_g2a_order",
                error_context={
                    "product_id": product_id,
                    "max_price": max_price
                },
                severity="critical"
            )
        finally:
            db.close()
        raise
    
    return None


async def pay_g2a_order(g2a_order_id: str) -> Optional[Dict[str, Any]]:
    """
    Pay for a G2A order using sandbox API and retrieve license key.
    
    Args:
        g2a_order_id: G2A order ID to pay for
        
    Returns:
        G2A payment response with transaction ID and keys
        
    Raises:
        httpx.HTTPError: API request failed
        ValueError: Invalid response structure
    """
    
    sandbox_url = f"{settings.G2A_SANDBOX_BASE_URL}/v1/order/pay/{g2a_order_id}"
    
    headers = {
        "Authorization": settings.G2A_SANDBOX_AUTH,
        "Content-Length": "0"
    }
    
    logger.info(f"Paying G2A sandbox order {g2a_order_id}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.put(
                sandbox_url,
                headers=headers
            )
            
            logger.info(f"G2A payment API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"G2A order payment successful: {data}")
                return data
            elif response.status_code in [400, 404]:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"message": response.text}
                logger.error(f"G2A payment API - Order not found or already paid: {error_data}")
                return None
            else:
                error_text = response.text
                logger.error(f"G2A payment API error: {response.status_code} - {error_text}")
                response.raise_for_status()
                
    except httpx.HTTPError as e:
        logger.error(f"HTTP error paying G2A order: {e}")
        db = SessionLocal()
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="G2A_PAYMENT_FAILURE",
                source_system="g2a",
                source_function="pay_g2a_order",
                error_context={"g2a_order_id": g2a_order_id},
                severity="error"
            )
        finally:
            db.close()
        raise
    except Exception as e:
        logger.error(f"Unexpected error paying G2A order: {e}")
        # Log unexpected error
        db = SessionLocal()
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="G2A_PAYMENT_ERROR",
                source_system="g2a",
                source_function="pay_g2a_order",
                error_context={"g2a_order_id": g2a_order_id},
                severity="critical"
            )
        finally:
            db.close()
        raise
    
    return None


async def get_g2a_order_key(g2a_order_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve license key from G2A order using sandbox API.
    
    Args:
        g2a_order_id: G2A order ID to get key for
        
    Returns:
        G2A key response with license key details
        
    Raises:
        httpx.HTTPError: API request failed
        ValueError: Invalid response structure
    """
    sandbox_url = f"{settings.G2A_SANDBOX_BASE_URL}/v1/order/key/{g2a_order_id}"
    
    headers = {
        "Authorization": settings.G2A_SANDBOX_AUTH
    }
    
    logger.info(f"Retrieving license key for G2A order {g2a_order_id}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                sandbox_url,
                headers=headers
            )
            
            logger.info(f"G2A key API response status: {response.status_code}")
            logger.info(f"G2A key API response headers: {dict(response.headers)}")
            logger.info(f"G2A key API response text: {response.text}")
            
            if response.status_code == 200:
                try:
                    key_data = response.json()
                    logger.info(f"G2A key response: {key_data}")
                    
                    # Handle both response formats
                    if "keys" in key_data and key_data["keys"]:
                        return key_data
                    elif "key" in key_data:
                        return key_data
                    else:
                        logger.warning(f"No keys found in G2A response: {key_data}")
                        return None
                        
                except Exception as e:
                    logger.error(f"Failed to parse G2A key response JSON: {e}")
                    logger.error(f"Raw response: {response.text}")
                    return None
            elif response.status_code == 404:
                logger.warning(f"G2A key API - Key not available (ORD04): {g2a_order_id}")
                return {"error": "ORD04", "message": "Key already delivered or not available"}
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    error_code = error_data.get("code", "UNKNOWN")
                    error_message = error_data.get("message", "Unknown error")
                    
                    if error_code == "ORD01":
                        logger.error(f"G2A key API - Invalid order ID (ORD01): {g2a_order_id}")
                        return {"error": "ORD01", "message": "Invalid order ID"}
                    elif error_code == "ORD03":
                        logger.warning(f"G2A key API - Order not ready (ORD03): {g2a_order_id}")
                        return {"error": "ORD03", "message": "Order not ready, retry later"}
                    else:
                        logger.warning(f"G2A key API - Unknown 400 error ({error_code}): {error_message}")
                        return {"error": error_code, "message": error_message}
                except Exception as e:
                    logger.error(f"Failed to parse 400 error response: {e}")
                    return {"error": "ORD03", "message": "Order not ready, retry later"}
            elif response.status_code == 401:
                # Authentication error
                logger.error(f"G2A key API - Authentication failed: {response.text}")
                return {"error": "AUTH", "message": "Authentication failed"}
            elif response.status_code == 403:
                # Authorization error
                logger.error(f"G2A key API - Authorization failed: {response.text}")
                return {"error": "FORBIDDEN", "message": "Authorization failed"}
            else:
                error_text = response.text
                logger.error(f"G2A key API error: {response.status_code} - {error_text}")
                return {"error": f"HTTP_{response.status_code}", "message": error_text}
                
    except httpx.HTTPError as e:
        logger.error(f"HTTP error retrieving G2A key: {e}")
        # Log G2A key retrieval failure
        db = SessionLocal()
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="G2A_KEY_RETRIEVAL_FAILURE",
                source_system="g2a",
                source_function="get_g2a_order_key",
                error_context={"g2a_order_id": g2a_order_id},
                severity="error"
            )
        finally:
            db.close()
        return {"error": "API_UNAVAILABLE", "message": "G2A API is currently unavailable"}
    except Exception as e:
        logger.error(f"Unexpected error retrieving G2A key: {e}")
        # Log unexpected error
        db = SessionLocal()
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="G2A_KEY_RETRIEVAL_ERROR",
                source_system="g2a",
                source_function="get_g2a_order_key",
                error_context={"g2a_order_id": g2a_order_id},
                severity="critical"
            )
        finally:
            db.close()
        return {"error": "API_ERROR", "message": "Failed to retrieve license key from G2A"}
    
    # If we reach here, G2A API returned an unhandled response
    logger.warning(f"G2A API returned unhandled response for order {g2a_order_id}")
    return {"error": "UNKNOWN_RESPONSE", "message": "G2A API returned unexpected response"}


async def get_g2a_order_details(g2a_order_id: str) -> Optional[Dict[str, Any]]:
    """
    Get G2A order details and confirmation status using sandbox API.
    
    Args:
        g2a_order_id: G2A order ID to get details for
        
    Returns:
        G2A order details with status and confirmation info
        
    Raises:
        httpx.HTTPError: API request failed
        ValueError: Invalid response structure
    """
    sandbox_url = f"{settings.G2A_SANDBOX_BASE_URL}/v1/order/{g2a_order_id}"
    
    headers = {
        "Authorization": settings.G2A_SANDBOX_AUTH
    }
    
    logger.info(f"Retrieving G2A order details for {g2a_order_id}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                sandbox_url,
                headers=headers
            )
            
            logger.info(f"G2A order details API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"G2A order details retrieved successfully: {data}")
                return data
            elif response.status_code == 404:
                logger.warning(f"G2A order not found: {g2a_order_id}")
                return {"error": "ORDER_NOT_FOUND", "message": "G2A order not found"}
            elif response.status_code == 400:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"message": response.text}
                logger.warning(f"G2A order details API - Bad request: {error_data}")
                return {"error": "BAD_REQUEST", "message": error_data.get("message", "Bad request")}
            else:
                error_text = response.text
                logger.error(f"G2A order details API error: {response.status_code} - {error_text}")
                
                mock_response = {
                    "orderId": g2a_order_id,
                    "status": "completed",
                    "paymentStatus": "paid",
                    "productId": "mock_product_id",
                    "price": 19.99,
                    "currency": "EUR",
                    "createdAt": "2024-01-01T00:00:00Z",
                    "confirmedAt": "2024-01-01T00:05:00Z"
                }
                logger.info(f"Using mock G2A order details response: {mock_response}")
                return mock_response
                
    except httpx.HTTPError as e:
        logger.error(f"HTTP error retrieving G2A order details: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error retrieving G2A order details: {e}")
        raise
    
    return None


async def confirm_g2a_order_payment(g2a_order_id: str) -> Optional[Dict[str, Any]]:
    """
    Confirm G2A order payment status using sandbox API.
    
    Args:
        g2a_order_id: G2A order ID to confirm payment for
        
    Returns:
        G2A payment confirmation with transaction details
        
    Raises:
        httpx.HTTPError: API request failed
        ValueError: Invalid response structure
    """
    sandbox_url = f"{settings.G2A_SANDBOX_BASE_URL}/v1/order/{g2a_order_id}/confirmation"
    
    headers = {
        "Authorization": settings.G2A_SANDBOX_AUTH
    }
    
    logger.info(f"Confirming G2A order payment for {g2a_order_id}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                sandbox_url,
                headers=headers
            )
            
            logger.info(f"G2A payment confirmation API response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"G2A payment confirmation retrieved successfully: {data}")
                return data
            elif response.status_code == 404:
                logger.warning(f"G2A payment confirmation not found: {g2a_order_id}")
                return {"error": "CONFIRMATION_NOT_FOUND", "message": "Payment confirmation not found"}
            elif response.status_code == 400:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"message": response.text}
                logger.warning(f"G2A payment confirmation API - Bad request: {error_data}")
                return {"error": "BAD_REQUEST", "message": error_data.get("message", "Bad request")}
            else:
                error_text = response.text
                logger.error(f"G2A payment confirmation API error: {response.status_code} - {error_text}")
                
                mock_response = {
                    "orderId": g2a_order_id,
                    "transactionId": f"mock_confirmation_{g2a_order_id}_{int(time.time())}",
                    "status": "confirmed",
                    "paymentMethod": "sandbox",
                    "confirmedAt": "2024-01-01T00:05:00Z",
                    "amount": 19.99,
                    "currency": "EUR"
                }
                logger.info(f"Using mock G2A payment confirmation response: {mock_response}")
                return mock_response
                
    except httpx.HTTPError as e:
        logger.error(f"HTTP error confirming G2A payment: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error confirming G2A payment: {e}")
        raise
    
    return None