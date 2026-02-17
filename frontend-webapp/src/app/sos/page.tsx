export default function SOSPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-4xl font-bold text-going-danger mb-2">
            Emergency Assistance
          </h1>
          <p className="text-gray-600 text-lg">
            Available 24/7 for all Going users
          </p>
        </div>

        {/* Emergency Contact */}
        <div className="bg-going-danger text-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            Need Immediate Help?
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">📞</div>
              <div>
                <p className="text-sm opacity-90">Call our emergency line</p>
                <p className="text-3xl font-bold">+593 99 8765 4321</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-3xl">💬</div>
              <div>
                <p className="text-sm opacity-90">WhatsApp emergency support</p>
                <p className="text-3xl font-bold">+593 99 8765 4321</p>
              </div>
            </div>
          </div>
        </div>

        {/* SOS Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              🚗 Transport Emergency
            </h3>
            <p className="text-gray-600 mb-4">
              Experiencing issues with your ride? Our support team is ready to help immediately.
            </p>
            <button className="w-full px-4 py-2 bg-going-danger text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
              Request Emergency Support
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              🏥 Medical Emergency
            </h3>
            <p className="text-gray-600 mb-4">
              In case of medical emergency, we can connect you with emergency services.
            </p>
            <button className="w-full px-4 py-2 bg-going-danger text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
              Call Emergency Services
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              📍 Lost Item Report
            </h3>
            <p className="text-gray-600 mb-4">
              Lost something during your trip? We'll help you locate it.
            </p>
            <button className="w-full px-4 py-2 border border-going-primary text-going-primary rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Report Lost Item
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              💳 Payment Issue
            </h3>
            <p className="text-gray-600 mb-4">
              Having trouble with a transaction? We're here to resolve it.
            </p>
            <button className="w-full px-4 py-2 border border-going-primary text-going-primary rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Report Payment Issue
            </button>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-going-primary mb-6">
            Safety Tips
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-going-primary font-bold mr-3 mt-1">✓</span>
              <span className="text-gray-700">
                Always verify the driver's identity before getting in the vehicle
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-going-primary font-bold mr-3 mt-1">✓</span>
              <span className="text-gray-700">
                Share your trip details with a trusted contact
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-going-primary font-bold mr-3 mt-1">✓</span>
              <span className="text-gray-700">
                Keep your valuables secure and out of sight
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-going-primary font-bold mr-3 mt-1">✓</span>
              <span className="text-gray-700">
                Report any safety concerns immediately
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-going-primary font-bold mr-3 mt-1">✓</span>
              <span className="text-gray-700">
                Use well-lit, populated areas when waiting for pickup
              </span>
            </li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer">
              <summary className="font-semibold text-gray-800 hover:text-going-primary">
                What should I do if I feel unsafe during a trip?
              </summary>
              <p className="text-gray-600 mt-3">
                Immediately request the driver to stop in a safe, public location. You can then exit the vehicle and contact our emergency line or local authorities.
              </p>
            </details>

            <details className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer">
              <summary className="font-semibold text-gray-800 hover:text-going-primary">
                How long does it take to get emergency assistance?
              </summary>
              <p className="text-gray-600 mt-3">
                Our emergency response team is available 24/7 and aims to respond within 5 minutes of your emergency call or message.
              </p>
            </details>

            <details className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer">
              <summary className="font-semibold text-gray-800 hover:text-going-primary">
                Is there a cost for emergency services?
              </summary>
              <p className="text-gray-600 mt-3">
                Basic emergency assistance is free for all Going users. Additional services may apply depending on the nature of the emergency.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
