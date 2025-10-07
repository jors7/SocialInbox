export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: October 7, 2025</p>

        <div className="prose prose-gray max-w-none">
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Information We Collect</h2>
          <p className="text-gray-700 mb-4">
            SocialInbox collects information necessary to provide Instagram DM automation services:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Instagram Business account information (username, user ID)</li>
            <li>Direct messages sent to and from your Instagram account</li>
            <li>Contact information for users who message your account</li>
            <li>Account authentication tokens (stored encrypted)</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Provide Instagram DM automation services</li>
            <li>Process and respond to messages on your behalf</li>
            <li>Analyze conversation patterns and engagement metrics</li>
            <li>Improve our services and develop new features</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Data Storage and Security</h2>
          <p className="text-gray-700 mb-4">
            We take data security seriously:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>All access tokens are encrypted using industry-standard encryption</li>
            <li>Data is stored securely on Supabase infrastructure</li>
            <li>We implement appropriate technical and organizational measures to protect your data</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Data Sharing</h2>
          <p className="text-gray-700 mb-4">
            We do not sell or share your personal information with third parties except:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and prevent fraud</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Your Rights</h2>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Access your personal data</li>
            <li>Request correction of your data</li>
            <li>Request deletion of your data</li>
            <li>Withdraw consent at any time</li>
            <li>Export your data</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We retain your data for as long as your account is active or as needed to provide services.
            You can request deletion of your data at any time through the data deletion endpoint.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7. Instagram Platform Policy</h2>
          <p className="text-gray-700 mb-4">
            Our use of Instagram data is subject to Instagram's Platform Policy and Terms of Use.
            We comply with all Meta platform requirements regarding data usage and privacy.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:
          </p>
          <p className="text-gray-700 mb-4">
            Email: privacy@socialinbox.app
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9. Changes to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </div>
      </div>
    </div>
  );
}
