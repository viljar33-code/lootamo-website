import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import { productService } from '@/services/productService';
import { useWishlist } from '@/contexts/WishlistContext';
import { FiArrowLeft, FiEdit, FiEye } from 'react-icons/fi';

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const productData = await productService.getProduct(productId);
      setProduct(productData);
      
      const imageUrls = (productData.images || []).map(img => img.url).filter((url): url is string => url !== undefined && url !== null && typeof url === 'string' && url.trim() !== '');
      const allImages = [
        productData.cover_image,
        ...imageUrls
      ].filter((url): url is string => url !== undefined && url !== null && typeof url === 'string' && url.trim() !== '');

      if (allImages.length > 0) {
        setSelectedImage(allImages[0]);
        setCurrentImageIndex(0);
      } else {
        setSelectedImage('/images/placeholder-game.svg');
        setCurrentImageIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const isValidDate = (dateString?: string) => {
    if (!dateString || dateString.trim() === "") return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString !== "0000-00-00" && dateString !== "1970-01-01";
  };

  const isYouTubeUrl = (url: string): boolean => {
    try {
      const u = new URL(url);
      return (
        u.hostname.includes('youtube.com') ||
        u.hostname.includes('youtu.be') ||
        u.hostname.includes('youtube-nocookie.com')
      );
    } catch {
      return false;
    }
  };

  const extractYouTubeId = (url: string): string | null => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.slice(1);
      }
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname === '/watch') {
          return u.searchParams.get('v');
        }
        if (u.pathname.startsWith('/embed/')) {
          return u.pathname.split('/embed/')[1].split('?')[0]; // Remove query params
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const id = extractYouTubeId(url);
    if (!id) return null;
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const id = extractYouTubeId(url);
    if (!id) return null;
    return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  };

  const getAllMedia = (): Array<{ type: 'image' | 'video'; url: string; thumbnail: string }> => {
    if (!product) return [];
    
    const media: Array<{ type: 'image' | 'video'; url: string; thumbnail: string }> = [];
    
    const imageUrls = (product.images || []).map(img => img.url).filter((url): url is string => url !== undefined && url !== null && typeof url === 'string' && url.trim() !== '');
    const allImages = [
      product.cover_image,
      ...imageUrls
    ].filter((url): url is string => url !== undefined && url !== null && typeof url === 'string' && url.trim() !== '');
    
    allImages.forEach(url => {
      media.push({ type: 'image', url, thumbnail: url });
    });
    
    if (product.videos && product.videos.length > 0) {
      product.videos.forEach(video => {
        const videoUrl = video.url;
        const ytThumb = isYouTubeUrl(videoUrl) ? getYouTubeThumbnail(videoUrl) : null;
        media.push({
          type: 'video',
          url: videoUrl,
          thumbnail: ytThumb || product.cover_image || '/images/placeholder-game.svg'
        });
      });
    }
    
    return media.length > 0 ? media : [{ type: 'image', url: '/images/placeholder-game.svg', thumbnail: '/images/placeholder-game.svg' }];
  };

  const nextImage = () => {
    const media = getAllMedia();
    setCurrentImageIndex((prev) => (prev + 1) % media.length);
    setSelectedImage(media[(currentImageIndex + 1) % media.length].url);
  };

  const prevImage = () => {
    const media = getAllMedia();
    setCurrentImageIndex((prev) => (prev - 1 + media.length) % media.length);
    setSelectedImage(media[(currentImageIndex - 1 + media.length) % media.length].url);
  };

  const selectMedia = (index: number) => {
    const media = getAllMedia();
    setCurrentImageIndex(index);
    setSelectedImage(media[index].url);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Product - Lootamo</title>
        </Head>
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-300 rounded-lg h-96"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-12 bg-gray-300 rounded w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Head>
          <title>Product Not Found - Lootamo</title>
        </Head>
        <main className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">⚠️ Product not found</div>
              <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
              <button
                onClick={() => router.push('/admin/users')}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Admin Users
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }
  return (
    <>
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">      
          {/* Admin Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/products"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back to Products</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Product Status Badge */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                product.available_to_buy 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.available_to_buy ? 'Available' : 'Out of Stock'}
              </span>      
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Media Carousel */}
              <div className="space-y-4">
                {/* Main Media Display */}
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                  {product.available_to_buy === false && (
                    <div className="absolute top-4 right-4 z-20 bg-red-500 text-white px-3 py-1 rounded-full font-medium">
                      Out of Stock
                    </div>
                  )}
                  
                  {/* Main Image/Video */}
                  {getAllMedia()[currentImageIndex]?.type === 'video' ? (
                    <div className="relative w-full h-full">
                      {(() => {
                        const current = getAllMedia()[currentImageIndex];
                        const url = current?.url || '';
                        if (isYouTubeUrl(url)) {
                          // If URL is already an embed URL, use it directly, otherwise convert it
                          const embedUrl = url.includes('/embed/') ? url : getYouTubeEmbedUrl(url);
                          return (
                            <iframe
                              src={embedUrl || ''}
                              title="Product video"
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          );
                        }
                        return (
                          <video
                            src={url}
                            controls
                            className="w-full h-full object-cover"
                            poster={current?.thumbnail}
                          />
                        );
                      })()}
                      {/* Fallback button to open on YouTube if an age-gate or block appears */}
                      {isYouTubeUrl(getAllMedia()[currentImageIndex]?.url || '') && (
                        <a
                          href={getAllMedia()[currentImageIndex]?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-md"
                        >
                          Watch on YouTube
                        </a>
                      )}
                    </div>
                  ) : (
                    <Image
                      src={selectedImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                      onError={() => setSelectedImage('/images/placeholder-game.svg')}
                    />
                  )}
                  
                  {/* Navigation Arrows */}
                  {getAllMedia().length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                  
                  {/* Media Counter */}
                  {getAllMedia().length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {getAllMedia().length}
                    </div>
                  )}
                </div>

                {/* Media Thumbnails */}
                {getAllMedia().length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {getAllMedia().map((media, index) => (
                      <button
                        key={index}
                        onClick={() => selectMedia(index)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors ${
                          currentImageIndex === index ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Image
                          src={media.thumbnail}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {media.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                {/* Title and Developer */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  {product.developer && (
                    <p className="text-lg text-gray-600">by {product.developer}</p>
                  )}
                  {product.publisher && product.publisher !== product.developer && (
                    <p className="text-sm text-gray-500">Published by {product.publisher}</p>
                  )}
                </div>

                {/* Platform */}
                {product.platform && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Platform:</span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {product.platform}
                    </span>
                  </div>
                )}

                {/* Categories */}
                {product.categories && product.categories.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700 block mb-2">Categories:</span>
                    <div className="flex flex-wrap gap-2">
                      {product.categories.map((category, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-green-600">
                          {formatPrice(product.min_price)}
                        </span>
                        {product.retail_min_price && product.retail_min_price > (product.min_price || 0) && (
                          <span className="text-lg text-gray-500 line-through">
                            {formatPrice(product.retail_min_price)}
                          </span>
                        )}
                      </div>
                      {product.retail_min_price && product.retail_min_price > (product.min_price || 0) && (
                        <p className="text-sm text-green-600 mt-1">
                          Save {formatPrice(product.retail_min_price - (product.min_price || 0))}
                        </p>
                      )}
                    </div>
                  </div>            
                </div>

                {/* Additional Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    {isValidDate(product.release_date) && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Release Date:</span>
                        <span className="text-gray-600">
                          {new Date(product.release_date!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    
                    {product.region && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Region:</span>
                        <span className="text-gray-600">{product.region}</span>
                      </div>
                    )}
                    
                    {product.platform && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Platform:</span>
                        <span className="text-gray-600">{product.platform}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Product Type:</span>
                      <span className="text-gray-600 capitalize">{product.type}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Stock:</span>
                      <span className="text-gray-600">{product.qty} available</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Product ID:</span>
                      <span className="text-gray-600 font-mono text-xs">{product.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Ratings & Restrictions */}
            {product.restrictions && Object.values(product.restrictions).some(Boolean) && (
              <div className="border-t border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Content Ratings</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product.restrictions.pegi_violence && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-700">Violence</span>
                    </div>
                  )}
                  {product.restrictions.pegi_profanity && (
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-orange-700">Profanity</span>
                    </div>
                  )}
                  {product.restrictions.pegi_drugs && (
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium text-purple-700">Drugs</span>
                    </div>
                  )}
                  {product.restrictions.pegi_fear && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-yellow-700">Fear</span>
                    </div>
                  )}
                  {product.restrictions.pegi_gambling && (
                    <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span className="text-sm font-medium text-pink-700">Gambling</span>
                    </div>
                  )}
                  {product.restrictions.pegi_online && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-700">Online</span>
                    </div>
                  )}
                  {product.restrictions.pegi_sex && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-red-700">Sexual Content</span>
                    </div>
                  )}
                  {product.restrictions.pegi_discrimination && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Discrimination</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System Requirements */}
            {(() => {
              const hasMinimalReqs = product.requirements?.minimal && Object.values(product.requirements.minimal).some(val => val && val.trim() !== '');
              const hasRecommendedReqs = product.requirements?.recommended && Object.values(product.requirements.recommended).some(val => val && val.trim() !== '');
              
              if (!hasMinimalReqs && !hasRecommendedReqs) return null;
              
              return (
                <div className="border-t border-gray-200 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">System Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Minimum Requirements */}
                    {hasMinimalReqs && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Minimum Requirements</h4>
                        <div className="space-y-3 text-sm">
                          {product.requirements?.minimal?.reqsystem && product.requirements.minimal.reqsystem.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">OS:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.minimal.reqsystem}</span>
                            </div>
                          )}
                          {product.requirements?.minimal?.reqprocessor && product.requirements.minimal.reqprocessor.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">Processor:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.minimal.reqprocessor}</span>
                            </div>
                          )}
                          {product.requirements?.minimal?.reqmemory && product.requirements.minimal.reqmemory.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">Memory:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.minimal.reqmemory}</span>
                            </div>
                          )}
                          {product.requirements?.minimal?.reqgraphics && product.requirements.minimal.reqgraphics.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">Graphics:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.minimal.reqgraphics}</span>
                            </div>
                          )}
                          {product.requirements?.minimal?.reqdiskspace && product.requirements.minimal.reqdiskspace.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">Storage:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.minimal.reqdiskspace}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recommended Requirements */}
                    {hasRecommendedReqs && (
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Recommended Requirements</h4>
                        <div className="space-y-3 text-sm">
                          {product.requirements?.recommended?.reqsystem && product.requirements.recommended.reqsystem.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">OS:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.recommended.reqsystem}</span>
                            </div>
                          )}
                          {product.requirements?.recommended?.reqprocessor && product.requirements.recommended.reqprocessor.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">Processor:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.recommended.reqprocessor}</span>
                            </div>
                          )}
                          {product.requirements?.recommended?.reqmemory && product.requirements.recommended.reqmemory.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">Memory:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.recommended.reqmemory}</span>
                            </div>
                          )}
                          {product.requirements?.recommended?.reqgraphics && product.requirements.recommended.reqgraphics.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">Graphics:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.recommended.reqgraphics}</span>
                            </div>
                          )}
                          {product.requirements?.recommended?.reqdiskspace && product.requirements.recommended.reqdiskspace.trim() && (
                            <div>
                              <span className="font-medium text-gray-700">Storage:</span>
                              <span className="ml-2 text-gray-600">{product.requirements.recommended.reqdiskspace}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </main>

    </>
  );
}

