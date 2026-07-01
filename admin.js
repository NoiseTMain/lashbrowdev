/* ============================================================
   ANDREA LEITNEROVÁ — admin.js
   Real authentication via Supabase Auth (not a hardcoded JS
   password) — see README.md for how to create the admin
   account and the required "inquiries" table + RLS policies.
   ============================================================ */

const SUPABASE_URL = 'https://lytpplqapgqonlelgnyp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHBwbHFhcGdxb25sZWxnbnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTc3NzEsImV4cCI6MjA5MTMzMzc3MX0.YxytUSLEwXAqbCVfJX5HaOSKy9_v_Chknu_s6mOZ-XE';

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginBtn = document.getElementById('loginBtn');

let accessToken = sessionStorage.getItem('al_admin_token');
let currentFilter = 'all';
let allInquiries = [];

/* ---------- Auth ---------- */
async function login(email, password){
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('invalid credentials');
  const data = await res.json();
  return data.access_token;
}

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginError.classList.remove('show');
  const original = loginBtn.innerHTML;
  loginBtn.innerHTML = '<span class="btn-line">Přihlašuji…</span>';
  try{
    const token = await login(
      document.getElementById('loginEmail').value.trim(),
      document.getElementById('loginPass').value
    );
    accessToken = token;
    sessionStorage.setItem('al_admin_token', token);
    showDashboard();
  }catch(err){
    loginError.classList.add('show');
  }finally{
    loginBtn.innerHTML = original;
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('al_admin_token');
  accessToken = null;
  dashboard.classList.remove('show');
  loginScreen.style.display = 'flex';
});

function showDashboard(){
  loginScreen.style.display = 'none';
  dashboard.classList.add('show');
  fetchInquiries();
}

if (accessToken) showDashboard();

/* ---------- Inquiries ---------- */
async function fetchInquiries(){
  const list = document.getElementById('inquiryList');
  const empty = document.getElementById('emptyState');
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries?select=*&order=created_at.desc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` }
    });
    if (res.status === 401) { sessionStorage.removeItem('al_admin_token'); location.reload(); return; }
    if (!res.ok) throw new Error('fetch failed');
    allInquiries = await res.json();
    renderInquiries();
  }catch(err){
    list.innerHTML = '';
    empty.style.display = 'block';
    empty.innerHTML = `<h3>Poptávky se nepodařilo načíst</h3>
      <p>Zkontrolujte, že v Supabase existuje tabulka <strong>inquiries</strong> se správnými RLS pravidly (viz README.md v tomto balíčku).</p>`;
  }
}

function renderInquiries(){
  const list = document.getElementById('inquiryList');
  const empty = document.getElementById('emptyState');
  const filtered = currentFilter === 'all' ? allInquiries : allInquiries.filter(i => (i.status || 'new') === currentFilter);

  document.getElementById('statTotal').textContent = allInquiries.length;
  document.getElementById('statNew').textContent = allInquiries.filter(i => (i.status || 'new') === 'new').length;
  document.getElementById('statDone').textContent = allInquiries.filter(i => i.status === 'done').length;

  list.innerHTML = '';
  if (filtered.length === 0) {
    empty.style.display = 'block';
    empty.innerHTML = `<h3>Zatím žádné poptávky</h3><p>Jakmile klientka odešle poptávku z webu, objeví se tady.</p>`;
    return;
  }
  empty.style.display = 'none';

  filtered.forEach(iq => {
    const status = iq.status || 'new';
    const created = iq.created_at ? new Date(iq.created_at).toLocaleString('cs-CZ', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
    const preferred = [iq.preferred_date, iq.preferred_time].filter(Boolean).join(' ');

    const card = document.createElement('div');
    card.className = 'inquiry-card';
    card.innerHTML = `
      <div>
        <div class="iq-name">${escapeHtml(iq.name || 'Bez jména')}</div>
        <div class="iq-meta">
          <span>${escapeHtml(iq.service || 'Neuvedeno')}</span> · ${escapeHtml(iq.contact || '')}
          ${preferred ? ` · Preferuje: <span>${escapeHtml(preferred)}</span>` : ''}
        </div>
        ${iq.note ? `<div class="iq-note">${escapeHtml(iq.note)}</div>` : ''}
        <div class="iq-meta" style="margin-top:.8rem;opacity:.6;">Odesláno ${created}</div>
      </div>
      <div class="iq-actions">
        <span class="iq-badge ${status}">${status === 'done' ? 'Vyřízeno' : 'Nové'}</span>
        <button class="iq-btn" data-action="toggle" data-id="${iq.id}">${status === 'done' ? 'Označit jako nové' : 'Označit jako vyřízené'}</button>
        <button class="iq-btn danger" data-action="delete" data-id="${iq.id}">Smazat</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('[data-action="toggle"]').forEach(btn => btn.addEventListener('click', () => toggleStatus(btn.dataset.id)));
  list.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', () => deleteInquiry(btn.dataset.id)));
}

async function toggleStatus(id){
  const iq = allInquiries.find(i => i.id == id);
  if (!iq) return;
  const newStatus = (iq.status || 'new') === 'done' ? 'new' : 'done';
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries?id=eq.${id}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('update failed');
    iq.status = newStatus;
    renderInquiries();
  }catch(err){
    alert('Změnu se nepodařilo uložit.');
  }
}

async function deleteInquiry(id){
  if (!confirm('Opravdu smazat tuto poptávku?')) return;
  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/inquiries?id=eq.${id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error('delete failed');
    allInquiries = allInquiries.filter(i => i.id != id);
    renderInquiries();
  }catch(err){
    alert('Poptávku se nepodařilo smazat.');
  }
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderInquiries();
  });
});

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
