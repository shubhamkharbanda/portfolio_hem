(function () {
  'use strict';
  const config = window.PORTFOLIO_CONFIG || { projects: [] };
  const grid = document.getElementById('work-grid');
  const modal = document.getElementById('reel-modal');
  const modalTitle = document.getElementById('modal-title');
  const embedWrap = document.getElementById('embed-wrap');
  const modalHelper = document.getElementById('modal-helper');
  const modalExternal = document.getElementById('modal-external');
  const toast = document.getElementById('toast');
  let previousFocus = null;
  let toastTimer;

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function visualArtwork(p) {
    const fallbackArtwork = () => {
      const label = escapeHTML(p.coverLabel || 'VIDEO\nPROJECT').replace(/\n/g, '<br>');
      const style = p.style || 'orbit';
      let decor = '<div class="poster-shape"></div><div class="poster-shape2"></div>';
      if (style === 'grid') decor = '<div class="poster-grid">' + Array.from({length: 20}, () => '<i></i>').join('') + '</div><div class="poster-shape"></div>';
      if (style === 'hand') decor = '<div class="poster-hand">✳</div><div class="poster-shape"></div>';
      if (style === 'bars') decor = '<div class="poster-grid">' + Array.from({length: 20}, (_, i) => `<i style="height:${30 + ((i * 17) % 70)}%;align-self:end"></i>`).join('') + '</div><div class="poster-ring"></div>';
      if (style === 'circle') decor = '<div class="poster-ring"></div><div class="poster-shape"></div>';
      return `<div class="project-visual project-visual--art" role="button" tabindex="0" aria-label="Preview ${escapeHTML(p.title)}" data-project="${escapeHTML(p.id)}" style="--project-bg:${escapeHTML(p.background || '#aaa0ff')};--shape:${escapeHTML(p.shape || '#d5fa58')}">
        <div class="visual-noise"></div><div class="visual-top"><span class="brand-dot">${escapeHTML((p.client || 'B').trim().charAt(0) || 'B')}</span><span>CREATIVE ARCHIVE / ${escapeHTML(p.id)}</span></div>${decor}
        <div class="poster-copy">${label}</div><div class="poster-sub">${escapeHTML(p.coverSub || 'SHORT-FORM VIDEO')}</div><span class="poster-pill">${escapeHTML(p.categoryLabel || p.category || 'VIDEO')}</span><span class="play-button" aria-hidden="true">▶</span>
      </div>`;
    };

    if (!p.thumbnailUrl) return fallbackArtwork();
    const isYoutube = p.platform === 'youtube';
    const platformLabel = isYoutube ? 'YouTube' : 'Instagram';
    const fallbackUrl = p.thumbnailFallbackEmbedUrl || '';
    return `<div class="project-visual project-visual--thumbnail" role="button" tabindex="0" aria-label="Preview ${escapeHTML(p.title)}" data-project="${escapeHTML(p.id)}">
      <img class="project-thumbnail" src="${escapeHTML(p.thumbnailUrl)}" alt="${escapeHTML(p.title)} video thumbnail" loading="lazy" decoding="async" ${fallbackUrl ? `data-embed-fallback="${escapeHTML(fallbackUrl)}"` : ''} />
      <div class="thumbnail-overlay" aria-hidden="true"><span class="thumbnail-platform">${platformLabel} / ${escapeHTML(p.id)}</span><span class="thumbnail-play">▶</span><span class="thumbnail-hint">CLICK TO WATCH</span></div>
    </div>`;
  }
  function cardMarkup(p) {
    const resultMarkup = p.result ? `<div class="project-result"><span class="result-mark">✳</span><span>${escapeHTML(p.result)}</span></div>` : '';
    return `<article class="project-card" data-category="${escapeHTML(p.category || 'campaign')}">
      ${visualArtwork(p)}
      <div class="project-meta"><span class="client-name">${escapeHTML(p.client || 'Brand / Client')}</span><span class="project-category">${escapeHTML(p.categoryLabel || p.category || 'PROJECT')}</span></div>
      <div class="project-title-row"><h3 class="project-title">${escapeHTML(p.title || 'Project title')}</h3><span class="project-arrow" aria-hidden="true">↗</span></div>
      <p class="project-description">${escapeHTML(p.description || '')}</p>
      ${resultMarkup}
    </article>`;
  }
  function renderProjects(filter = 'all') {
    const projects = Array.isArray(config.projects) ? config.projects : [];
    const visible = projects.filter(p => filter === 'all' || p.category === filter);
    grid.innerHTML = visible.map(cardMarkup).join('');
    grid.classList.remove('work-grid--two');
    grid.querySelectorAll('[data-project]').forEach(el => {
      const open = () => showProject(el.dataset.project);
      el.addEventListener('click', open);
      el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    // Instagram no longer consistently exposes a direct image URL. If its old
    // thumbnail endpoint fails, show the official embed for that exact Reel.
    grid.querySelectorAll('img[data-embed-fallback]').forEach(img => {
      img.addEventListener('error', () => {
        if (img.dataset.fallbackTried) return;
        img.dataset.fallbackTried = '1';
        const frame = document.createElement('iframe');
        frame.className = 'project-thumbnail-frame';
        frame.src = img.dataset.embedFallback;
        frame.title = `Instagram thumbnail: ${img.alt || 'Reel'}`;
        frame.loading = 'lazy';
        frame.setAttribute('scrolling', 'no');
        frame.setAttribute('aria-hidden', 'true');
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        img.replaceWith(frame);
      }, { once: true });
    });
    const count = document.querySelector('[data-project-count]');
    if (count) count.textContent = String((config.projects || []).length).padStart(2, '0');
  }
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4200);
  }
  function parseVideo(project) {
    const rawUrl = project.videoUrl || project.instagramUrl || '';
    if (!rawUrl) return null;
    try {
      const parsed = new URL(rawUrl);
      if (!['https:', 'http:'].includes(parsed.protocol)) return null;
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
      if (host === 'instagram.com') {
        const match = parsed.pathname.match(/^\/(reel|p|tv)\/([A-Za-z0-9_-]+)/i);
        if (!match) return null;
        return { platform: 'instagram', url: `https://www.instagram.com/${match[1]}/${match[2]}/`, embedUrl: `https://www.instagram.com/${match[1]}/${match[2]}/embed/captioned/` };
      }
      if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        const match = parsed.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]+)/i);
        const id = match ? match[1] : parsed.searchParams.get('v');
        if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
        return { platform: 'youtube', url: `https://www.youtube.com/shorts/${id}`, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` };
      }
      if (host === 'youtu.be') {
        const id = parsed.pathname.split('/').filter(Boolean)[0];
        if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
        return { platform: 'youtube', url: `https://www.youtube.com/shorts/${id}`, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` };
      }
    } catch { return null; }
    return null;
  }
  function showProject(id) {
    const project = (config.projects || []).find(p => String(p.id) === String(id));
    if (!project) return;
    previousFocus = document.activeElement;
    modalTitle.textContent = project.title || 'Project preview';
    const video = parseVideo(project);
    embedWrap.innerHTML = '';
    if (video) {
      const frame = document.createElement('iframe');
      frame.title = `${video.platform === 'youtube' ? 'YouTube' : 'Instagram'} preview: ${project.title || 'Short-form video'}`;
      frame.src = video.embedUrl;
      frame.loading = 'lazy';
      frame.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.setAttribute('allowfullscreen', '');
      embedWrap.appendChild(frame);
      modalHelper.textContent = `If the ${video.platform === 'youtube' ? 'YouTube' : 'Instagram'} preview does not load, use the link below to open the original video.`;
      modalExternal.href = video.url;
      modalExternal.textContent = `Open on ${video.platform === 'youtube' ? 'YouTube' : 'Instagram'} ↗`;
      modalExternal.style.display = 'inline-block';
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'preview-placeholder';
      const title = document.createElement('b');
      title.textContent = 'Video preview unavailable';
      const copy = document.createElement('span');
      copy.textContent = 'Check the video URL in projects.js. You can still add a supported public Instagram Reel or YouTube video link.';
      placeholder.append(title, copy);
      embedWrap.appendChild(placeholder);
      modalHelper.textContent = 'The original video link is missing or not recognised.';
      modalExternal.style.display = 'none';
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    embedWrap.innerHTML = '';
    document.body.style.overflow = '';
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }
  document.querySelectorAll('.filter-btn').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    renderProjects(button.dataset.filter || 'all');
  }));
  modal.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav-links');
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuToggle.setAttribute('aria-expanded', 'false'); }));
  if (config.name) {
    document.querySelector('.wordmark').lastElementChild.textContent = config.name.toUpperCase();
    document.querySelector('.contact-bottom span:first-child').textContent = `${config.name.toUpperCase()} © 2026`;
    document.querySelector('.mobile-footer span').textContent = config.name.toUpperCase();
    document.title = `${config.name} — Marketing & Creative Portfolio`;
  }
  if (config.email) document.getElementById('email-cta').href = `mailto:${config.email}`;
  if (config.instagram) document.getElementById('instagram-link').href = config.instagram;
  if (config.linkedin) document.getElementById('linkedin-link').href = config.linkedin;
  renderProjects();
})();

