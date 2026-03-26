'use client';

import { useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '@/lib/supabase';

interface UserProfile {
  display_name: string;
  age: number | null;
  life_situation: string;
  current_goals: string;
  biggest_challenges: string;
  relationship_status: string;
  career_stage: string;
}

const RELATIONSHIP_OPTIONS = ['Single', 'In a relationship', 'Married', 'Divorced', 'Separated', 'It\'s complicated', 'Prefer not to say'];
const CAREER_OPTIONS = ['Student', 'Early career', 'Mid-career', 'Senior/Executive', 'Entrepreneur', 'Career pivot', 'Freelancer', 'Between jobs', 'Retired'];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    display_name: '',
    age: null,
    life_situation: '',
    current_goals: '',
    biggest_challenges: '',
    relationship_status: '',
    career_stage: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (!user) { window.location.href = '/login'; return; }
      setUserId(user.id);

      const { data } = await supabase
        .from('users')
        .select('display_name, age, life_situation, current_goals, biggest_challenges, relationship_status, career_stage')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({
          display_name: data.display_name || user.user_metadata?.full_name || '',
          age: data.age,
          life_situation: data.life_situation || '',
          current_goals: data.current_goals || '',
          biggest_challenges: data.biggest_challenges || '',
          relationship_status: data.relationship_status || '',
          career_stage: data.career_stage || '',
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);

    await supabase.from('users').upsert({
      id: userId,
      ...profile,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: keyof UserProfile, value: string | number | null) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-navy text-ink">
      <nav className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gold rounded flex items-center justify-center text-ink font-bold text-sm" style={{ fontFamily: "'Lora', serif" }}>A</div>
          <span className="text-sm font-medium tracking-wide text-ink/80">THE ARCHITECT METHOD</span>
        </a>
        <a href="/" className="text-xs text-ink/40 hover:text-ink/70 transition-colors flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5m7 7-7-7 7-7"/></svg>
          Library
        </a>
      </nav>

      <div className="max-w-lg mx-auto px-6 pt-8 pb-24">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Lora', serif" }}>Your Profile</h1>
        <p className="text-sm text-ink/40 mb-8">The more the AI knows about you, the more relevant its insights become \u2014 across every book you read.</p>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Name</label>
            <input
              type="text"
              value={profile.display_name}
              onChange={e => update('display_name', e.target.value)}
              placeholder="What should we call you?"
              className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Age</label>
            <input
              type="number"
              value={profile.age || ''}
              onChange={e => update('age', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="28"
              min={13} max={120}
              className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors"
            />
          </div>

          {/* Career stage */}
          <div>
            <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Career stage</label>
            <div className="flex flex-wrap gap-2">
              {CAREER_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => update('career_stage', opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    profile.career_stage === opt
                      ? 'bg-gold/20 text-gold border border-gold/30'
                      : 'bg-ink/5 text-ink/50 border border-ink/10 hover:border-ink/20'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Relationship status */}
          <div>
            <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Relationship status</label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => update('relationship_status', opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    profile.relationship_status === opt
                      ? 'bg-gold/20 text-gold border border-gold/30'
                      : 'bg-ink/5 text-ink/50 border border-ink/10 hover:border-ink/20'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Life situation */}
          <div>
            <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Life situation</label>
            <textarea
              value={profile.life_situation}
              onChange={e => update('life_situation', e.target.value)}
              placeholder="A short description of where you are in life right now..."
              rows={3}
              className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors resize-none"
            />
          </div>

          {/* Current goals */}
          <div>
            <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Current goals</label>
            <textarea
              value={profile.current_goals}
              onChange={e => update('current_goals', e.target.value)}
              placeholder="What are you actively working toward right now?"
              rows={3}
              className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors resize-none"
            />
          </div>

          {/* Biggest challenges */}
          <div>
            <label className="block text-[11px] font-semibold text-ink/50 uppercase tracking-wider mb-1.5">Biggest challenges</label>
            <textarea
              value={profile.biggest_challenges}
              onChange={e => update('biggest_challenges', e.target.value)}
              placeholder="What keeps getting in your way?"
              rows={3}
              className="w-full bg-ink/5 border border-ink/10 rounded-xl px-4 py-3 text-sm text-ink/90 placeholder:text-ink/25 outline-none focus:border-gold/40 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Save */}
        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gold hover:bg-gold-light disabled:bg-ink/10 text-ink font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
          {saved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Saved
            </span>
          )}
        </div>

        <p className="text-[11px] text-ink/20 mt-4">Your profile is used only to personalize your reading experience. It is never shared.</p>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-24 border-t border-ink/10 pt-8 mt-8">
        <h2 className="text-xl font-bold mb-2 text-ink/90" style={{ fontFamily: "'Lora', serif" }}>Author Portal</h2>
        <p className="text-sm text-ink/40 mb-6">Are you a creator? Publish your own book, complete with an AI companion experience.</p>
        <a href="/author" className="inline-flex items-center gap-2 bg-ink/5 hover:bg-ink/10 text-white font-medium px-5 py-2.5 rounded-lg border border-ink/10 transition-colors text-sm">
          Publish Your Book
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </main>
  );
}
