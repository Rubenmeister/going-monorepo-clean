import React, { useState } from 'react';
import { 
  Map, 
  Compass, 
  Users, 
  Calendar, 
  Sun, 
  TreePine, 
  Mountain,
  Tent,
  ArrowRight
} from 'lucide-react';
import { Button, Badge } from '@going/shared-ui';

export default function ToursDashboard() {
  const [activeTab, setActiveTab] = useState<'explore' | 'planned'>('explore');

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Corporate Retreats</h1>
          <p className="text-slate-500 text-sm">Team Offsites & Group Travel</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'explore' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Explore
          </button>
          <button 
            onClick={() => setActiveTab('planned')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'planned' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Planned Trips
          </button>
        </div>
      </div>

      {/* Hero / Categories */}
      <div className="grid grid-cols-4 gap-4">
         <CategoryCard icon={Mountain} label="Adventure" color="bg-green-100 text-green-700" />
         <CategoryCard icon={Sun} label="Wellness" color="bg-yellow-100 text-yellow-700" />
         <CategoryCard icon={Users} label="Team Building" color="bg-blue-100 text-blue-700" />
         <CategoryCard icon={Tent} label="Glamping" color="bg-orange-100 text-orange-700" />
      </div>

      {/* Packages */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
           <Compass size={20} className="text-green-600" /> Recommended for Q1
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <TourCard 
             image="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2673&auto=format&fit=crop"
             title="Cotopaxi Leadership Summit"
             duration="2 Days / 1 Night"
             price="$250 pp"
             tags={['Hiking', 'Strategy Session', 'All Inclusive']}
           />
           <TourCard 
             image="https://images.unsplash.com/photo-1544141634-b22f7783307b?q=80&w=2670&auto=format&fit=crop"
             title="Mindo Cloud Forest Retreat"
             duration="Full Day"
             price="$80 pp"
             tags={['Canopy', 'Chocolate Tour', 'Lunch']}
           />
           <TourCard 
             image="https://images.unsplash.com/photo-1540206395-688085723adb?q=80&w=2576&auto=format&fit=crop"
             title="Papallacta Spa & Relax"
             duration="Overnight"
             price="$180 pp"
             tags={['Thermal Pools', 'Massages', 'Transport']}
           />
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ icon: Icon, label, color }: any) {
  return (
    <div className={`p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-opacity-80 transition-all ${color} h-20`}>
       <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center">
         <Icon size={20} />
       </div>
       <span className="font-bold text-sm">{label}</span>
    </div>
  )
}

function TourCard({ image, title, duration, price, tags }: any) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg hover:border-green-300 transition-all cursor-pointer group px-0 pt-0">
      <div className="h-56 overflow-hidden relative">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-700 shadow-sm">
           {duration}
        </div>
      </div>
      <div className="p-5">
         <h4 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-green-700 transition-colors">{title}</h4>
         
         <div className="flex flex-wrap gap-2 mb-4">
           {tags.map((t: string) => (
             <span key={t} className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium">{t}</span>
           ))}
         </div>

         <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <div>
              <span className="text-sm font-bold text-slate-500">Starting at</span>
              <p className="text-xl font-bold text-slate-900">{price}</p>
            </div>
            <Button size="default" className="bg-slate-900 text-white hover:bg-green-600 transition-colors rounded-full px-6">
              Plan Trip <ArrowRight size={16} className="ml-2" />
            </Button>
         </div>
      </div>
    </div>
  )
}
