import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FaShoppingCart } from 'react-icons/fa';
import { FiTrash2 } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';


interface WishlistProductCardProps {
  product: {
    id: string;
    name: string;
    coverImage: string;
    platform: string;
    region: string;
    price: number;
    retailPrice?: number;
    currency: string;
    developer?: string;
    publisher?: string;
    categories?: string[];
    qty?: number;
    offerFrom: string;
    type?: string;
    canActivateIn?: string;
    available?: boolean;
  };
  onAddToCart?: (productId: string) => void;
  onRemoveFromWishlist?: (productId: string) => void;
}

export default function WishlistProductCard({
  product,
  onAddToCart,
  onRemoveFromWishlist
}: WishlistProductCardProps) {
  const { addToCart, isInCart, loading: cartLoading } = useCart();
  const router = useRouter();
  
  const handleAddToCart = async () => {
    if (onAddToCart) {
      onAddToCart(product.id);
    } else {
      await addToCart(product.id, 1, false);
    }
  };

  const handleProductClick = () => {
    router.push(`/products/${product.id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>

          {/* Product Image */}
          <div className="flex-shrink-0">
            <Image
              src="/images/heroCardImg1.jpeg"
              alt={product.name}
              width={60}
              height={75}
              className="rounded-lg object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={handleProductClick}>
            <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 leading-tight">
              {product.name}
            </h3>

            <div className="space-y-0.5 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="font-medium">Platform:</span>
                <span className="truncate">{product.platform}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Type:</span>
                <span className="truncate">{product.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Region:</span>
                <span className="truncate">{product.region}</span>
              </div>
              {product.developer && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Dev:</span>
                  <span className="truncate">{product.developer}</span>
                </div>
              )}
              {product.qty && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Stock:</span>
                  <span className={product.qty > 10 ? "text-green-600" : product.qty > 0 ? "text-yellow-600" : "text-red-600"}>
                    {product.qty}
                  </span>
                </div>
              )}
            </div>

            {/* Activation Info */}
            <div className="mt-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">
                Can activate in: {product.canActivateIn}
              </span>
            </div>

            {/* Price */}
            <div className="mt-1.5">
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-base font-bold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.retailPrice && product.retailPrice > product.price && (
                  <span className="text-xs text-gray-500 line-through">
                    ${product.retailPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {product.retailPrice && product.retailPrice > product.price && (
                <span className="inline-block text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium mt-0.5">
                  {Math.round(((product.retailPrice - product.price) / product.retailPrice) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Offer Source */}
            <div className="mt-1 text-xs text-gray-500 truncate">
              FROM: {product.offerFrom}
            </div>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-sm cursor-pointer"
            disabled={cartLoading}
          >
            <FaShoppingCart size={14} />
            {cartLoading ? 'Adding...' : 'Add to cart'}
          </button>

          <button
            onClick={() => onRemoveFromWishlist?.(product.id)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>

        {/* Product Image */}
        <div className="flex-shrink-0">
          <Image
            src={product.coverImage}
            alt={product.name}
            width={120}
            height={160}
            className="rounded-lg object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleProductClick}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>

          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">Platform</span>
              <span>{product.platform}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Type</span>
              <span>{product.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Region</span>
              <span>{product.region}</span>
            </div>
            {product.developer && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Developer</span>
                <span>{product.developer}</span>
              </div>
            )}
            {product.categories && product.categories.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {product.categories.slice(0, 3).map((category, index) => (
                  <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {category}
                  </span>
                ))}
                {product.categories.length > 3 && (
                  <span className="text-xs text-gray-500">+{product.categories.length - 3} more</span>
                )}
              </div>
            )}
          </div>

          {/* Activation Info */}
          <div className="mt-3 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">
              Can activate in: {product.canActivateIn}
            </span>
          </div>

          {/* Offer Source */}
          <div className="mt-2 text-xs text-gray-500">
            OFFER FROM: {product.offerFrom}
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex-shrink-0 text-right">
          <div className="mb-4">
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.retailPrice && product.retailPrice > product.price && (
                <span className="text-sm text-gray-500 line-through">
                  ${product.retailPrice.toFixed(2)}
                </span>
              )}
            </div>
            {product.retailPrice && product.retailPrice > product.price && (
              <div className="mt-1">
                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                  {Math.round(((product.retailPrice - product.price) / product.retailPrice) * 100)}% OFF
                </span>
              </div>
            )}
            {product.qty !== undefined && (
              <div className="mt-2 text-xs">
                <span className={`font-medium ${product.qty > 10 ? "text-green-600" : product.qty > 0 ? "text-yellow-600" : "text-red-600"}`}>
                  {product.qty} in stock
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              style={{ cursor: "pointer" }}
              onClick={handleAddToCart}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                isInCart(product.id) 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={cartLoading || isInCart(product.id)}
            >
              <FaShoppingCart size={16} />
              {cartLoading ? (
                <span>Adding...</span>
              ) : isInCart(product.id) ? (
                'In Cart'
              ) : (
                'Add to cart'
              )}
            </button>

            <button
              onClick={() => onRemoveFromWishlist?.(product.id)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FiTrash2 size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
