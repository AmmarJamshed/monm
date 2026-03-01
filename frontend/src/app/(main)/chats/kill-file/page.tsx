'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conversations, media } from '@/lib/api';

function getFileLabel(mime: string): string {
  if (!mime) return 'File';
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('xls')) return 'Excel';
  if (mime.includes('word') || mime.includes('document')) return 'Word';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.startsWith('image/')) return 'Image';
  if (mime.includes('video')) return 'Video';
  return 'File';
}

export default function KillFilePage() {
  const router = useRouter();
  const [step, setStep] = useState<'conversations' | 'files'>('conversations');
  const [convList, setConvList] = useState<Array<{ id: string; type: string; participants: { id: string; name: string }[] }>>([]);
  const [selectedConv, setSelectedConv] = useState<{ id: string; name: string } | null>(null);
  const [files, setFiles] = useState<Array<{ id: string; mime_type: string; kill_switch_active: boolean; message_id: string; created_at: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [killing, setKilling] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('monm_token');
    const u = localStorage.getItem('monm_user');
    if (!t || !u) {
      router.replace('/');
      return;
    }
    conversations.list()
      .then(setConvList)
      .catch(() => router.replace('/chats'));
  }, [router]);

  const handleSelectConversation = async (id: string, name: string) => {
    setLoading(true);
    setSelectedConv({ id, name });
    try {
      const list = await media.listSharedInConversation(id);
      setFiles(list);
      setSelectedIds(new Set());
      setStep('files');
    } catch (e) {
      const err = e as Error & { cause?: unknown };
      const msg = err?.message || 'Could not load files. Try again.';
      let hint = '';
      if (/not found|Media not found|404|Failed to fetch|Failed to load|network/i.test(msg)) {
        hint = '\n\nCheck: 1) Render monm-api is deployed and running  2) Netlify NEXT_PUBLIC_API_URL points to your Render URL  3) CORS_ORIGINS on Render includes your Netlify URL';
      }
      console.error('[KillFile] listSharedInConversation failed:', msg, err);
      alert(msg + hint);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const killable = files.filter((f) => !f.kill_switch_active);
    if (selectedIds.size === killable.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(killable.map((f) => f.id)));
    }
  };

  const handleKill = async () => {
    if (selectedIds.size === 0) return;
    setKilling(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await media.activateKillSwitch(id);
      }
      setFiles((prev) =>
        prev.map((f) => (selectedIds.has(f.id) ? { ...f, kill_switch_active: true } : f))
      );
      setSelectedIds(new Set());
      alert(`${selectedIds.size} file(s) disabled. They will no longer be viewable.`);
    } catch (e) {
      alert((e as Error).message || 'Failed to activate kill switch');
    } finally {
      setKilling(false);
    }
  };

  const killableCount = files.filter((f) => !f.kill_switch_active).length;

  return (
    <div className="flex-1 flex flex-col">
      <header className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--inbox-border)' }}>
        <button onClick={() => (step === 'files' ? setStep('conversations') : router.back())} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 font-bold">
          ←
        </button>
        <h1 className="flex-1 font-semibold" style={{ color: 'var(--inbox-text)' }}>
          {step === 'conversations' ? 'Kill shared file' : `Files in chat with ${selectedConv?.name ?? ''}`}
        </h1>
      </header>
      <main className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-slate-500 animate-pulse">Loading…</p>
          </div>
        ) : step === 'conversations' ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600 mb-4">Choose a conversation to see files you shared:</p>
            {convList.length === 0 ? (
              <p className="text-slate-500">No conversations yet.</p>
            ) : (
              convList.map((c) => {
                const name = c.participants.map((p: { name: string }) => p.name).join(', ');
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConversation(c.id, name)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left hover:bg-slate-50 transition-colors"
                    style={{ borderColor: 'var(--inbox-border)', color: 'var(--inbox-text)' }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: 'var(--inbox-blue-bg)', color: 'var(--inbox-blue)' }}>
                      {(name || '?')[0]}
                    </div>
                    <span className="font-medium truncate">{name}</span>
                    <span className="ml-auto text-slate-400">→</span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {files.length === 0 ? (
              <div className="space-y-2">
                <p className="text-slate-500">No files shared by you in this conversation.</p>
                <p className="text-xs text-slate-400">Files you&apos;ve killed show &quot;(Killed)&quot; — they can no longer be viewed in the app. Protected downloads check the blockchain when opened and will show &quot;Content disabled&quot; if killed.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <button
                    onClick={selectAll}
                    className="text-sm font-medium"
                    style={{ color: 'var(--inbox-blue)' }}
                  >
                    {selectedIds.size === killableCount && killableCount > 0 ? 'Deselect all' : 'Select all'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleKill}
                      disabled={killing}
                      className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {killing ? 'Killing…' : `Kill ${selectedIds.size} selected`}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-2">Killed files can&apos;t be viewed in-app. Protected downloads (HTML) check the blockchain when opened and will show &quot;Content disabled&quot; if killed.</p>
                <ul className="space-y-2">
                  {files.map((f) => (
                    <li
                      key={f.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                        f.kill_switch_active ? 'opacity-60 bg-slate-50' : 'hover:bg-slate-50'
                      }`}
                      style={{ borderColor: 'var(--inbox-border)' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(f.id)}
                        onChange={() => !f.kill_switch_active && toggleSelect(f.id)}
                        disabled={f.kill_switch_active}
                        className="rounded"
                      />
                      <span className="text-lg">
                        {f.mime_type?.includes('spreadsheet') || f.mime_type?.includes('excel') ? '📊' : f.mime_type?.startsWith('image/') ? '🖼️' : '📎'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium" style={{ color: 'var(--inbox-text)' }}>
                          {getFileLabel(f.mime_type)}
                          {f.kill_switch_active && (
                            <span className="ml-2 text-xs text-red-600 font-normal">(Killed)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">{new Date(f.created_at).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
