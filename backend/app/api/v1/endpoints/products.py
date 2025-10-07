from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models.product import Product, Category
from app.schemas.product import ProductResponse, ProductListResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# @router.get("/", response_model=ProductListResponse)
# async def list_products(
#     skip: int = Query(0, ge=0),
#     limit: int = Query(100, ge=1, le=1000),
#     search: Optional[str] = None,
#     category: Optional[str] = None,
#     min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
#     max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
#     db: Session = Depends(get_db)
# ):
#     """List products with pagination, search, category, and price filtering."""
#     from sqlalchemy.orm import joinedload
    
#     query = db.query(Product).options(
#         joinedload(Product.categories),
#         joinedload(Product.images),
#         joinedload(Product.videos),
#         joinedload(Product.restrictions),
#         joinedload(Product.requirements)
#     ).filter(Product.is_active == True) 

#     if search:
#         query = query.filter(Product.name.ilike(f"%{search}%"))
    
#     # Category filter (by category name, case-insensitive)
#     # Use EXISTS via relationship.any() to avoid SELECT DISTINCT on JSON columns
#     if category:
#         query = query.filter(Product.categories.any(Category.name.ilike(f"%{category}%")))
    
#     if min_price is not None:
#         query = query.filter(Product.min_price >= min_price)
    
#     if max_price is not None:
#         query = query.filter(Product.min_price <= max_price)
    
#     # Validate price range
#     if min_price is not None and max_price is not None and min_price > max_price:
#         raise HTTPException(status_code=400, detail="min_price cannot be greater than max_price")
    
#     products = query.offset(skip).limit(limit).all()
    
#     # Apply same filters to total count query
#     total_query = db.query(Product).filter(Product.is_active == True)
#     if search:
#         total_query = total_query.filter(Product.name.ilike(f"%{search}%"))
#     if category:
#         total_query = total_query.filter(Product.categories.any(Category.name.ilike(f"%{category}%")))
#     if min_price is not None:
#         total_query = total_query.filter(Product.min_price >= min_price)
#     if max_price is not None:
#         total_query = total_query.filter(Product.min_price <= max_price)
    
#     total = total_query.count()  
    
#     return ProductListResponse(
#         products=[ProductResponse.from_orm(product) for product in products],
#         total=total,
#         skip=skip,
#         limit=limit
#     )

"""
   ---------------------- for sandbox product listing ----------------------
"""

@router.get("/", response_model=ProductListResponse)
async def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price filter"),
    db: Session = Depends(get_db)
):
    """List products with pagination, search, category, and price filtering."""
    from sqlalchemy.orm import joinedload
    
    # List of specific IDs to filter by
    #  '10000000024005', '10000000024006'
    specific_ids = [
        '10000000195012', '10000000202019',
        '10000000202021', '10000000202022', '10000000415008', '10000000515006',
        '10000000565013', '10000000702004', '10000000737012', '10000000788017',
        '10000001000001', '10000001250017', '10000001261006', '10000001261007',
        '10000001534004', '10000001534006', '10000001685004', '10000001741008',
        '10000001945012', '10000002155012', '10000002172005', '10000002208012',
        '10000002626009', '10000002685013', '10000003041004', '10000003086001',
        '10000003107015', '10000003697009', '10000003911004', '10000003923007',
        '10000004637011', '10000005045008', '10000005222013', '10000005389013',
        '10000005416006', '10000005597006', '10000005633009', '10000005963004',
        '10000006153011', '10000006437010', '10000007206010', '10000007457007',
        '10000008190006', '10000008939005', '10000009105003', '10000011431006',
        '10000011598009', '10000013902007', '10000014989005', '10000016291021',
        '10000016291024', '10000016835011', '10000016850005', '10000017487010',
        '10000018179007', '10000018558012', '10000018870003', '10000019404002',
        '10000019720006', '10000022075006', '10000023727004', '10000026917007',
        '10000027660002', '10000028770004', '10000029090004', '10000032198001',
        '10000033297006', '10000034206002', '10000034823004', '10000035511002',
        '10000037058002', '10000037846002', '10000038133003', '10000041761002',
        '10000042132001', '10000042893004', '10000042917002', '10000043210004',
        '10000045207002', '10000045945002', '10000046131004', '10000047681002',
        '10000048615002', '10000049189002', '10000052632002', '10000067097021',
        '10000067101024', '10000067104001', '10000068865001', '10000075710001',
        '10000076228001', '10000080969001', '10000081206001', '10000082910002',
        '10000083035001', '10000083699001', '10000083986001', '10000084428001',
        '10000145411001', '10000146524002', '10000146972001', '10000148339001'
    ]
    
    query = db.query(Product).options(
        joinedload(Product.categories),
        joinedload(Product.images),
        joinedload(Product.videos),
        joinedload(Product.restrictions),
        joinedload(Product.requirements)
    ).filter(
        Product.is_active == True,
        Product.id.in_(specific_ids)  # Add filter for specific IDs
    )

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    
    # Category filter (by category name, case-insensitive)
    if category:
        query = query.filter(Product.categories.any(Category.name.ilike(f"%{category}%")))
    
    if min_price is not None:
        query = query.filter(Product.min_price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.min_price <= max_price)
    
    # Validate price range
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=400, detail="min_price cannot be greater than max_price")
    
    products = query.offset(skip).limit(limit).all()
    
    # Apply same filters to total count query
    total_query = db.query(Product).filter(
        Product.is_active == True,
        Product.id.in_(specific_ids)  # Same ID filter for count
    )
    if search:
        total_query = total_query.filter(Product.name.ilike(f"%{search}%"))
    if category:
        total_query = total_query.filter(Product.categories.any(Category.name.ilike(f"%{category}%")))
    if min_price is not None:
        total_query = total_query.filter(Product.min_price >= min_price)
    if max_price is not None:
        total_query = total_query.filter(Product.min_price <= max_price)
    
    total = total_query.count()  
    
    return ProductListResponse(
        products=[ProductResponse.from_orm(product) for product in products],
        total=total,
        skip=skip,
        limit=limit
    )


# ------------------------------------------------------------------


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific product by ID."""
    from sqlalchemy.orm import joinedload
    
    product = db.query(Product).options(
        joinedload(Product.categories),
        joinedload(Product.images),
        joinedload(Product.videos),
        joinedload(Product.restrictions),
        joinedload(Product.requirements)
    ).filter(Product.id == product_id).first()  
        
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product is inactive and return appropriate message
    # if not product.is_active:
    #     logger.warning(f"Attempt to access inactive product: {product_id}")
    #     raise HTTPException(
    #         status_code=410, 
    #         detail="This product is no longer available and has been discontinued"
    #     )-
    
    return ProductResponse.from_orm(product)


