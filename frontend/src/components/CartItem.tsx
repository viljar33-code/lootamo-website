import Image from "next/image";
import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";

interface CartItemProps {
  id: string;
  name: string;
  platform: string;
  region: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  isGift?: boolean;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onGiftToggle?: (id: string, isGift: boolean) => void;
}

export default function CartItem({
  id,
  name,
  platform,
  region,
  price,
  originalPrice,
  image,
  quantity,
  isGift = false,
  onQuantityChange,
  onRemove,
  onGiftToggle
}: CartItemProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setLocalQuantity(newQuantity);
      onQuantityChange(id, newQuantity);
    }
  };

  const handleGiftChange = (checked: boolean) => {
    onGiftToggle?.(id, checked);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0">
          <Image
            src={image}
            alt={name}
            width={80}
            height={80}
            className="rounded-lg object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {platform} - {region}
          </p>
          
          {/* Quantity and Remove */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center border border-gray-300 rounded">
              <button
                onClick={() => handleQuantityChange(localQuantity - 1)}
                className="px-3 py-1 hover:bg-gray-100"
                disabled={localQuantity <= 1}
              >
                -
              </button>
              <span className="px-3 py-1 border-l border-r border-gray-300">
                {localQuantity}
              </span>
              <button
                onClick={() => handleQuantityChange(localQuantity + 1)}
                className="px-3 py-1 hover:bg-gray-100"
              >
                +
              </button>
            </div>
            
            <button
              onClick={() => onRemove(id)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <FaTrash size={14} />
            </button>
          </div>

          {/* Gift Option */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`gift-${id}`}
              checked={isGift}
              onChange={(e) => handleGiftChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={`gift-${id}`} className="text-sm text-gray-600">
              I&apos;m buying it as a gift
            </label>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            ${(price || 0).toFixed(2)}
          </div>
          {originalPrice && originalPrice > (price || 0) && (
            <div className="text-sm text-gray-500 line-through">
              ${originalPrice.toFixed(2)}
            </div>
          )}
          {originalPrice && originalPrice > (price || 0) && (
            <p className="text-gray-600 text-sm">This item can&apos;t be removed from your cart.</p>
          )}
          <div className="text-xs text-gray-500 mt-1">
            VAT included
          </div>
        </div>
      </div>
    </div>
  );
}
