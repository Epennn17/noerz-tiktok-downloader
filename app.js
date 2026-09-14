/* =========================================================
   Noerz Downloader — app.js
   Handle: menu, form, API call (via proxy), render hasil,
           copy username/caption/hashtag
   ========================================================= */

(function () {
  'use strict';

  /* ============ CONFIG ============ */
  const PROXY_URL = '/api/proxy';
  const TARGET_API = 'https://api.alwayscodex.eu.cc/api/downloader/tiktokv4';
  const TIMEOUT = 30000;

  const TIKTOK_REGEX = /^https?:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com\/.+/i;

  /* ============ INIT ============ */
  document.addEventListener('DOMContentLoaded', function () {
    initMenu();
    initFAQ();
    initForm();
    initCopyButtons();
  });

  /* ============ MENU ============ */
  function initMenu() {
    const openBtn  = document.getElementById('menuOpenBtn');
    const closeBtn = document.getElementById('menuCloseBtn');
    const overlay  = document.getElementById('menuOverlay');
    const panel    = document.getElementById('menuPanel');
    if (!openBtn || !panel) return;

    function open() {
      if (overlay) overlay.classList.add('open');
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      if (overlay) overlay.classList.remove('open');
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);

    document.querySelectorAll('.menu-item').forEach(function (item) {
      item.addEventListener('click', function () {
        setTimeout(close, 150);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ============ FAQ ============ */
  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(function (item) {
      const btn    = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (!btn || !answer) return;

      btn.addEventListener('click', function () {
        const isOpen = item.classList.contains('open');

        items.forEach(function (other) {
          if (other !== item && other.classList.contains('open')) {
            other.classList.remove('open');
            other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            other.querySelector('.faq-answer').style.maxHeight = null;
          }
        });

        if (isOpen) {
          item.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  }

  /* ============ TOAST ============ */
  function showToast(message, type) {
    type = type || 'info';
    let wrap = document.getElementById('toastWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.id = 'toastWrap';
      document.body.appendChild(wrap);
    }

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icon = type === 'success' ? 'bx-check-circle'
               : type === 'error'   ? 'bx-error-circle'
               : 'bx-info-circle';
    toast.innerHTML = "<i class='bx " + icon + "'></i><span></span>";
    toast.querySelector('span').textContent = message;
    wrap.appendChild(toast);

    setTimeout(function () {
      toast.style.transition = 'opacity .3s, transform .3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      setTimeout(function () {
        if (toast.parentNode) toast.remove();
      }, 300);
    }, 4000);
  }

  /* ============ HELPERS ============ */
  function setLoading(btn, loading, label) {
    if (!btn) return;
    const labelEl = btn.querySelector('.btn-label');
    if (loading) {
      btn.disabled = true;
      btn.classList.add('loading');
      if (labelEl && label) labelEl.innerHTML = label;
    } else {
      btn.disabled = false;
      btn.classList.remove('loading');
      if (labelEl && label) labelEl.innerHTML = label;
    }
  }

  function setFieldError(input, errorEl, show) {
    if (!input || !errorEl) return;
    if (show) {
      input.classList.add('error');
      errorEl.classList.add('show');
    } else {
      input.classList.remove('error');
      errorEl.classList.remove('show');
    }
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function extractHashtags(text) {
    if (!text) return [];
    const matches = String(text).match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g);
    return matches ? matches : [];
  }

  /* ============ API ============ */
  async function callDownloader(url) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, TIMEOUT);

    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: TARGET_API, tiktokUrl: url }),
        signal: controller.signal
      });
      clearTimeout(timer);

      let data = null;
      try {
        const text = await res.text();
        if (text && text.trim()) data = JSON.parse(text);
      } catch (e) {
        data = null;
      }

      return { ok: res.ok, status: res.status, data: data };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('TIMEOUT');
      throw new Error('NETWORK');
    }
  }

  /* ============ FORM ============ */
  function initForm() {
    const form    = document.getElementById('downloadForm');
    const urlInput = document.getElementById('tiktokUrl');
    const urlError = document.getElementById('urlError');
    const btn     = document.getElementById('downloadBtn');
    if (!form) return;

    urlInput.addEventListener('input', function () {
      if (TIKTOK_REGEX.test(urlInput.value.trim())) {
        setFieldError(urlInput, urlError, false);
      }
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const url = urlInput.value.trim();

      if (!url) {
        setFieldError(urlInput, urlError, true);
        showToast('Masukkan link TikTok terlebih dahulu.', 'error');
        urlInput.focus();
        return;
      }

      if (!TIKTOK_REGEX.test(url)) {
        setFieldError(urlInput, urlError, true);
        showToast('Link harus dari TikTok (tiktok.com).', 'error');
        urlInput.focus();
        return;
      }

      setFieldError(urlInput, urlError, false);
      setLoading(btn, true, '<span class="spinner"></span> Loading...');
      hideResult();

      try {
        const result = await callDownloader(url);

        if (!result.ok) {
          const msg = (result.data && (result.data.error || result.data.message))
                    || 'Server sedang error. Coba lagi.';
          showToast(msg, 'error');
          return;
        }

        const data = result.data;

        if (!data || data.status !== true || !data.result) {
          const msg = (data && (data.error || data.message))
                    || 'Gagal mengambil data video. Coba link lain.';
          showToast(msg, 'error');
          return;
        }

        renderResult(data);
        showToast('Berhasil! Pilih aksi di bawah.', 'success');

      } catch (err) {
        const msg = err.message === 'TIMEOUT'
          ? 'Request timeout. Coba lagi.'
          : 'Tidak bisa terhubung ke server. Coba lagi.';
        showToast(msg, 'error');
      } finally {
        setLoading(btn, false, "<i class='bx bx-download'></i> Download");
      }
    });
  }

  /* ============ RENDER RESULT ============ */
  function renderResult(data) {
    const result = data.result || {};
    const provider = data.provider || 'TikTok';

    const providerEl = document.getElementById('resultProvider');
    if (providerEl) providerEl.textContent = 'via ' + provider;

    const thumbWrap = document.getElementById('thumbnailWrap');
    if (thumbWrap) {
      const videoUrl = result.video_hd || result.video;
      if (videoUrl) {
        thumbWrap.innerHTML =
          '<video src="' + escapeHtml(videoUrl) + '" controls playsinline preload="metadata" poster=""></video>';
      } else {
        thumbWrap.innerHTML =
          '<div class="thumb-placeholder">' +
            "<i class='bx bx-video-off'></i>" +
            '<span>Preview tidak tersedia</span>' +
          '</div>';
      }
    }

    const authorEl = document.getElementById('resultAuthor');
    const authorVal = result.author || result.username || '';
    if (authorEl) authorEl.textContent = authorVal || '';

    const captionEl = document.getElementById('resultCaption');
    const captionVal = result.description || result.caption || '';
    if (captionEl) captionEl.textContent = captionVal || '';

    const hashtagEl = document.getElementById('resultHashtag');
    const hashtags = extractHashtags(captionVal);
    const hashtagStr = hashtags.join(' ');
    if (hashtagEl) hashtagEl.textContent = hashtagStr || '';

    updateCopyBtn('copyAuthorBtn', authorVal);
    updateCopyBtn('copyCaptionBtn', captionVal);
    updateCopyBtn('copyHashtagBtn', hashtagStr);

    renderDownloadButtons(result);

    const resultBox = document.getElementById('result');
    if (resultBox) {
      resultBox.classList.add('show');
      setTimeout(function () {
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }

    window.__currentDownload = {
      author: authorVal,
      caption: captionVal,
      hashtag: hashtagStr
    };
  }

  function renderDownloadButtons(result) {
    const grid = document.getElementById('downloadGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const videoHd = result.video_hd || null;
    const videoSd = result.video || null;
    const music   = result.music || null;

    let hasAny = false;

    if (videoHd) {
      hasAny = true;
      grid.innerHTML +=
        '<a href="' + escapeHtml(videoHd) + '" target="_blank" rel="noopener" class="btn-download video full" download>' +
          "<i class='bx bx-video'></i> Download Video (HD)" +
        '</a>';
    }

    if (videoSd) {
      hasAny = true;
      grid.innerHTML +=
        '<a href="' + escapeHtml(videoSd) + '" target="_blank" rel="noopener" class="btn-download video full" download>' +
          "<i class='bx bx-video'></i> Download Video (SD)" +
        '</a>';
    }

    if (music) {
      hasAny = true;
      grid.innerHTML +=
        '<a href="' + escapeHtml(music) + '" target="_blank" rel="noopener" class="btn-download audio full" download>' +
          "<i class='bx bx-music'></i> Download Audio (MP3)" +
        '</a>';
    }

    if (!hasAny) {
      grid.innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:14px;color:var(--text-tertiary);font-size:13px;">' +
          'Tidak ada link download yang tersedia untuk video ini.' +
        '</div>';
    }
  }

  function hideResult() {
    const resultBox = document.getElementById('result');
    if (resultBox) resultBox.classList.remove('show');
  }

  /* ============ COPY ============ */
  function updateCopyBtn(btnId, value) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = !value;
    btn.classList.remove('copied');
    const label = btn.querySelector('span');
    if (label) {
      if (btnId === 'copyAuthorBtn')  label.textContent = 'Copy Username';
      if (btnId === 'copyCaptionBtn') label.textContent = 'Copy Caption';
      if (btnId === 'copyHashtagBtn') label.textContent = 'Copy Hashtag';
    }
  }

  function initCopyButtons() {
    const authorBtn  = document.getElementById('copyAuthorBtn');
    const captionBtn = document.getElementById('copyCaptionBtn');
    const hashtagBtn = document.getElementById('copyHashtagBtn');

    if (authorBtn)  authorBtn.addEventListener('click',  function () { handleCopy('author',  authorBtn); });
    if (captionBtn) captionBtn.addEventListener('click', function () { handleCopy('caption', captionBtn); });
    if (hashtagBtn) hashtagBtn.addEventListener('click', function () { handleCopy('hashtag', hashtagBtn); });
  }

  async function handleCopy(key, btn) {
    const data = window.__currentDownload || {};
    const value = data[key];
    if (!value) {
      showToast('Tidak ada data untuk disalin.', 'error');
      return;
    }

    const success = await copyToClipboard(value);

    if (success) {
      showToast('Berhasil disalin!', 'success');
      btn.classList.add('copied');
      const label = btn.querySelector('span');
      const original = label ? label.textContent : '';
      if (label) label.textContent = 'Tersalin!';
      setTimeout(function () {
        btn.classList.remove('copied');
        if (label) label.textContent = original;
      }, 2000);
    } else {
      showToast('Gagal menyalin. Salin manual ya.', 'error');
    }
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.top = '0';
      ta.style.left = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (err) {
      return false;
    }
  }

})();