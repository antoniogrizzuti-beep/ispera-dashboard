'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, CheckCircle2, StickyNote } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface QuickNote {
  id: string;
  content: string;
  is_converted_to_event: boolean;
  scheduled_at?: string;
  created_at: string;
}

export default function QuickNotesView() {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('quick_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const { error } = await supabase
      .from('quick_notes')
      .insert([{ content: newNoteContent }]);

    if (!error) {
      setNewNoteContent('');
      fetchNotes();
    }
  };

  const handleConvertToEvent = async (note: QuickNote) => {
    const eventTime = prompt("Inserisci l'orario per l'appuntamento di oggi (es. 15:30):", '10:00');
    if (!eventTime) return;

    const [hours, minutes] = eventTime.split(':');
    const scheduledDate = new Date();
    scheduledDate.setHours(parseInt(hours || '10', 10), parseInt(minutes || '0', 10), 0, 0);

    const { error: eventErr } = await supabase.from('schedule_events').insert([
      {
        title: note.content,
        start_time: scheduledDate.toISOString(),
        quick_note_id: note.id,
      },
    ]);

    if (!eventErr) {
      await supabase
        .from('quick_notes')
        .update({
          is_converted_to_event: true,
          scheduled_at: scheduledDate.toISOString(),
        })
        .eq('id', note.id);

      fetchNotes();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <form onSubmit={handleCreateNote} className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E2DDD5] shadow-sm flex gap-3">
        <input
          type="text"
          placeholder="Scrivi una nota veloce o un promemoria..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          className="flex-1 bg-white border border-[#E2DDD5] text-[#332F2E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#B96B58]"
        />
        <button
          type="submit"
          className="bg-[#B96B58] hover:bg-[#A35948] text-white px-5 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Aggiungi Nota
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all shadow-xs ${
              note.is_converted_to_event
                ? 'bg-[#EFECE6]/60 border-[#E2DDD5] opacity-60'
                : 'bg-[#FAF8F5] border-[#E2DDD5] hover:border-[#B96B58]/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <StickyNote className="w-5 h-5 text-[#E1A745] shrink-0 mt-0.5" />
              <p className="text-sm text-[#332F2E] font-medium leading-relaxed">{note.content}</p>
            </div>

            <div className="pt-3 border-t border-[#E2DDD5] flex items-center justify-between text-xs text-[#726A66]">
              {note.is_converted_to_event ? (
                <span className="flex items-center gap-1.5 text-[#8B9A74] font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Inserito in Schedule
                </span>
              ) : (
                <button
                  onClick={() => handleConvertToEvent(note)}
                  className="flex items-center gap-1.5 text-[#B96B58] hover:text-[#A35948] font-semibold bg-[#B96B58]/10 px-2.5 py-1.5 rounded-xl border border-[#B96B58]/20 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" /> Pianifica in Cal
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}