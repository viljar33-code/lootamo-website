import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaTrash, FaInfoCircle, FaTrashAlt, FaSearch, FaTimes } from "react-icons/fa";
import { useCart } from '../contexts/CartContext';
import ConfirmationModal from './ConfirmationModal';
import { useConfirmation } from '../hooks/useConfirmation';
import { useAuth } from "@/contexts/AuthContext";


export default function Cart() {
  const {
    items: cartItems,
    summary,
    loading,
    updateQuantity,
    removeFromCart,
    removeMultipleFromCart,
    updateCartItem,
    clearCart,
    getCartTotal
  } = useCart();

  const { confirmationState, hideConfirmation, confirmAndExecute } = useConfirmation();
  const router = useRouter();
  const [isPlusEnabled, setIsPlusEnabled] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { user: authUser} = useAuth();

  const handleQuantityChange = async (productId: string, quantity: number) => {
    await updateQuantity(productId, quantity);
  };

  const handleRemoveItem = async (productId: string) => {
    const item = cartItems.find(item => item.product_id === productId);
    const productName = item?.product?.name || 'this item';
    
    confirmAndExecute(
      {
        title: 'Remove Item',
        message: `Are you sure you want to remove "${productName}" from your cart?`,
        confirmText: 'Remove',
        cancelText: 'Keep',
        type: 'danger'
      },
      () => removeFromCart(productId)
    );
  };

  const handleGiftToggle = async (productId: string, isGift: boolean) => {
    const item = cartItems.find(item => item.product_id === productId);
    if (item) {
      await updateCartItem(productId, item.quantity, isGift);
    }
  };

  const handleSelectItem = (productId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === cartItems.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(cartItems.map(item => item.product_id));
      setSelectedItems(allIds);
      setSelectAll(true);
    }
  };

  const handleClearCart = () => {
    confirmAndExecute(
      {
        title: 'Clear Cart',
        message: `Are you sure you want to remove all ${cartItems.length} items from your cart?`,
        confirmText: 'Clear All',
        cancelText: 'Cancel',
        type: 'danger'
      },
      () => clearCart()
    );
  };

  const handleDeleteSelected = () => {
    const selectedCount = selectedItems.size;
    if (selectedCount === 0) return;

    confirmAndExecute(
      {
        title: 'Delete Selected Items',
        message: `Are you sure you want to remove ${selectedCount} selected item${selectedCount > 1 ? 's' : ''} from your cart?`,
        confirmText: 'Delete Selected',
        cancelText: 'Cancel',
        type: 'danger'
      },
      async () => {
        const productIds = Array.from(selectedItems);
        await removeMultipleFromCart(productIds);
        setSelectedItems(new Set());
        setSelectAll(false);
      }
    );
  };

  // Filter cart items based on search query
  const filteredCartItems = cartItems.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const product = item.product;
    
    return (
      product.name?.toLowerCase().includes(query) ||
      product.developer?.toLowerCase().includes(query) ||
      product.publisher?.toLowerCase().includes(query) ||
      product.platform?.toLowerCase().includes(query) ||
      product.categories?.some(cat => cat.name?.toLowerCase().includes(query))
    );
  });

  const subtotal = getCartTotal();
  const plusDiscount = isPlusEnabled ? 2.67 : 0;
  const total = subtotal - plusDiscount;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setIsCheckingOut(true);
    
    try {
      const { checkoutService } = await import('../services/checkoutService');
      
      const checkoutData = {
        user_id: authUser?.id || 0, 
        total_price: total,
        currency: "EUR",
        status: "pending",
        payment_status: "pending",
        order_items: cartItems.map(item => ({
          product_id: item.product_id,
          price: item.product.min_price || 0,
          quantity: item.quantity
        }))
      };

      const orderData = await checkoutService.checkoutCart(checkoutData);
      
      // Don't clear cart here - it will be cleared by backend after successful payment
      // await clearCart();
      
      router.push(`/checkout?orderId=${orderData.id}`);
      
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (loading && cartItems.length === 0) {
    return (
      <div className="pt-12 pb-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="pt-12 pb-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl text-gray-300 mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
            <Link
              href="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-6 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Your cart</h1>
                <div className="flex items-center gap-3">
                  {selectedItems.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      disabled={loading}
                    >
                      <FaTrash size={14} />
                      Delete Selected ({selectedItems.size})
                    </button>
                  )}
                  <button
                    onClick={handleClearCart}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    disabled={loading || cartItems.length === 0}
                  >
                    <FaTrashAlt size={14} />
                    Clear All
                  </button>
                </div>
              </div>
              
              {/* Search Bar */}
              {cartItems.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search cart items by name, developer, publisher, platform, or category..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <FaTimes className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <div className="mt-2 text-sm text-gray-600">
                      Showing {filteredCartItems.length} of {cartItems.length} items
                      {filteredCartItems.length !== cartItems.length && (
                        <button
                          onClick={clearSearch}
                          className="ml-2 text-blue-600 hover:text-blue-800 underline"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaInfoCircle className="text-blue-500" />
                  <span>Complete the order - adding items to the cart does not mean booking.</span>
                </div>
                
                {cartItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={loading}
                    />
                    <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer">
                      Select All ({filteredCartItems.length})
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items */}
            {searchQuery && filteredCartItems.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="text-4xl text-gray-300 mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 mb-4">
                  No cart items match your search for &ldquo;{searchQuery}&rdquo;
                </p>
                <button
                  onClick={clearSearch}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Clear search to see all items
                </button>
              </div>
            ) : (
              filteredCartItems.map((item) => (
              <div key={item.id} className={`bg-white rounded-lg p-4 border transition-colors ${
                selectedItems.has(item.product_id) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}>
                <div className="flex flex-wrap gap-4">
                  {/* Selection Checkbox */}
                  <div className="flex-shrink-0 flex items-start pt-2">
                    <input
                      type="checkbox"
                      id={`select-${item.id}`}
                      checked={selectedItems.has(item.product_id)}
                      onChange={() => handleSelectItem(item.product_id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <Image
                      src={item.product.cover_image || item.product.small_image || item.product.thumbnail || '/images/placeholder.jpg'}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.product.name}</h3>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-4">
                        <span>{item.product.platform || 'Steam'}</span>
                        <span>•</span>
                        <span>{item.product.region || 'GLOBAL'}</span>
                        <span>•</span>
                        <span>From {item.product.publisher || 'G2A'}</span>
                      </div>
                      {item.product.developer && (
                        <div className="mt-1">
                          <span className="font-medium">Developer:</span> {item.product.developer}
                        </div>
                      )}
                      {item.product.categories && item.product.categories.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.product.categories.slice(0, 3).map((category, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {category.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center border border-gray-300 rounded">
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-gray-100"
                          disabled={item.quantity <= 1 || loading}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 border-l border-r border-gray-300">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-gray-100"
                          disabled={loading}
                        >
                          +
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        disabled={loading}
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`gift-${item.id}`}
                        checked={false}
                        onChange={(e) => handleGiftToggle(item.product_id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={loading}
                      />
                      <label htmlFor={`gift-${item.id}`} className="text-sm text-gray-600">
                        I&apos;m buying it as a gift
                      </label>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="mb-2">
                      <div className="flex items-baseline justify-end gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          ${(item.product.min_price * item.quantity).toFixed(2)}
                        </span>
                        {item.product.retail_min_price && item.product.retail_min_price > item.product.min_price && (
                          <span className="text-sm text-gray-500 line-through">
                            ${(item.product.retail_min_price * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {item.product.retail_min_price && item.product.retail_min_price > item.product.min_price && (
                        <div className="mt-1">
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                            {Math.round(((item.product.retail_min_price - item.product.min_price) / item.product.retail_min_price) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      VAT not included
                    </div>
                    {item.product.qty !== undefined && (
                      <div className="mt-1 text-xs">
                        <span className={`font-medium ${
                          item.product.qty > 10 ? "text-green-600" : 
                          item.product.qty > 0 ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {item.product.qty} in stock
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ))
            )}

          
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-4">
            {/* G2A Plus Section */}
            <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-purple-900">Join Plus Premium</h3>
                  <p className="text-sm text-purple-700">Save $ 2.67 instantly and enjoy:</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPlusEnabled}
                    onChange={(e) => setIsPlusEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className="space-y-1 text-sm text-purple-700">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Better prices</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Plus Points to save even more</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Regular bonuses and rewards</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Post-buy premium assistance</span>
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div className="bg-white rounded-lg p-4 border border-gray-300">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({summary?.totalItems || cartItems.length} items{searchQuery ? `, ${filteredCartItems.length} shown` : ''})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {isPlusEnabled && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Plus Premium Discount</span>
                    <span>-${plusDiscount.toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-gray-200" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Cart total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || isCheckingOut}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? 'Processing...' : 'Checkout'}
              </button>

              <button className="w-full text-blue-600 py-2 text-sm hover:underline">
                Add a discount code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={hideConfirmation}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        type={confirmationState.type}
        confirmButtonClass={confirmationState.confirmButtonClass}
      />
    </div>
  );
}
