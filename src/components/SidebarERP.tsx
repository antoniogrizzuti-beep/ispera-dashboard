'use client';

import React, { useState } from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  Factory, 
  StickyNote, 
  Building2,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Hospital,
  Menu,
  X
} from 'lucide-react';

export type TabType = 'SERVICE' | 'MOD' | 'FIUME_SANTO' | 'CARBOTERMO' | 'PRODUZIONE' | 'PROMEMORIA';

interface SidebarERPProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function SidebarERP({ activeTab, setActiveTab }: SidebarERPProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'SERVICE', label: 'Service / Contratti', icon: Wrench },
    { id: 'MOD', label: 'Modernizzazioni (MOD)', icon: ShieldCheck },
    { id: 'FIUME_SANTO', label: 'Fiume Santo', icon: Building2 },
    { id: 'CARBOTERMO', label: 'Carbotermo', icon: Hospital },
    { id: 'PRODUZIONE', label: 'Produzione / WON', icon: Factory },
    { id: 'PROMEMORIA', label: 'Attività & Note', icon: StickyNote },
  ];

  const content = (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Header Logo */}
        <div className="h-16 bg-slate-900 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-extrabold text-white text-xs shadow-md">
              IS
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className="font-bold text-base text-white tracking-wide truncate">
                Ispera ERP
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Voci */}
        <div className="p-3 space-y-1">
          {(!isCollapsed || isMobileOpen) && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">
              Gestione Commesse
            </span>
          )}

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center ${
                    isCollapsed && !isMobileOpen ? 'justify-center px-2' : 'px-3.5'
                  } py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {(!isCollapsed || isMobileOpen) && <span className="ml-3 truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-slate-800 space-y-1 text-xs text-slate-400">
        <button className={`w-full flex items-center ${isCollapsed && !isMobileOpen ? 'justify-center' : 'px-3'} py-2 hover:text-white transition-colors`}>
          <Settings className="w-4 h-4 shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span className="ml-3 truncate">Impostazioni</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Tasto Menu visibile solo su Tablet/Mobile */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2.5 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex flex-col bg-slate-900 text-slate-200 min-h-screen shrink-0 border-r border-slate-800 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        {content}
      </aside>

      {/* Sidebar Off-canvas per iPad / Mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative w-72 bg-slate-900 text-slate-200 h-full shadow-2xl z-10">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}