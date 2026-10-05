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
  Hospital
} from 'lucide-react';

export type TabType = 'SERVICE' | 'MOD' | 'FIUME_SANTO' | 'CARBOTERMO' | 'PRODUZIONE' | 'PROMEMORIA';

interface SidebarERPProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function SidebarERP({ activeTab, setActiveTab }: SidebarERPProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'SERVICE', label: 'Service / Contratti', icon: Wrench },
    { id: 'MOD', label: 'Modernizzazioni (MOD)', icon: ShieldCheck },
    { id: 'FIUME_SANTO', label: 'Fiume Santo', icon: Building2 },
    { id: 'CARBOTERMO', label: 'Carbotermo', icon: Hospital },
    { id: 'PRODUZIONE', label: 'Produzione / WON', icon: Factory },
    { id: 'PROMEMORIA', label: 'Attività & Note', icon: StickyNote },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-60'
      } bg-[#2D3748] text-slate-200 flex flex-col min-h-screen shrink-0 border-r border-[#1A202C] transition-all duration-200 ease-in-out`}
    >
      {/* Header Logo + Pulsante Contrazione */}
      <div className="h-14 bg-[#1A202C] px-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 bg-[#2B6CB0] rounded flex items-center justify-center font-bold text-white text-xs shrink-0">
            IS
          </div>
          {!isCollapsed && (
            <span className="font-bold text-sm text-white tracking-wide uppercase truncate">
              Ispera ERP
            </span>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          title={isCollapsed ? 'Espandi Sidebar' : 'Riduci Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Menu Voci */}
      <div className="p-2 space-y-1">
        {!isCollapsed && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2 transition-opacity">
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
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2' : 'px-3'
                } py-2 text-xs font-semibold rounded transition-colors ${
                  isActive
                    ? 'bg-[#2B6CB0] text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="ml-2.5 truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info / Impostazioni */}
      <div className="mt-auto p-2 border-t border-slate-700 space-y-1 text-[11px] text-slate-400">
        <button
          title={isCollapsed ? 'Impostazioni' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'px-3'
          } py-1.5 hover:text-white transition-colors`}
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span className="ml-2.5 truncate">Impostazioni</span>}
        </button>

        <button
          title={isCollapsed ? 'Assistenza' : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-2' : 'px-3'
          } py-1.5 hover:text-white transition-colors`}
        >
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span className="ml-2.5 truncate">Assistenza</span>}
        </button>
      </div>
    </aside>
  );
}