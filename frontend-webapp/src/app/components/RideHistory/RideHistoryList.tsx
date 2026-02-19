'use client'

import { useState, useEffect } from 'react'
import { rideService } from '../../services/rideService'

interface HistoryRide {
  id: string
  date: string
  pickup: string
  dropoff: string
  fare: number
  status: 'completed' | 'cancelled'
  driver?: { name: string; rating: number }
  rideType: string
  distance: number
  duration: number
}

function RideStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function RideHistoryItem({ ride }: { ride: HistoryRide }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      data-testid="ride-history-item"
      className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500">
              {new Date(ride.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <RideStatusBadge status={ride.status} />
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">
              {ride.rideType}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <p className="text-sm text-gray-800 truncate">{ride.pickup}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              <p className="text-sm text-gray-800 truncate">{ride.dropoff}</p>
            </div>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-lg font-bold text-gray-900">${ride.fare.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{ride.distance.toFixed(1)} km</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Duration</span>
              <p className="font-medium">{Math.round(ride.duration)} min</p>
            </div>
            {ride.driver && (
              <div>
                <span className="text-gray-500">Driver</span>
                <p className="font-medium">
                  {ride.driver.name}
                  <span className="text-yellow-500 ml-1">★ {ride.driver.rating}</span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button className="text-sm text-blue-600 hover:underline">View Receipt</button>
            {ride.status === 'completed' && (
              <button className="text-sm text-blue-600 hover:underline">Book Again</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Mock data for development
const MOCK_RIDES: HistoryRide[] = [
  {
    id: '1',
    date: new Date(Date.now() - 86400000).toISOString(),
    pickup: '350 5th Ave, New York, NY',
    dropoff: 'JFK International Airport',
    fare: 45.50,
    status: 'completed',
    driver: { name: 'Carlos M.', rating: 4.9 },
    rideType: 'premium',
    distance: 24.5,
    duration: 42,
  },
  {
    id: '2',
    date: new Date(Date.now() - 172800000).toISOString(),
    pickup: 'Central Park, New York, NY',
    dropoff: 'Brooklyn Bridge',
    fare: 18.75,
    status: 'completed',
    driver: { name: 'Ana G.', rating: 4.7 },
    rideType: 'economy',
    distance: 8.2,
    duration: 22,
  },
  {
    id: '3',
    date: new Date(Date.now() - 259200000).toISOString(),
    pickup: 'Times Square, New York, NY',
    dropoff: 'LaGuardia Airport',
    fare: 32.00,
    status: 'cancelled',
    rideType: 'comfort',
    distance: 15.0,
    duration: 35,
  },
]

export default function RideHistoryList() {
  const [rides, setRides] = useState<HistoryRide[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    async function loadRides() {
      setLoading(true)
      try {
        const data = await rideService.getRideHistory(page, 10)
        setRides(data.rides || [])
        setHasMore(data.hasMore || false)
      } catch {
        // Use mock data in development
        setRides(MOCK_RIDES)
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }
    loadRides()
  }, [page])

  const filtered = filter === 'all' ? rides : rides.filter((r) => r.status === filter)

  return (
    <div data-testid="ride-history" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Ride History</h2>
        <div className="flex gap-2">
          {(['all', 'completed', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">🚗</p>
          <p className="font-medium">No rides found</p>
          <p className="text-sm">Your ride history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ride) => (
            <RideHistoryItem key={ride.id} ride={ride} />
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Load more rides
        </button>
      )}
    </div>
  )
}
