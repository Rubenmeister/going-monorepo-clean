import React, { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  Clock, 
  Package, 
  Truck, 
  Box, 
  FileText, 
  ShieldCheck, 
  Search,
  ArrowRight
} from 'lucide-react';
import { Input, Button, Badge } from '@going/shared-ui';

export default function LogisticsDashboard() {
  const [activeTab, setActiveTab] = useState<'send' | 'track' | 'history'>('send');

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Logistics</h1>
          <p className="text-slate-500 text-sm">Ship Documents, Packages & Cargo</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('send')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'send' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            New Shipment
          </button>
          <button 
            onClick={() => setActiveTab('track')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'track' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Track <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">12</Badge>
          </button>
          <button 
             onClick={() => setActiveTab('history')}
             className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Manifests
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* Left Panel: Form or List */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
           {activeTab === 'send' && <ShipmentForm />}
           {activeTab === 'track' && <TrackingList />}
        </div>

        {/* Right Panel: Map or Summary */}
        <div className="col-span-12 lg:col-span-8 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
           {/* Placeholder map bg */}
           <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/-78.48,0.15,12,0/800x600?access_token=PLACEHOLDER')] bg-cover opacity-50 grayscale" style={{ backgroundColor: '#e2e8f0' }}></div>
           
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="bg-white/90 backdrop-blur p-6 rounded-xl shadow-xl text-center border border-slate-200 max-w-sm">
               <Truck size={48} className="mx-auto mb-4 text-orange-500" />
               <h3 className="font-bold text-slate-800 text-lg">Live Fleet Tracking</h3>
               <p className="text-slate-500 text-sm mt-1">
                 You have <b>12 active shipments</b>. <br/>
                 3 are approaching delivery.
               </p>
               <Button variant="outline" className="mt-4 border-orange-200 text-orange-700 hover:bg-orange-50 w-full">
                 View Full Map
               </Button>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function ShipmentForm() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
         <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
           <Package size={20} />
         </div>
         <div>
           <h3 className="font-bold text-slate-900">Create Shipment</h3>
           <p className="text-xs text-slate-500">Same-day Delivery & Cargo</p>
         </div>
      </div>

      <div className="space-y-4">
        {/* Package Type */}
        <div className="grid grid-cols-3 gap-2">
           <button className="flex flex-col items-center justify-center gap-1 p-2 border-2 border-orange-500 bg-orange-50 rounded-lg">
             <FileText size={18} className="text-orange-600" />
             <span className="text-[10px] font-bold text-orange-700">Document</span>
           </button>
           <button className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700">
             <Box size={18} />
             <span className="text-[10px] font-medium">Box</span>
           </button>
           <button className="flex flex-col items-center justify-center gap-1 p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700">
             <Truck size={18} />
             <span className="text-[10px] font-medium">Cargo</span>
           </button>
        </div>

        {/* Route */}
        <div className="space-y-3 relative p-4 bg-slate-50 rounded-lg border border-slate-100">
           <div className="relative">
             <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Origin (Pickup)</label>
             <p className="text-sm font-medium text-slate-900">Oficinas Centrales (HQ)</p>
             <p className="text-xs text-slate-500">Av. Shyris y Suecia</p>
           </div>
           
           <div className="flex items-center justify-center">
             <ArrowRight className="text-slate-300 rotate-90 my-1" size={16} />
           </div>

           <div className="relative">
             <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Destination</label>
             <Input className="bg-white border-slate-200" placeholder="Search address or branch..." />
           </div>
        </div>

         {/* Recipient */}
         <div>
             <label className="text-xs font-medium text-slate-600 mb-1 block">Recipient Name</label>
             <Input className="bg-white border-slate-200" placeholder="Who receives it?" />
         </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="text-xs font-medium text-slate-600 mb-1 block">Weight (kg)</label>
             <Input type="number" className="bg-white border-slate-200" placeholder="0.0" />
           </div>
           <div>
             <label className="text-xs font-medium text-slate-600 mb-1 block">Declared Value</label>
             <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <Input type="number" className="pl-6 bg-white border-slate-200" placeholder="0.00" />
             </div>
           </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
           <ShieldCheck size={16} />
           <span className="text-xs font-medium">Insurance included up to $500</span>
        </div>

        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-6 text-lg mt-4 shadow-xl shadow-orange-900/10">
           Request Pickup
        </Button>
      </div>
    </div>
  )
}

function TrackingList() {
  return (
    <div className="space-y-3">
       <div className="relative mb-4">
         <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
         <Input className="pl-9 bg-white border-slate-200" placeholder="Search tracking number..." />
       </div>

       {[1,2,3,4].map(i => (
         <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-orange-300 transition-colors cursor-pointer group">
           <div className="flex justify-between items-start mb-2">
              <Badge variant="outline" className={`text-xs ${i === 1 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-slate-50 text-slate-600'}`}>
                {i === 1 ? 'Out for Delivery' : 'In Transit'}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">PKG-882{i}</span>
           </div>
           <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-lg">📄</div>
              <div>
                <p className="text-sm font-bold text-slate-900">Legal Contracts</p>
                <p className="text-xs text-slate-500">To: Banco Pichincha</p>
              </div>
           </div>
           <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
             <div className="bg-orange-500 h-full" style={{ width: i === 1 ? '90%' : '45%' }}></div>
           </div>
         </div>
       ))}
    </div>
  )
}
