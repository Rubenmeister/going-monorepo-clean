import React, { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  Clock, 
  User, 
  Briefcase, 
  Map as MapIcon, 
  CreditCard 
} from 'lucide-react';
import { Input, Button, Badge } from '@going/shared-ui';

export default function MobilityDashboard() {
  const [activeTab, setActiveTab] = useState<'request' | 'active' | 'history'>('request');

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Mobility</h1>
          <p className="text-slate-500 text-sm">Corporate Transport & Logistics</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('request')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'request' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            New Request
          </button>
          <button 
            onClick={() => setActiveTab('active')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'active' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Active Trips <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">3</Badge>
          </button>
          <button 
             onClick={() => setActiveTab('history')}
             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Panel: Action Form */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
           {activeTab === 'request' && <RequestRideForm />}
           {activeTab === 'active' && <ActiveTripsList />}
        </div>

        {/* Right Panel: Map or Summary */}
        <div className="col-span-12 lg:col-span-8 bg-slate-200 rounded-xl overflow-hidden relative border border-slate-300 shadow-inner flex items-center justify-center">
           {/* Placeholder for Live Map */}
           <div className="text-center text-slate-500">
             <MapIcon size={48} className="mx-auto mb-2 opacity-20" />
             <p className="font-medium">Interactive Map Area</p>
             <p className="text-sm">Real-time fleet tracking will appear here</p>
           </div>
           
           {/* Floating KPI Cards (Overlay) */}
           <div className="absolute top-4 left-4 flex gap-4">
              <div className="bg-white/90 backdrop-blur shadow-lg rounded-lg p-3 w-40 border border-slate-200">
                <p className="text-[10px] uppercase text-slate-500 font-bold">Monthly Spend</p>
                <p className="text-lg font-bold text-slate-900">$1,240.50</p>
                <div className="w-full bg-slate-100 h-1 mt-2 rounded-full overflow-hidden">
                   <div className="bg-primary h-full w-[65%]"></div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur shadow-lg rounded-lg p-3 w-40 border border-slate-200">
                 <p className="text-[10px] uppercase text-slate-500 font-bold">Carbon Saved</p>
                 <p className="text-lg font-bold text-green-600">45 kg</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function RequestRideForm() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
         <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center">
           <CarIcon />
         </div>
         <div>
           <h3 className="font-bold text-slate-900">Book a Ride</h3>
           <p className="text-xs text-slate-500">Executive Transport Service</p>
         </div>
      </div>

      <div className="space-y-4">
        {/* Passenger Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-lg">
           <button className="text-xs font-medium py-1.5 bg-white shadow-sm rounded text-slate-800 text-center">For Me</button>
           <button className="text-xs font-medium py-1.5 text-slate-500 hover:text-slate-700 text-center">For Guest</button>
        </div>

        {/* Locations */}
        <div className="space-y-3 relative">
           <div className="absolute left-3 top-3 bottom-9 w-0.5 bg-slate-200 z-0"></div>
           <div className="relative z-10">
             <label className="text-xs font-medium text-slate-600 mb-1 block">Pickup</label>
             <div className="relative">
               <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" />
               <Input className="pl-9 bg-slate-50 border-slate-200" placeholder="Where from?" />
             </div>
           </div>
           <div className="relative z-10">
             <label className="text-xs font-medium text-slate-600 mb-1 block">Dropoff</label>
             <div className="relative">
               <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" />
               <Input className="pl-9 bg-slate-50 border-slate-200" placeholder="Where to?" />
             </div>
           </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="text-xs font-medium text-slate-600 mb-1 block">Date</label>
             <div className="relative">
               <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <Input type="date" className="pl-9 bg-slate-50 border-slate-200" />
             </div>
           </div>
           <div>
             <label className="text-xs font-medium text-slate-600 mb-1 block">Time</label>
             <Input type="time" className="bg-slate-50 border-slate-200" />
           </div>
        </div>

        {/* Corporate Fields */}
        <div className="border-t border-slate-100 pt-4 space-y-4">
           <div>
             <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
               <Briefcase size={12} /> Cost Center / Project
             </label>
             <select className="w-full h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
               <option>Select Cost Center...</option>
               <option>Marketing (MKT-001)</option>
               <option>Sales (SLS-202)</option>
               <option>General Admin (G-100)</option>
             </select>
           </div>
           
           <div>
             <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
               <CreditCard size={12} /> Payment Method
             </label>
             <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-bold">VISA</span> Ended in 4242 (Corporate)
             </div>
           </div>
        </div>

        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 text-lg mt-4 shadow-xl shadow-blue-900/10">
           Request Ride
        </Button>

        <p className="text-[10px] text-center text-slate-400">
           By booking you agree to corporate travel policy #2024-B.
        </p>

      </div>
    </div>
  )
}

function ActiveTripsList() {
  return (
    <div className="space-y-3">
       {[1,2,3].map(i => (
         <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
           <div className="flex justify-between items-start mb-2">
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-100">In Progress</Badge>
              <span className="text-xs text-slate-400 font-mono">TRIP-{1000+i}</span>
           </div>
           <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg">👷</div>
              <div>
                <p className="text-sm font-bold text-slate-900">Jorge M.</p>
                <p className="text-xs text-slate-500">Toyota Fortuner</p>
              </div>
           </div>
           <div className="relative pl-4 space-y-1">
              <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <div className="absolute left-0.5 top-3 bottom-2 w-0.5 bg-slate-200"></div>
              <div className="absolute left-0 bottom-1.5 w-1.5 h-1.5 rounded-full bg-red-500"></div>
              
              <p className="text-xs text-slate-600 truncate">Hotel Oro Verde</p>
              <p className="text-xs text-slate-600 truncate">Aeropuerto Mariscal Sucre</p>
           </div>
         </div>
       ))}
    </div>
  )
}

function CarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M2 12h12"/></svg>
  )
}
