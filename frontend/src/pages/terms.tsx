import Navbar from '@/components/Navbar';
import Topbar from '@/components/Topbar';
import Footer from '@/components/Footer';
import { FaShieldAlt, FaFileContract, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

export default function Terms() {
  return (
    <>
      <Topbar />
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaFileContract className="text-white text-2xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Please read these terms carefully before using our digital gaming marketplace services.
          </p>
          <div className="mt-8 text-sm opacity-75">
            <p>Last updated: October 31, 2024</p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          
          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <FaExclamationTriangle className="text-yellow-600 text-xl mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Important Notice</h3>
                <p className="text-yellow-700 text-sm">
                  By accessing and using Lootamo's services, you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use our services.
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            
            {/* 1. Acceptance of Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">1</span>
                Acceptance of Terms
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  These Terms of Service ("Terms") govern your use of the Lootamo digital gaming marketplace 
                  ("Service") operated by Lootamo ("us", "we", or "our"). By accessing or using our Service, 
                  you agree to be bound by these Terms.
                </p>
                <p className="text-gray-700">
                  If you disagree with any part of these terms, then you may not access the Service. 
                  These Terms apply to all visitors, users, and others who access or use the Service.
                </p>
              </div>
            </section>

            {/* 2. Digital Products */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">2</span>
                Digital Products & Services
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Product Nature</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>All products sold on Lootamo are digital goods, including but not limited to game keys, software licenses, and digital content</li>
                  <li>Digital products are delivered electronically via email or through your account dashboard</li>
                  <li>No physical products are sold or shipped through our platform</li>
                </ul>
                
                <h3 className="font-semibold text-gray-900 mb-3">License Grant</h3>
                <p className="text-gray-700 mb-4">
                  Upon successful payment, you receive a limited, non-exclusive, non-transferable license to use 
                  the digital product in accordance with the publisher's terms and conditions.
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-3">Product Availability</h3>
                <p className="text-gray-700">
                  We strive to ensure product availability but cannot guarantee that all products will be 
                  available at all times. Prices and availability are subject to change without notice.
                </p>
              </div>
            </section>

            {/* 3. User Accounts */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">3</span>
                User Accounts
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Account Creation</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>You must be at least 18 years old to create an account</li>
                  <li>You must provide accurate and complete information during registration</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You are responsible for all activities that occur under your account</li>
                </ul>
                
                <h3 className="font-semibold text-gray-900 mb-3">Account Security</h3>
                <p className="text-gray-700 mb-4">
                  You must immediately notify us of any unauthorized use of your account or any other 
                  breach of security. We will not be liable for any loss or damage arising from your 
                  failure to comply with this security obligation.
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-3">Account Termination</h3>
                <p className="text-gray-700">
                  We reserve the right to terminate or suspend your account at any time for violations 
                  of these Terms or for any other reason at our sole discretion.
                </p>
              </div>
            </section>

            {/* 4. Purchases and Payments */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">4</span>
                Purchases & Payments
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Payment Processing</h3>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>All payments are processed securely through third-party payment processors</li>
                  <li>Prices are displayed in USD and include all applicable taxes</li>
                  <li>Payment must be received in full before digital products are delivered</li>
                  <li>We accept major credit cards and other payment methods as displayed at checkout</li>
                </ul>
                
                <h3 className="font-semibold text-gray-900 mb-3">Order Completion</h3>
                <p className="text-gray-700 mb-4">
                  Orders are considered complete upon successful payment processing and delivery of 
                  the digital product key or license. Delivery typically occurs within minutes of payment confirmation.
                </p>
                
                <h3 className="font-semibold text-gray-900 mb-3">Failed Payments</h3>
                <p className="text-gray-700">
                  If payment fails, your order will be cancelled. You may attempt to place a new order 
                  with valid payment information.
                </p>
              </div>
            </section>

            {/* 5. Refunds and Returns */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">5</span>
                Refunds & Returns
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <FaInfoCircle className="text-red-600 text-xl mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">Digital Goods Policy</h3>
                    <p className="text-red-700 text-sm">
                      Due to the nature of digital goods, all sales are final once the product key or 
                      license has been delivered and revealed to you.
                    </p>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-3">Refund Exceptions</h3>
                <p className="text-gray-700 mb-4">
                  Refunds may be considered in the following exceptional circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>The product key is invalid or already used (not due to customer error)</li>
                  <li>Technical issues prevent product delivery within 24 hours</li>
                  <li>Duplicate purchases made in error (must be reported within 1 hour)</li>
                  <li>Product description was materially inaccurate</li>
                </ul>
                
                <h3 className="font-semibold text-gray-900 mb-3">Refund Process</h3>
                <p className="text-gray-700">
                  To request a refund, contact our support team within 24 hours of purchase with your 
                  order number and detailed explanation. Refunds, if approved, will be processed to 
                  the original payment method within 5-10 business days.
                </p>
              </div>
            </section>

            {/* 6. Prohibited Uses */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">6</span>
                Prohibited Uses
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">You may not use our Service:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>To submit false or misleading information</li>
                  <li>To upload or transmit viruses or any other type of malicious code</li>
                  <li>To collect or track the personal information of others</li>
                  <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                  <li>For any obscene or immoral purpose</li>
                  <li>To interfere with or circumvent the security features of the Service</li>
                </ul>
              </div>
            </section>

            {/* 7. Intellectual Property */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">7</span>
                Intellectual Property Rights
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  The Service and its original content, features, and functionality are and will remain 
                  the exclusive property of Lootamo and its licensors. The Service is protected by 
                  copyright, trademark, and other laws.
                </p>
                <p className="text-gray-700">
                  Our trademarks and trade dress may not be used in connection with any product or 
                  service without our prior written consent.
                </p>
              </div>
            </section>

            {/* 8. Disclaimer */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">8</span>
                Disclaimer
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  The information on this website is provided on an "as is" basis. To the fullest extent 
                  permitted by law, this Company:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Excludes all representations and warranties relating to this website and its contents</li>
                  <li>Excludes all liability for damages arising out of or in connection with your use of this website</li>
                  <li>Does not guarantee the compatibility of purchased products with your system</li>
                  <li>Is not responsible for third-party content or services</li>
                </ul>
              </div>
            </section>

            {/* 9. Limitation of Liability */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">9</span>
                Limitation of Liability
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  In no event shall Lootamo, nor its directors, employees, partners, agents, suppliers, 
                  or affiliates, be liable for any indirect, incidental, special, consequential, or 
                  punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                  or other intangible losses, resulting from your use of the Service.
                </p>
                <p className="text-gray-700">
                  Our total liability to you for all claims arising out of or relating to the use of 
                  or any inability to use any portion of the Service shall not exceed the amount you 
                  paid us for the specific product or service in question.
                </p>
              </div>
            </section>

            {/* 10. Governing Law */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">10</span>
                Governing Law
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  These Terms shall be interpreted and governed by the laws of the jurisdiction in which 
                  Lootamo operates, without regard to its conflict of law provisions.
                </p>
                <p className="text-gray-700">
                  Our failure to enforce any right or provision of these Terms will not be considered 
                  a waiver of those rights.
                </p>
              </div>
            </section>

            {/* 11. Changes to Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">11</span>
                Changes to Terms
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                  If a revision is material, we will try to provide at least 30 days notice prior to any 
                  new terms taking effect.
                </p>
                <p className="text-gray-700">
                  What constitutes a material change will be determined at our sole discretion. By continuing 
                  to access or use our Service after those revisions become effective, you agree to be bound 
                  by the revised terms.
                </p>
              </div>
            </section>

            {/* 12. Contact Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold mr-3">12</span>
                Contact Information
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> <a href="mailto:legal@lootamo.com" className="text-blue-600 hover:text-blue-700">legal@lootamo.com</a></p>
                  <p><strong>Support:</strong> <a href="mailto:support@lootamo.com" className="text-blue-600 hover:text-blue-700">support@lootamo.com</a></p>
                  <p><strong>Website:</strong> <a href="https://lootamo.com" className="text-blue-600 hover:text-blue-700">https://lootamo.com</a></p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaShieldAlt className="text-green-600 text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Questions About Our Terms?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Our support team is here to help clarify any questions you may have about our terms of service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/help" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Contact Support
            </a>
            <a 
              href="/contact" 
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Business Inquiries
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
