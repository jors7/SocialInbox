export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: October 7, 2025</p>

        <div className="prose prose-gray max-w-none">
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using SocialInbox ("Service"), you accept and agree to be bound by the
            terms and provisions of this agreement. If you do not agree to these terms, please do not
            use the Service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Description of Service</h2>
          <p className="text-gray-700 mb-4">
            SocialInbox provides Instagram direct message automation services, including:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Automated responses to Instagram direct messages</li>
            <li>Conversation flow automation</li>
            <li>Message analytics and reporting</li>
            <li>Integration with Instagram Business accounts</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Account Requirements</h2>
          <p className="text-gray-700 mb-4">
            To use the Service, you must:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Have an Instagram Business or Creator account</li>
            <li>Connect your Instagram account to a Facebook Page</li>
            <li>Comply with Instagram's Terms of Use and Community Guidelines</li>
            <li>Provide accurate account information</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. User Responsibilities</h2>
          <p className="text-gray-700 mb-4">You agree to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Use the Service in compliance with all applicable laws and regulations</li>
            <li>Not use the Service for spam or unsolicited messages</li>
            <li>Not violate Instagram's Platform Policy or Terms of Use</li>
            <li>Maintain the security of your account credentials</li>
            <li>Not share your account access with unauthorized third parties</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Instagram Platform Compliance</h2>
          <p className="text-gray-700 mb-4">
            This Service uses the Instagram API and is subject to Instagram's Platform Policy.
            You acknowledge that:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Instagram may change or terminate API access at any time</li>
            <li>You must comply with Instagram's messaging policies and rate limits</li>
            <li>Messages can only be sent within Instagram's 24-hour messaging window</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Service Availability</h2>
          <p className="text-gray-700 mb-4">
            We strive to provide reliable service, but we do not guarantee:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Uninterrupted or error-free operation</li>
            <li>That the Service will meet your specific requirements</li>
            <li>That all messages will be delivered successfully</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Data and Privacy</h2>
          <p className="text-gray-700 mb-4">
            Your use of the Service is also governed by our Privacy Policy. By using the Service,
            you consent to the collection and use of information as described in the Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            To the maximum extent permitted by law, SocialInbox shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of the Service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9. Termination</h2>
          <p className="text-gray-700 mb-4">
            We reserve the right to suspend or terminate your access to the Service at any time for:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Violation of these Terms of Service</li>
            <li>Violation of Instagram's policies</li>
            <li>Fraudulent or illegal activity</li>
            <li>Non-payment of fees (if applicable)</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10. Changes to Terms</h2>
          <p className="text-gray-700 mb-4">
            We may modify these Terms of Service at any time. Continued use of the Service after
            changes constitutes acceptance of the modified terms.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            For questions about these Terms of Service, please contact:
          </p>
          <p className="text-gray-700 mb-4">
            Email: support@socialinbox.app
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These Terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law provisions.
          </p>
        </div>
      </div>
    </div>
  );
}
