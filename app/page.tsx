"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              TicketDApp
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The premier NFT marketplace for event tickets on Solana. Mint, buy, and sell unique digital tickets with blockchain security and transparency.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/marketplace"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors shadow-lg"
            >
              <span className="mr-2">🛒</span>
              Browse Marketplace
            </Link>
            <Link
              href="/mint"
              className="inline-flex items-center px-8 py-4 bg-white text-gray-900 text-lg font-semibold rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all"
            >
              <span className="mr-2">✨</span>
              Mint NFT Ticket
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎟️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Mint Unique Tickets</h3>
            <p className="text-gray-600">
              Create one-of-a-kind NFT tickets for your events with custom metadata and artwork.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Trading</h3>
            <p className="text-gray-600">
              Buy and sell tickets with confidence using Solana's fast and secure blockchain.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Decentralized Ownership</h3>
            <p className="text-gray-600">
              True ownership of your tickets with blockchain verification and IPFS storage.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Platform Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">100+</div>
              <div className="text-sm text-gray-600">NFTs Minted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">0.1</div>
              <div className="text-sm text-gray-600">Avg Price (SOL)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Marketplace Open</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of users creating and trading NFT tickets on Solana.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/mint"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              <span className="mr-2">🚀</span>
              Start Minting
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span className="mr-2">🔍</span>
              Explore Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}