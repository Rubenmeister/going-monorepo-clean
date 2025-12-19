import React, { useState } from 'react';
import { 
  Ticket, 
  Users, 
  Music, 
  Utensils, 
  Palette, 
  Award,
  CalendarCheck
} from 'lucide-react';
import { Button, Badge } from '@going/shared-ui';

export default function ActivitiesDashboard() {
  const [activeTab, setActiveTab] = useState<'experiences' | 'my-tickets'>('experiences');

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">Local Activities</h1>
          <p className="text-slate-500 text-sm">Team Building, Workshops & Dinners</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('experiences')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'experiences' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Experiences
          </button>
          <button 
            onClick={() => setActiveTab('my-tickets')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'my-tickets' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Tickets
          </button>
        </div>
      </div>

      {/* Featured Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
           {/* Hero Card */}
           <div className="bg-slate-900 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-end min-h-[300px] border border-slate-700 group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2574&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity duration-700" />
              <div className="relative z-10">
                <Badge className="bg-pink-600 hover:bg-pink-700 text-white mb-3 border-none">Trending</Badge>
                <h2 className="text-3xl font-bold text-white mb-2 font-heading">Cocktail Making Masterclass</h2>
                <p className="text-slate-200 mb-6 max-w-md">Learn mixology basics with your team at La Mar. Includes 3 drinks and appetizers.</p>
                <Button className="bg-white text-slate-900 hover:bg-pink-50 hover:text-pink-600 font-bold">Reserve for Team</Button>
              </div>
           </div>

           {/* Side Cards */}
           <div className="grid grid-rows-2 gap-6">
              <ActivityRow 
                icon={Utensils} 
                title="Business Lunch at Zazu" 
                subtitle="Private room available · 12-3 PM"
                color="text-orange-500 bg-orange-50"
              />
              <ActivityRow 
                icon={Palette} 
                title="Paint & Wine Night" 
                subtitle="Creative stress relief · Thu 6 PM"
                color="text-purple-500 bg-purple-50"
              />
               <ActivityRow 
                icon={Music} 
                title="Jazz & Dinner" 
                subtitle="Live music at The Blue Note · Fri 8 PM"
                color="text-blue-500 bg-blue-50"
              />
           </div>
        </div>
        
        <h3 className="font-bold text-slate-800 mb-4">This Week Categories</h3>
        <div className="flex gap-4 overflow-x-auto pb-4">
           {['Food & Drink', 'Workshops', 'Wellness', 'Nightlife', 'Culture'].map(c => (
             <button key={c} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-pink-300 hover:text-pink-600 transition-all shadow-sm">
               {c}
             </button>
           ))}
        </div>

      </div>
    </div>
  );
}

function ActivityRow({ icon: Icon, title, subtitle, color }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:border-pink-300 transition-colors cursor-pointer shadow-sm">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-pink-600">
        <CalendarCheck size={20} />
      </Button>
    </div>
  )
}
