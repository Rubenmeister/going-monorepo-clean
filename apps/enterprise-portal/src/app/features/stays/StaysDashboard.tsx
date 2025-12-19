import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  Wifi, 
  Briefcase,
} from 'lucide-react';
import { Input, Button, Badge } from '@going/shared-ui';

export default function StaysDashboard() {
  const [activeTab, setActiveTab] = useState<'search' | 'bookings' | 'saved'>('search');

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Corporate Stays</h1>
          <p className="text-slate-500 text-sm">Business-Ready Apartments & Hotels</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('search')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'search' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Find Stays
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'bookings' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Bookings
          </button>
        </div>
      </div>

      {/* Search Bar (Hero) */}
      {activeTab === 'search' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-12 gap-4 items-end">
           <div className="col-span-12 md:col-span-4">
             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">City or Hotel</label>
             <div className="relative">
               <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" size={18} />
               <Input className="pl-10 bg-slate-50 border-slate-200" placeholder="e.g. Quito, Guayaquil..." />
             </div>
           </div>
           
           <div className="col-span-12 md:col-span-3">
             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Dates</label>
             <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <Input className="pl-10 bg-slate-50 border-slate-200" placeholder="Check-in - Check-out" />
             </div>
           </div>

           <div className="col-span-12 md:col-span-3">
             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Guests</label>
             <div className="relative">
               <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <select className="w-full h-10 pl-10 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                 <option>1 Employee</option>
                 <option>2 Employees</option>
                 <option>Team (3+)</option>
               </select>
             </div>
           </div>

           <div className="col-span-12 md:col-span-2">
             <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg shadow-purple-900/10">
               Search
             </Button>
           </div>
        </div>
      )}

      {/* Featured Listings */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        <div className="flex items-center justify-between mb-4">
           <h3 className="font-bold text-slate-800">Going Certified Collection</h3>
           <div className="flex gap-2">
             <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
               <Wifi size={12} className="mr-1" /> High-Speed Wifi
             </Badge>
             <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
               <Briefcase size={12} className="mr-1" /> Work Desk
             </Badge>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Listing Card 1 */}
           <ListingCard 
             image="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop"
             title="Swiss Towers Executive Suite"
             location="La Gonzalez Suarez, Quito"
             price="$85"
             rating="4.9"
             tags={['Coworking', 'Gym', 'Breakfast']}
           />
           {/* Listing Card 2 */}
           <ListingCard 
             image="https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=2070&auto=format&fit=crop"
             title="The Point Riverfront Loft"
             location="Puerto Santa Ana, Guayaquil"
             price="$110"
             rating="4.8"
             tags={['Pool', 'Meeting Room', 'View']}
           />
           {/* Listing Card 3 */}
           <ListingCard 
             image="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop"
             title="Cumbayá Garden House"
             location="Cumbayá, Quito"
             price="$150"
             rating="5.0"
             tags={['Garden', 'Quiet', 'Parking']}
           />
        </div>
      </div>
    </div>
  );
}

function ListingCard({ image, title, location, price, rating, tags }: any) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group">
      <div className="h-48 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-slate-800 flex items-center gap-1">
           <Briefcase size={12} className="text-purple-600" /> Business Ready
        </div>
      </div>
      <div className="p-4">
         <div className="flex justify-between items-start mb-1">
            <h4 className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{title}</h4>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
              <Star size={12} className="fill-yellow-400 text-yellow-400" /> {rating}
            </div>
         </div>
         <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
           <MapPin size={12} /> {location}
         </p>
         
         <div className="flex flex-wrap gap-1 mb-4">
           {tags.map((t: string) => (
             <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{t}</span>
           ))}
         </div>

         <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <div>
              <span className="text-lg font-bold text-slate-900">{price}</span>
              <span className="text-xs text-slate-500">/night</span>
            </div>
            <Button size="sm" className="bg-slate-900 text-white hover:bg-purple-600 transition-colors">
              Book Now
            </Button>
         </div>
      </div>
    </div>
  )
}
