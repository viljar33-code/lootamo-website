
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import WishlistProductCard from "./WishlistProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import toast from "react-hot-toast";
import ConfirmationModal from "./ConfirmationModal";
import { useConfirmation } from "../hooks/useConfirmation";

export default function WishList() {
    const router = useRouter();
    const { wishlistData, summary, loading, clearWishlist, addAllToCart, removeFromWishlist } = useWishlist();
    const { addToCart, isInCart, refreshCart } = useCart();
    const { confirmationState, hideConfirmation, confirmAndExecute } = useConfirmation();
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredItems, setFilteredItems] = useState(wishlistData);

    // Filter items based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredItems(wishlistData);
        } else {
            const filtered = wishlistData.filter(item =>
                item.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    }, [wishlistData, searchTerm]);

    const handleAddToCart = async (productId: string) => {
        try {
            await addToCart(productId, 1, false);
            // Refresh cart to update UI state immediately
            await refreshCart();
        } catch {
            toast.error("Failed to add to cart");
        }
    };

    const handleRemoveFromWishlist = async (productId: string) => {
        const item = wishlistData.find(item => item.product_id === productId);
        const productName = item?.product?.name || 'this item';
        
        confirmAndExecute(
            {
                title: 'Remove from Wishlist',
                message: `Remove "${productName}" from your wishlist?`,
                confirmText: 'Remove',
                cancelText: 'Keep',
                type: 'warning'
            },
            () => removeFromWishlist(productId)
        );
    };

    const handleClearWishlist = async () => {
        confirmAndExecute(
            {
                title: 'Clear Wishlist',
                message: 'Are you sure you want to clear your entire wishlist? This action cannot be undone.',
                confirmText: 'Clear All',
                cancelText: 'Cancel',
                type: 'danger'
            },
            clearWishlist
        );
    };

    // Calculate items not in cart
    const itemsNotInCart = wishlistData.filter(item => !isInCart(item.product_id));
    const itemsNotInCartCount = itemsNotInCart.length;

    const handleAddAllToCart = async () => {
        if (wishlistData.length === 0) {
            toast.error("Your wishlist is empty");
            return;
        }
        
        if (itemsNotInCartCount === 0) {
            toast("All items are already in your cart");
            return;
        }
        
        confirmAndExecute(
            {
                title: 'Add All to Cart',
                message: `Add ${itemsNotInCartCount} items to your cart?`,
                confirmText: 'Add All',
                cancelText: 'Cancel',
                type: 'info'
            },
            async () => {
                await addAllToCart();
                // Refresh cart to update UI state immediately
                await refreshCart();
            }
        );
    };

    const handleBrowseGames = () => {
        router.push("/products");
    };

    return (
        <div className="bg-white pb-9">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                        Wishlist
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <p className="text-gray-600 text-sm sm:text-base">
                            {summary ? `${summary.total_items} ${summary.total_items === 1 ? 'item' : 'items'} in your wishlist` : 
                             `${wishlistData.length} ${wishlistData.length === 1 ? 'item' : 'items'} in your wishlist`}
                            {summary && summary.total_estimated_value > 0 && (
                                <span className="block sm:inline sm:ml-2 text-green-600 font-semibold">
                                    (Total: ${summary.total_estimated_value.toFixed(2)})
                                </span>
                            )}
                        </p>
                        
                        {/* Search Bar */}
                        {wishlistData.length > 0 && (
                            <div className="relative w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search wishlist..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading wishlist...</span>
                    </div>
                )}

                {/* Wishlist Items */}
                {!loading && (
                    <div className="space-y-4">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <WishlistProductCard
                                    key={item.id}
                                    product={{
                                        id: item.product_id,
                                        name: item.product?.name || 'Unknown Product',
                                        platform: item.product?.platform || 'Steam',
                                        type: item.product?.type === 'egoods' ? 'Key' : item.product?.type || 'Key',
                                        region: item.product?.region || 'GLOBAL',
                                        price: item.product?.min_price || 0,
                                        currency: 'USD',
                                        coverImage: item.product?.cover_image || item.product?.small_image || item.product?.thumbnail || '/images/placeholder-game.svg',
                                        canActivateIn: item.product?.region || 'Worldwide',
                                        offerFrom: item.product?.publisher || 'Lootamo',
                                        developer: item.product?.developer,
                                        publisher: item.product?.publisher,
                                        categories: item.product?.categories?.map(cat => cat.name) || [],
                                        retailPrice: item.product?.retail_min_price,
                                        qty: item.product?.qty
                                    }}
                                    onAddToCart={() => handleAddToCart(item.product_id)}
                                    onRemoveFromWishlist={handleRemoveFromWishlist}
                                />
                            ))
                        ) : wishlistData.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-gray-400 text-6xl mb-4">♡</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Your wishlist is empty
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Start adding games you love to keep track of them
                                </p>
                                <button 
                                    onClick={handleBrowseGames}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                    style={{ cursor: "pointer" }}
                                >
                                    Browse Games
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="text-gray-400 text-4xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No items found
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Try adjusting your search term
                                </p>
                                <button 
                                    onClick={() => setSearchTerm("")}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Clear Search
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Bulk Actions */}
                {!loading && wishlistData.length > 0 && (
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <button
                            style={{ cursor: "pointer" }}
                            onClick={handleAddAllToCart}
                            disabled={itemsNotInCartCount === 0}
                            className={`w-full sm:w-auto px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
                                itemsNotInCartCount === 0 
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 11-4 0v-6m4 0V9a2 2 0 10-4 0v4.01" />
                            </svg>
                            <span className="truncate">Add All to Cart ({itemsNotInCartCount})</span>
                        </button>
                        <button
                            style={{ cursor: "pointer" }}
                            onClick={handleClearWishlist}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear Wishlist
                        </button>
                    </div>
                )}

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
        </div>
    );
}