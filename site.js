/* ============================================================
   ANDREA LEITNEROVÁ — site.js
   ============================================================ */

/* ---------- Supabase config (shared across site + admin) ---------- */
const SUPABASE_URL = 'https://lytpplqapgqonlelgnyp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5dHBwbHFhcGdxb25sZWxnbnlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NTc3NzEsImV4cCI6MjA5MTMzMzc3MX0.YxytUSLEwXAqbCVfJX5HaOSKy9_v_Chknu_s6mOZ-XE';

gsap.registerPlugin(ScrollTrigger);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Nav ---------- */
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
  let current = '';
  sections.forEach(s => { if (scrollY >= s.offsetTop - s.clientHeight / 3) current = s.id; });
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}, { passive: true });

/* ---------- Mobile menu ---------- */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => { burger.classList.toggle('active'); mobileMenu.classList.toggle('active'); });
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { burger.classList.remove('active'); mobileMenu.classList.remove('active'); }));

/* ---------- Hidden admin entry: click the logo 5x ---------- */
let logoClicks = 0;
let logoClickTimer = null;
const adminEntry = document.getElementById('adminEntry');
document.getElementById('logoTrigger').addEventListener('click', () => {
  logoClicks++;
  clearTimeout(logoClickTimer);
  logoClickTimer = setTimeout(() => { logoClicks = 0; }, 2000);
  if (logoClicks >= 5) {
    adminEntry.classList.add('show');
    logoClicks = 0;
  }
});
adminEntry.addEventListener('click', () => { window.location.href = 'admin.html'; });

/* ---------- Hero load sequence ---------- */
window.addEventListener('DOMContentLoaded', () => {
  if (reduceMotion) {
    document.querySelectorAll('.line-inner').forEach(el => el.style.transform = 'none');
    return;
  }
  gsap.set('.hero-sub', { opacity: 0, y: 14 });
  gsap.set('.hero-cta', { opacity: 0, y: 14 });
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .to('.line-inner', { y: '0%', duration: 1.1, stagger: 0.12, delay: 0.3 });
  gsap.to('.hero-sub', { opacity: 1, y: 0, duration: 0.9, delay: 1.0, ease: 'power3.out' });
  gsap.to('.hero-cta', { opacity: 1, y: 0, duration: 0.9, delay: 1.15, ease: 'power3.out' });
});

/* ---------- Scroll reveals ---------- */
document.querySelectorAll('.reveal').forEach(el => {
  gsap.fromTo(el, { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

document.querySelectorAll('.service-row').forEach(el => {
  gsap.fromTo(el, { opacity: 0, y: 50 }, {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%' }
  });
});

/* Curl draw-in on section heads */
document.querySelectorAll('.curl-svg path').forEach(path => {
  const len = path.getTotalLength();
  gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  gsap.to(path, {
    strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut',
    scrollTrigger: { trigger: path, start: 'top 90%' }
  });
});

/* ---------- Magnetic buttons ---------- */
document.querySelectorAll('.magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    gsap.to(btn, { x: x * 0.25, y: y * 0.4, duration: 0.4, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }));
});

/* ---------- Pricing tabs ---------- */
document.querySelectorAll('.p-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.p-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.p-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.p-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
  });
});

/* ---------- Lightbox ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
document.querySelectorAll('.g-item').forEach(item => {
  item.addEventListener('click', () => {
    lightboxImg.src = item.dataset.src;
    lightbox.classList.add('active');
  });
});
function closeLightbox(){ lightbox.classList.remove('active'); }
lightbox.addEventListener('click', e => { if (e.target !== lightboxImg) closeLightbox(); });
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);

/* ---------- Modal ---------- */
function toggleModal(id){ document.getElementById(id).classList.toggle('active'); }
function openInquiry(serviceName){
  document.getElementById('inquiryModal').classList.add('active');
  const select = document.getElementById('iqService');
  if (serviceName) select.value = serviceName;
}

/* ---------- Reviews (Supabase) ---------- */
const reviewsContainer = document.getElementById('reviewsContainer');
const ratingNum = document.getElementById('ratingNum');
const ratingStars = document.getElementById('ratingStars');
const ratingCount = document.getElementById('ratingCount');

function getStars(rating){ return '★'.repeat(rating) + '☆'.repeat(5 - rating); }

function renderReviews(reviews){
  reviewsContainer.innerHTML = '';
  const doubled = reviews.concat(reviews); // seamless marquee loop
  doubled.forEach(review => {
    const el = document.createElement('div');
    el.className = 'review-card';
    el.innerHTML = `
      <div class="stars">${getStars(review.rating || 5)}</div>
      <p class="r-text">"${review.text}"</p>
      <div class="r-author">${review.name}</div>
    `;
    reviewsContainer.appendChild(el);
  });

  const avg = reviews.reduce((a, r) => a + (r.rating || 5), 0) / reviews.length;
  ratingNum.textContent = avg.toFixed(1);
  ratingStars.textContent = getStars(Math.round(avg));
  ratingCount.textContent = `na základě ${reviews.length} recenzí klientek`;

  if (!reduceMotion) {
    const trackWidth = reviewsContainer.scrollWidth / 2;
    gsap.fromTo(reviewsContainer, { x: 0 }, {
      x: -trackWidth, duration: reviews.length * 6, ease: 'none', repeat: -1
    });
  }
}

async function fetchReviews(){
  try{
    const response = await fetch(`${SUPABASE_URL}/rest/v1/reviews?select=*&order=created_at.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Nelze načíst data.');
    const data = await response.json();
    if (data.length > 0) renderReviews(data); else throw new Error('Prázdná databáze');
  }catch(err){
    console.warn(err.message + ' -> Načítám ukázková data.');
    renderReviews([
      { name: 'Veronika P.', rating: 5, text: 'Naprosto špičkový přístup a krásné prostředí. Mé řasy nikdy nevypadaly lépe, vydrží neskutečně dlouho a vypadají tak přirozeně!' },
      { name: 'Klára M.', rating: 5, text: 'Laminace obočí změnila můj obličej. Andrea má cit pro detail a zlaté ručičky. Studio dýchá luxusem a klidem.' },
      { name: 'Natálie V.', rating: 5, text: 'Zkoušela jsem mnoho studií, ale tohle je úplně jiná liga. Profesionální péče, ticho, relax a perfektní výsledek.' }
    ]);
  }
}

document.getElementById('reviewForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('submitBtn');
  const original = btn.innerHTML;
  const newReview = {
    name: document.getElementById('revName').value,
    rating: parseInt(document.getElementById('revRating').value),
    text: document.getElementById('revText').value
  };
  btn.innerHTML = '<span class="btn-line">Odesílám…</span>';
  try{
    const response = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(newReview)
    });
    if (!response.ok) throw new Error('Chyba uložení');
    toggleModal('reviewModal');
    document.getElementById('reviewForm').reset();
    fetchReviews();
  }catch(err){
    alert('Chyba při odesílání recenze. Prosím, zkontrolujte API napojení.');
  }finally{
    btn.innerHTML = original;
  }
});

fetchReviews();

/* ---------- Inquiries (Supabase — booking requests for the admin panel) ---------- */
document.getElementById('inquiryForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('inquirySubmitBtn');
  const original = btn.innerHTML;
  const newInquiry = {
    name: document.getElementById('iqName').value,
    contact: document.getElementById('iqContact').value,
    service: document.getElementById('iqService').value,
    preferred_date: document.getElementById('iqDate').value || null,
    preferred_time: document.getElementById('iqTime').value || null,
    note: document.getElementById('iqNote').value,
    status: 'new'
  };
  btn.innerHTML = '<span class="btn-line">Odesílám…</span>';
  try{
    const response = await fetch(`${SUPABASE_URL}/rest/v1/inquiries`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(newInquiry)
    });
    if (!response.ok) throw new Error('Chyba uložení poptávky');
    document.getElementById('inquiryForm').style.display = 'none';
    document.getElementById('inquirySuccess').classList.add('show');
    setTimeout(() => {
      toggleModal('inquiryModal');
      document.getElementById('inquiryForm').reset();
      document.getElementById('inquiryForm').style.display = 'block';
      document.getElementById('inquirySuccess').classList.remove('show');
    }, 2600);
  }catch(err){
    alert('Poptávku se nepodařilo odeslat. Zkuste to prosím znovu nebo mi napište přímo na Instagram či telefon. (Pozn. pro majitelku: zkontrolujte, že v Supabase existuje tabulka "inquiries" — viz README.)');
  }finally{
    btn.innerHTML = original;
  }
});
