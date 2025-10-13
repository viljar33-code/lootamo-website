import logging
import asyncio
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.product import Product, Category, Image, Video, Restriction, Requirement, ProductSyncLog
from app.services.g2a_service import fetch_all_products, fetch_products
from app.core.database import SessionLocal, get_db
from app.services.error_log_service import ErrorLogService

def batches(iterable, batch_size):
    """Yield successive batches from iterable."""
    for i in range(0, len(iterable), batch_size):
        yield iterable[i:i + batch_size]

def create_sync_log(db: Session, total_synced: int = 0, new_products: int = 0, 
                   updated_products: int = 0, inactive_products: int = 0, 
                   status: str = "success", error_message: str = None) -> ProductSyncLog:
    """Create a sync log entry in the database."""
    try:
        sync_log = ProductSyncLog(
            total_synced=total_synced,
            new_products=new_products,
            updated_products=updated_products,
            inactive_products=inactive_products,
            status=status,
            error_message=error_message
        )
        db.add(sync_log)
        db.commit()
        db.refresh(sync_log)
        logging.info(f"Sync log created: ID={sync_log.id}, Status={status}, Total={total_synced}")
        return sync_log
    except Exception as e:
        db.rollback()
        logging.error(f"Failed to create sync log: {str(e)}")
        # Log sync log creation failure
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="PRODUCT_SYNC_LOG_FAILURE",
                source_system="product_sync",
                source_function="create_sync_log",
                error_context={
                    "total_synced": total_synced,
                    "status": status
                },
                severity="error"
            )
        except Exception:
            pass  # Don't let logging errors break the application
        raise

def save_products(db: Session, products: list):
    """
    Save or update products fetched from third-party API into the database.
    Handles products, categories, images, videos, restrictions, and requirements.
    """
    for p in products:
        product = db.query(Product).filter(Product.id == p["id"]).first()
        if not product:
            product = Product(id=p["id"])

        product.name = p["name"]
        product.slug = p["slug"]
        product.type = p.get("type") or None
        product.qty = p.get("qty")
        product.min_price = p.get("minPrice")
        product.retail_min_price = p.get("retail_min_price")
        product.retail_min_base_price = p.get("retailMinBasePrice")
        product.available_to_buy = p.get("availableToBuy")
        product.thumbnail = p.get("thumbnail") or None
        product.small_image = p.get("smallImage") or None
        product.cover_image = p.get("coverImage") or None

        
        release_date = p.get("release_date")
        product.release_date = None if release_date == "" else release_date
        
        product.region = p.get("region") or None
        product.developer = p.get("developer") or None
        product.publisher = p.get("publisher") or None
        product.platform = p.get("platform") or None
        product.price_limit = p.get("priceLimit")
        product.is_active = True  # Mark as active during sync
        # last_synced will be updated automatically via onupdate=func.now()

        db.add(product)
        db.flush()

        product.categories.clear()
        for c in p.get("categories", []):
            category = db.query(Category).filter(Category.id == str(c["id"])).first()
            if not category:
                category = Category(id=str(c["id"]), name=c["name"])
            product.categories.append(category)

        product.images.clear()
        for img_url in p.get("images", []):
            image = db.query(Image).filter(Image.url == img_url).first()
            if not image:
                image = Image(url=img_url)
            product.images.append(image)

        product.videos.clear()
        for v in p.get("videos", []):
            url = v.get("url")
            video_type = v.get("type", "")
            if url:
                video = db.query(Video).filter(Video.url == url).first()
                if not video:
                    video = Video(url=url, video_type=video_type)
                product.videos.append(video)

        res = p.get("restrictions", {})
        restriction = db.query(Restriction).filter(Restriction.product_id == product.id).first()
        if not restriction:
            restriction = Restriction(product_id=product.id)
        restriction.pegi_violence = res.get("pegi_violence", False)
        restriction.pegi_profanity = res.get("pegi_profanity", False)
        restriction.pegi_discrimination = res.get("pegi_discrimination", False)
        restriction.pegi_drugs = res.get("pegi_drugs", False)
        restriction.pegi_fear = res.get("pegi_fear", False)
        restriction.pegi_gambling = res.get("pegi_gambling", False)
        restriction.pegi_online = res.get("pegi_online", False)
        restriction.pegi_sex = res.get("pegi_sex", False)
        db.add(restriction)

        reqs = p.get("requirements", {})
        requirement = db.query(Requirement).filter(Requirement.product_id == product.id).first()
        if not requirement:
            requirement = Requirement(product_id=product.id)
        requirement.minimal = reqs.get("minimal", {})
        requirement.recommended = reqs.get("recommended", {})
        db.add(requirement)

    db.commit()


def mark_all_products_inactive(db: Session):
    """
    Mark all products as inactive before starting sync.
    Products will be marked active again during sync if they still exist in G2A.
    """
    try:
        updated_count = db.query(Product).update({"is_active": False})
        db.commit()
        logging.info(f"Marked {updated_count} products as inactive before sync")
        return updated_count
    except Exception as e:
        db.rollback()
        logging.error(f"Error marking products inactive: {str(e)}")
        # Log product inactive marking failure
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="PRODUCT_INACTIVE_MARKING_FAILURE",
                source_system="product_sync",
                source_function="mark_all_products_inactive",
                error_context={},
                severity="error"
            )
        except Exception:
            pass  # Don't let logging errors break the application
        raise


def get_inactive_products_count(db: Session) -> int:
    """Get count of products that are currently inactive (discontinued)."""
    return db.query(Product).filter(Product.is_active == False).count()


def cleanup_old_inactive_products(db: Session, days_threshold: int = 30) -> int:
    """
    Remove products that have been inactive for more than the specified days.
    This is optional - you can also keep them for historical purposes.
    
    Args:
        days_threshold: Number of days a product should remain inactive before deletion
    
    Returns:
        Number of products deleted
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days_threshold)
        
        # Find products that are inactive and haven't been synced recently
        products_to_delete = db.query(Product).filter(
            Product.is_active == False,
            Product.last_synced < cutoff_date
        )
        
        delete_count = products_to_delete.count()
        products_to_delete.delete()
        db.commit()
        
        logging.info(f"Cleaned up {delete_count} old inactive products (older than {days_threshold} days)")
        return delete_count
        
    except Exception as e:
        db.rollback()
        logging.error(f"Error cleaning up old inactive products: {str(e)}")
        # Log cleanup failure
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="PRODUCT_CLEANUP_FAILURE",
                source_system="product_sync",
                source_function="cleanup_old_inactive_products",
                error_context={"days_threshold": days_threshold},
                severity="error"
            )
        except Exception:
            pass  # Don't let logging errors break the application
        raise


def save_products_batch(db: Session, products: List[dict]) -> tuple[int, int, int]:
    """
    Save a batch of products with optimized performance.
    Returns (success_count, error_count, new_products_count).
    """
    success_count = 0
    error_count = 0
    new_products_count = 0
    
    try:
        for p in products:
            try:
                product = db.query(Product).filter(Product.id == p["id"]).first()
                is_new_product = product is None
                if not product:
                    product = Product(id=p["id"])
                    new_products_count += 1

                # Update product fields
                product.name = p["name"]
                product.slug = p["slug"]
                product.type = p.get("type") or None
                product.qty = p.get("qty")
                product.min_price = p.get("minPrice")
                product.retail_min_price = p.get("retail_min_price")
                product.retail_min_base_price = p.get("retailMinBasePrice")
                product.available_to_buy = p.get("availableToBuy")
                product.thumbnail = p.get("thumbnail") or None
                product.small_image = p.get("smallImage") or None
                product.cover_image = p.get("coverImage") or None
                
                # Handle empty string dates - convert to None for PostgreSQL
                release_date = p.get("release_date")
                product.release_date = None if release_date == "" else release_date
                
                product.region = p.get("region") or None
                product.developer = p.get("developer") or None
                product.publisher = p.get("publisher") or None
                product.platform = p.get("platform") or None
                product.price_limit = p.get("priceLimit")
                product.is_active = True  # Mark as active during sync
                # last_synced will be updated automatically via onupdate=func.now()

                db.add(product)
                db.flush()

                product.categories.clear()
                for c in p.get("categories", []):
                    category = db.query(Category).filter(Category.id == str(c["id"])).first()
                    if not category:
                        category = Category(id=str(c["id"]), name=c["name"])
                    product.categories.append(category)

                product.images.clear()
                for img_url in p.get("images", []):
                    image = db.query(Image).filter(Image.url == img_url).first()
                    if not image:
                        image = Image(url=img_url)
                    product.images.append(image)

                product.videos.clear()
                for v in p.get("videos", []):
                    url = v.get("url")
                    video_type = v.get("type", "")
                    if url:
                        video = db.query(Video).filter(Video.url == url).first()
                        if not video:
                            video = Video(url=url, video_type=video_type)
                        product.videos.append(video)

                res = p.get("restrictions", {})
                restriction = db.query(Restriction).filter(Restriction.product_id == product.id).first()
                if not restriction:
                    restriction = Restriction(product_id=product.id)
                restriction.pegi_violence = res.get("pegi_violence", False)
                restriction.pegi_profanity = res.get("pegi_profanity", False)
                restriction.pegi_discrimination = res.get("pegi_discrimination", False)
                restriction.pegi_drugs = res.get("pegi_drugs", False)
                restriction.pegi_fear = res.get("pegi_fear", False)
                restriction.pegi_gambling = res.get("pegi_gambling", False)
                restriction.pegi_online = res.get("pegi_online", False)
                restriction.pegi_sex = res.get("pegi_sex", False)
                db.add(restriction)

                # Handle requirements
                reqs = p.get("requirements", {})
                requirement = db.query(Requirement).filter(Requirement.product_id == product.id).first()
                if not requirement:
                    requirement = Requirement(product_id=product.id)
                requirement.minimal = reqs.get("minimal", {})
                requirement.recommended = reqs.get("recommended", {})
                db.add(requirement)
                
                success_count += 1
                
            except Exception as e:
                logging.error(f"Error processing product {p.get('id', 'unknown')}: {str(e)}")
                error_count += 1
                continue
        
        # Commit the batch
        db.commit()
        logging.info(f"Batch committed: {success_count} products saved, {error_count} errors")
        
    except SQLAlchemyError as e:
        db.rollback()
        logging.error(f"Database error in batch commit: {str(e)}")
        # Log batch commit failure
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="PRODUCT_BATCH_COMMIT_FAILURE",
                source_system="product_sync",
                source_function="save_products_batch",
                error_context={
                    "batch_size": len(products),
                    "success_count": success_count,
                    "error_count": error_count
                },
                severity="critical"
            )
        except Exception:
            pass  # Don't let logging errors break the application
        raise
        
    return success_count, error_count, new_products_count


async def sync_all_products(batch_size: int = 500, start_page: Optional[int] = None) -> dict:
    """
    Sync all products from G2A API to database with batch processing.
    
    Args:
        batch_size: Number of products to process per batch (default: 500)
        start_page: Optional starting page for partial sync
    
    Returns:
        Dict with sync results including total products synced and any errors
    """
    logger = logging.getLogger(__name__)
    logger.info("Starting full product sync from G2A API")
    
    try:
        logger.info("Fetching all products from G2A API...")
        all_products = await fetch_all_products()
        total_products = len(all_products)
        
        if total_products == 0:
            logger.warning("No products found in G2A API")
            return {
                "success": True,
                "total_products": 0,
                "batches_processed": 0,
                "errors": []
            }
        
        logger.info(f"Found {total_products} products. Starting batch processing with batch size {batch_size}")
        
        errors = []
        batches_processed = 0
        
        for i, batch in enumerate(batches(all_products, batch_size)):
            batch_number = i + 1
            batch_size_actual = len(batch)
            
            try:
                logger.info(f"Processing batch {batch_number} with {batch_size_actual} products...")
                
                db = next(get_db())
                try:
                    save_products_batch(db, batch)
                    batches_processed += 1
                    logger.info(f"Successfully processed batch {batch_number}")
                finally:
                    db.close()
                    
            except Exception as e:
                error_msg = f"Error processing batch {batch_number}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
        
        logger.info(f"Full sync completed. Processed {batches_processed} batches with {total_products} total products")
        
        return {
            "success": True,
            "total_products": total_products,
            "batches_processed": batches_processed,
            "errors": errors
        }
        
    except Exception as e:
        error_msg = f"Failed to sync all products: {str(e)}"
        logger.error(error_msg)
        # Log sync failure
        db = SessionLocal()
        try:
            ErrorLogService.log_exception(
                db=db,
                exception=e,
                error_type="PRODUCT_SYNC_FAILURE",
                source_system="product_sync",
                source_function="sync_all_products",
                error_context={"batch_size": batch_size},
                severity="critical"
            )
        except Exception:
            pass  # Don't let logging errors break the application
        finally:
            db.close()
        return {
            "success": False,
            "total_products": 0,
            "batches_processed": 0,
            "errors": [error_msg]
        }


async def sync_all_products_paginated(batch_size: int = 500) -> dict:
    """
    Sync all products from G2A API using pagination approach with discontinued product handling.
    Fetches products page by page until no more products are returned.
    
    Args:
        batch_size: Number of products to process in each batch within a page
    
    Returns:
        Dict with sync results including total products synced, pages processed, and any errors
    """
    logger = logging.getLogger(__name__)
    logger.info("Starting paginated full product sync from G2A API")
    
    db = next(get_db())
    try:
        logger.info("Marking all existing products as inactive before sync...")
        inactive_count = mark_all_products_inactive(db)
        logger.info(f"Marked {inactive_count} products as inactive")
    except Exception as e:
        logger.error(f"Failed to mark products inactive: {str(e)}")
        db.close()
        return {
            "success": False,
            "error": f"Failed to prepare sync: {str(e)}",
            "total_products": 0,
            "pages_processed": 0,
            "batches_processed": 0,
            "errors": [str(e)]
        }
    finally:
        db.close()
    
    try:
        total_products_synced = 0
        pages_processed = 0
        errors = []
        consecutive_page_errors = 0
        page = 1
        
        while True:
            try:
                logger.info(f"Fetching products from page {page}...")
                
                products = await fetch_products(page=page)
                
                if not products or len(products) == 0:
                    logger.info(f"No products found on page {page}. Sync completed.")
                    break
                
                page_product_count = len(products)
                logger.info(f"Found {page_product_count} products on page {page}")
                
                page_batches_processed = 0
                
                db = SessionLocal()
                try:
                    for i, batch in enumerate(batches(products, batch_size)):
                        batch_number = i + 1
                        batch_size_actual = len(batch)
                        
                        try:
                            logger.info(f"Processing page {page}, batch {batch_number} with {batch_size_actual} products...")
                            save_products_batch(db, batch)
                            page_batches_processed += 1
                            logger.info(f"Successfully processed page {page}, batch {batch_number}")
                        except Exception as e:
                            db.rollback()  
                            import traceback
                            error_details = traceback.format_exc()
                            error_msg = f"Error processing page {page}, batch {batch_number}: {type(e).__name__}: {str(e)}"
                            logger.error(error_msg)
                            logger.debug(f"Full traceback for page {page}, batch {batch_number}: {error_details}")
                            errors.append(error_msg)
                            continue  
                finally:
                    db.close()  
                
                total_products_synced += page_product_count
                pages_processed += 1
                consecutive_page_errors = 0  
                logger.info(f"Completed page {page}: {page_product_count} products, {page_batches_processed} batches processed")
                
                page += 1
                
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                error_msg = f"Error processing page {page}: {type(e).__name__}: {str(e)}"
                logger.error(error_msg)
                logger.error(f"Full traceback for page {page}: {error_details}")
                errors.append(error_msg)
                consecutive_page_errors += 1
                
                page += 1
                
                if consecutive_page_errors >= 3:
                    logger.error(f"Too many consecutive page errors ({consecutive_page_errors}), stopping sync")
                    break
        
        logger.info(f"Paginated sync completed. Processed {pages_processed} pages with {total_products_synced} total products")
        
        db = next(get_db())
        try:
            inactive_products_count = get_inactive_products_count(db)
            logger.info(f"Sync completed. {inactive_products_count} products are now marked as discontinued (inactive)")
            
            status = "success" if not errors else ("partial" if total_products_synced > 0 else "failed")
            error_message = "; ".join(errors[:3]) if errors else None 
            
            sync_log = create_sync_log(
                db=db,
                total_synced=total_products_synced,
                new_products=0,  
                updated_products=total_products_synced, 
                inactive_products=inactive_products_count,
                status=status,
                error_message=error_message
            )
            
            logger.info(f"Sync log created with ID: {sync_log.id}")
            
        except Exception as e:
            logger.error(f"Error checking inactive products after sync: {str(e)}")
        finally:
            db.close()
        
        return {
            "success": True,
            "total_products": total_products_synced,
            "pages_processed": pages_processed,
            "inactive_products": inactive_products_count if 'inactive_products_count' in locals() else 0,
            "errors": errors
        }
        
    except Exception as e:
        error_msg = f"Failed to sync products with pagination: {str(e)}"
        logger.error(error_msg)
        # Log paginated sync failure
        db_error = SessionLocal()
        try:
            ErrorLogService.log_exception(
                db=db_error,
                exception=e,
                error_type="PRODUCT_PAGINATED_SYNC_FAILURE",
                source_system="product_sync",
                source_function="sync_all_products_paginated",
                error_context={"batch_size": batch_size},
                severity="critical"
            )
        except Exception:
            pass  # Don't let logging errors break the application
        finally:
            db_error.close()
        
        db = next(get_db())
        try:
            create_sync_log(
                db=db,
                total_synced=0,
                new_products=0,
                updated_products=0,
                inactive_products=0,
                status="failed",
                error_message=error_msg
            )
        except Exception as log_error:
            logger.error(f"Failed to create sync log for failed sync: {str(log_error)}")
        finally:
            db.close()
        
        return {
            "success": False,
            "total_products": 0,
            "pages_processed": 0,
            "errors": [error_msg]
        }


async def sync_products_by_page(page: int, batch_size: int = 500) -> dict:
    """
    Sync products from a specific page for incremental updates.
    
    Args:
        page: Page number to sync
        batch_size: Number of products to process in each batch within a page
    
        
    Returns:
        Dictionary with sync statistics
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Starting page {page} sync with batch_size={batch_size}")
    
    stats = {
        "page": page,
        "products_fetched": 0,
        "products_saved": 0,
        "errors": 0
    }
    
    db = SessionLocal()
    
    try:
        from app.services.g2a_service import fetch_products
        
        products = await fetch_products(page)
        stats["products_fetched"] = len(products)
        logger.info(f"Fetched {len(products)} products from page {page}")
        
        if products:
            success_count, error_count = save_products_batch(db, products)
            stats["products_saved"] = success_count
            stats["errors"] = error_count
            
            logger.info(f"Page {page} sync completed: {success_count} saved, {error_count} errors")
        
    except Exception as e:
        logger.error(f"Error syncing page {page}: {str(e)}")
        raise
        
    finally:
        db.close()
    
    return stats
