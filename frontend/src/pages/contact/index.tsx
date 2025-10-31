import Navbar from "@/components/Navbar";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { FaFacebook, FaTwitter, FaYoutube, FaInstagram, FaLinkedin, FaTwitch, FaReddit, FaEnvelope, FaQuestionCircle, FaHeadset } from "react-icons/fa";

export default function Contact() {
    return (
        <>
            <Topbar />
            <Navbar />
            
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white py-20 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">Get in Touch</h1>
                    <p className="text-lg md:text-xl mb-12 max-w-3xl mx-auto opacity-90">
                        We're here to help! Whether you need support, have a business inquiry, 
                        or want to partner with us, we'd love to hear from you.
                    </p>
                    
                    {/* Quick Contact Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <Link href="/help" className="group">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-400 transition-colors">
                                    <FaHeadset className="text-white text-2xl" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Need Support?</h3>
                                <p className="text-sm opacity-80 mb-4">Get help with orders, billing, or technical issues</p>
                                <span className="text-blue-300 font-medium">Visit Help Center →</span>
                            </div>
                        </Link>
                        
                        <a href="mailto:support@lootamo.com" className="group">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-400 transition-colors">
                                    <FaEnvelope className="text-white text-2xl" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Email Us</h3>
                                <p className="text-sm opacity-80 mb-4">Send us an email directly</p>
                                <span className="text-green-300 font-medium">support@lootamo.com</span>
                            </div>
                        </a>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8">
                            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaQuestionCircle className="text-white text-2xl" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Quick Answers</h3>
                            <p className="text-sm opacity-80 mb-4">Browse our FAQ for instant help</p>
                            <span className="text-purple-300 font-medium">Coming Soon</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Business Partnerships Section */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Business Partnerships</h2>
                        <p className="text-lg text-gray-600">Looking to partner with us? Choose the right department for your inquiry.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-xl text-gray-900 mb-2">Sales Partnerships</h3>
                            <p className="text-gray-600 mb-4">Business cooperation & distribution opportunities</p>
                            <a href="mailto:partnerships@lootamo.com" className="text-blue-600 hover:text-blue-700 font-medium">
                                partnerships@lootamo.com
                            </a>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-xl text-gray-900 mb-2">Developer Partnerships</h3>
                            <p className="text-gray-600 mb-4">Game developers & publishers collaboration</p>
                            <a href="mailto:developers@lootamo.com" className="text-green-600 hover:text-green-700 font-medium">
                                developers@lootamo.com
                            </a>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-xl text-gray-900 mb-2">Marketing Partnerships</h3>
                            <p className="text-gray-600 mb-4">Influencers & promotional campaigns</p>
                            <a href="mailto:marketing@lootamo.com" className="text-purple-600 hover:text-purple-700 font-medium">
                                marketing@lootamo.com
                            </a>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-xl text-gray-900 mb-2">Media & PR</h3>
                            <p className="text-gray-600 mb-4">Press inquiries & media relations</p>
                            <a href="mailto:press@lootamo.com" className="text-orange-600 hover:text-orange-700 font-medium">
                                press@lootamo.com
                            </a>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-xl text-gray-900 mb-2">Education</h3>
                            <p className="text-gray-600 mb-4">Educational institutions & academic programs</p>
                            <a href="mailto:education@lootamo.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                education@lootamo.com
                            </a>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-xl text-gray-900 mb-2">General Business</h3>
                            <p className="text-gray-600 mb-4">Other business inquiries & opportunities</p>
                            <a href="mailto:business@lootamo.com" className="text-red-600 hover:text-red-700 font-medium">
                                business@lootamo.com
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Media Section */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Follow Us</h2>
                    <p className="text-lg text-gray-600 mb-8">Stay connected and get the latest updates</p>
                    
                    <div className="flex justify-center gap-4 flex-wrap">
                        <a href="#" className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors transform hover:scale-110">
                            <FaFacebook className="text-white text-xl" />
                        </a>
                        <a href="#" className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors transform hover:scale-110">
                            <FaTwitter className="text-white text-xl" />
                        </a>
                        <a href="#" className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors transform hover:scale-110">
                            <FaYoutube className="text-white text-xl" />
                        </a>
                        <a href="#" className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors transform hover:scale-110">
                            <FaInstagram className="text-white text-xl" />
                        </a>
                        <a href="#" className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors transform hover:scale-110">
                            <FaLinkedin className="text-white text-xl" />
                        </a>
                        <a href="#" className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors transform hover:scale-110">
                            <FaTwitch className="text-white text-xl" />
                        </a>
                        <a href="#" className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center hover:bg-orange-700 transition-colors transform hover:scale-110">
                            <FaReddit className="text-white text-xl" />
                        </a>
                    </div>
                </div>
            </section>

            {/* Support Hub Section */}
            <section className="py-16 px-4 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Need more help?</h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Check out for assistance with any issues or questions you may have
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Support Hub for sellers
                        </button>
                        <button className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Support Hub for buyers
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}