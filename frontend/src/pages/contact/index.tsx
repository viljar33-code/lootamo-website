import Navbar from "@/components/Navbar";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { FaFacebook, FaTwitter, FaYoutube, FaInstagram, FaLinkedin, FaTwitch, FaReddit } from "react-icons/fa";

export default function Contact() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        message: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <>
            <Topbar />
            <Navbar />
            
            {/* Hero Section */}
            <section className="bg-slate-800 text-white py-16 px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact</h1>
                    <p className="text-lg md:text-xl mb-8 max-w-2xl">
                        Whether you&apos;re looking for assistance, have a business inquiry, or need to reach our 
                        media team, we&apos;re here to guide you. Choose the right department for your inquiry.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                        <div>
                            <h3 className="font-semibold text-blue-400 mb-2">Sales Partnerships</h3>
                            <p className="text-gray-300">business cooperation & distribution</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-400 mb-2">Developer Partnerships</h3>
                            <p className="text-gray-300">game dev & publishers</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-400 mb-2">Marketing Partnerships</h3>
                            <p className="text-gray-300">influencers & promo campaigns</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-400 mb-2">Communications Team</h3>
                            <p className="text-gray-300">media & PR inquiries</p>
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <div>
                            <h3 className="font-semibold text-blue-400 mb-2">G2A Academy</h3>
                            <p className="text-gray-300">teachers using games in education</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Side - Let's Connect */}
                        <div className="bg-slate-800 text-white p-8 rounded-lg">
                            <h2 className="text-3xl font-bold mb-6">Let&apos;s Connect!</h2>
                            <p className="text-lg mb-8">
                                Choose the right department for your inquiry: Sales, 
                                Developers, Educators, Media, or Marketing Partnerships
                            </p>
                            
                            {/* Social Media Links */}
                            <div className="mt-12">
                                <h3 className="text-xl font-semibold mb-6">Find us on social media</h3>
                                <div className="flex gap-4 flex-wrap">
                                    <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                                        <FaFacebook size={20} />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors">
                                        <FaTwitter size={20} />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                                        <FaYoutube size={20} />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors">
                                        <FaInstagram size={20} />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors">
                                        <FaLinkedin size={20} />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors">
                                        <FaTwitch size={20} />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center hover:bg-orange-700 transition-colors">
                                        <FaReddit size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Contact Form */}
                        <div className="bg-white sm:p-8 rounded-lg shadow-sm">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            placeholder="eg. Lucas"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            placeholder="eg. Jones"
                                            className="w-full focus:outline-none px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Business email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="eg. lucas@mail.com"
                                        className="w-full px-4 py-3 focus:outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Department Selection */}
                                <div>
                                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                                        Choose a department to contact <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="department"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 focus:outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">—Please choose an option—</option>
                                        <option value="sales">Sales Partnerships</option>
                                        <option value="developer">Developer Partnerships</option>
                                        <option value="marketing">Marketing Partnerships</option>
                                        <option value="communications">Communications Team</option>
                                        <option value="academy">G2A Academy</option>
                                    </select>
                                </div>

                                {/* Message Field */}
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                        Your message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Enter your message..."
                                        rows={6}
                                        className="w-full px-4 py-3 focus:outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                                >
                                    Send
                                </button>

                                {/* Privacy Notice */}
                                <p className="text-xs text-gray-500 mt-4">
                                    By selecting Send you give G2A.COM Limited consent to sending to your email 
                                    commercial communication, including the one suited to you... 
                                    <a href="#" className="text-blue-600 hover:underline">Read more</a>
                                </p>
                            </form>
                        </div>
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