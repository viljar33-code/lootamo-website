import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Product } from '@/types/product';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const router = useRouter();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, isInCart } = useCart();

  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      router.push(`/products/${product.id}`);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingToCart(true);
    try {
      await addToCart(product.id.toString(), 1, false);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setBuyingNow(true);
      const { checkoutService } = await import('../services/checkoutService');
      const orderResponse = await checkoutService.buyNow({
        product_id: product.id.toString()
      });
      router.push(`/checkout?orderId=${orderResponse.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setBuyingNow(false);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id.toString());
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };


  const getProductImage = () => {
    if (imageError) return '/images/placeholder-game.svg';
    if (product.cover_image) return product.cover_image;
    if (product.small_image) return product.small_image;
    if (product.thumbnail) return product.thumbnail;
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === 'string' && firstImage.trim() !== '') {
        return firstImage;
      }
    }
    return '/images/placeholder-game.svg';
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-[420px] flex flex-col"
      onClick={handleClick}
    >
      {/* Product Image */}
      <div className="relative h-48 w-full bg-gray-100">
        {/* Wishlist Heart Icon */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-200 ${
            isInWishlist(product.id.toString()) 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-white/80 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
        >
          <svg 
            className="w-5 h-5" 
            fill={isInWishlist(product.id.toString()) ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
        </button>

        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <Image
          src={getProductImage()}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={handleImageError}
          onLoad={handleImageLoad}
          priority={false}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        
        {/* Availability Badge */}
        {!product.available_to_buy && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Out of Stock
          </div>
        )}
        
        {/* Platform Badge */}
        {product.platform && (
          <div className="absolute top-3 left-3 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded-full font-medium">
            {product.platform}
          </div>
        )}
      </div>

      {/* Product Details - Flex grow to fill remaining space */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title and Developer */}
        <div className="flex-grow">
          <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 leading-tight">
            {product.name}
          </h3>
          
          {product.developer && (
            <p className="text-sm text-gray-600 mb-3">{product.developer}</p>
          )}

          {/* Categories */}
          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {product.categories.slice(0, 2).map((category, index) => (
                <span key={`${product.id}-category-${index}`} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {category.name}
                </span>
              ))}
              {product.categories.length > 2 && (
                <span className="text-gray-500 text-xs">+{product.categories.length - 2} more</span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section - Fixed at bottom */}
        <div className="mt-auto">
          {/* Price Section */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-green-600">
                {formatPrice(product.min_price)}
              </span>
              {product.retail_min_price && product.retail_min_price > (product.min_price || 0) && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.retail_min_price)}
                </span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isInCart(product.id.toString()) 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:transform active:scale-95'
              }`}
              onClick={handleAddToCart}
              disabled={addingToCart || isInCart(product.id.toString()) || !product.available_to_buy}
            >
              {addingToCart ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </div>
              ) : isInCart(product.id.toString()) ? (
                'In Cart'
              ) : (
                'Add to Cart'
              )}
            </button>
            <button
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                buyingNow 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md active:transform active:scale-95'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              onClick={handleBuyNow}
              disabled={!product.available_to_buy || buyingNow}
            >
              {buyingNow ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Buy Now'
              )}
            </button>
          </div>

          {/* Release Date */}
          {/* {isValidDate(product.release_date) && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Released: {new Date(product.release_date!).toLocaleDateString()}
            </p>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
