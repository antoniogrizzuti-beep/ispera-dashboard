'use client';

import React, { useState } from 'react';
import SidebarERP from '@/components/SidebarERP';
import CalendarPanelERP from '@/components/CalendarPanelERP';
import QuickNotesView from '@/components/QuickNotesView';
import KanbanBoard from '@/components/KanbanBoard';
import { Search, Bell, User } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'SERVICE' | 'MOD' | 'FIUME_SANTO' | 'CARBOTERMO' | 'PRODUZIONE' | 'PROMEMORIA'>('SERVICE');

  return (
    <div className="flex min-h-screen bg-[#F0F2F5] text-[#1A202C] font-sans">
      {/* Sidebar ERP Sinistra */}
      <SidebarERP activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Contenuto Centrale */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header Blu ERP */}
        <header className="h-14 bg-[#2B6CB0] text-white px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-300" />
              <input
                type="text"
                placeholder="Cerca cliente, impianto, contratto..."
                className="w-full bg-[#245992] text-white placeholder-slate-300 text-xs rounded pl-9 pr-4 py-1.5 focus:outline-none focus:bg-[#1E4A7A] border border-[#3B7DC4]"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2 bg-[#245992] px-3 py-1 rounded border border-[#3B7DC4]">
              <User className="w-4 h-4 text-slate-200" />
              <span>Antonio (Ispera Srl)</span>
            </div>
            <Bell className="w-4 h-4 text-slate-200 cursor-pointer hover:text-white" />
          </div>
        </header>

        {/* Tab di Navigazione Secondari tipo ERP */}
        <div className="bg-white border-b border-[#D9DDE3] px-6 py-2 flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-[#718096]">
          <span className="text-[#2B6CB0] border-b-2 border-[#2B6CB0] pb-2 pt-1">
            {activeTab}
          </span>
        </div>

        {/* Area Principale */}
        <section className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'PROMEMORIA' && <QuickNotesView />}

          {(activeTab === 'SERVICE' || activeTab === 'MOD' || activeTab === 'FIUME_SANTO' || activeTab === 'CARBOTERMO') && (
            <KanbanBoard department={activeTab} />
          )}

          {activeTab === 'PRODUZIONE' && (
            <div className="bg-white p-8 rounded border border-[#D9DDE3] text-center text-[#718096] space-y-2">
              <p className="text-base font-bold text-[#1A202C]">File Produzione ERP</p>
              <p className="text-xs">In questa sezione figurano le commesse contrassegnate come WON / Firmato.</p>
            </div>
          )}
        </section>
      </main>

      {/* Pannello Agenda ERP Destra */}
      <CalendarPanelERP />
    </div>
  );
}