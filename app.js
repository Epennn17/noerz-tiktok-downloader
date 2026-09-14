/* =========================================================
   NoerzTTDL — app.js
   API: tiktokv5
   Preview: cover image
   Download: custom filename (Noerz - @username - xxx)
   ========================================================= */

(function () {
  'use strict';

  /* ============ CONFIG ============ */
  const PROXY_URL  = '/api/proxy';
  const API_TARGET = 'https://api.alwayscodex.eu.cc/api/downloader/tiktokv5';
  const TIMEOUT    = 30000;

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

  function formatNumber(num) {
    if (!num && num !== 0) return '0';
    num = Number(num);
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return String(num);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /* Bersihkan nama file dari karakter ilegal */
  function sanitizeFilename(name) {
    if (!name) return 'tiktok';
    return String(name)
      .replace(/[\/\\:*?"<>|]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^\w\-@_.]/g, '')
      .substring(0, 40);
  }

  /* ============ API REQUEST ============ */
  async function apiRequest(tiktokUrl) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, TIMEOUT);

    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: API_TARGET, tiktokUrl: tiktokUrl }),
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
    const form     = document.getElementById('downloadForm');
    const urlInput = document.getElementById('tiktokUrl');
    const urlError = document.getElementById('urlError');
    const btn      = document.getElementById('downloadBtn');
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
        const result = await apiRequest(url);

        if (!result.ok) {
          const msg = (result.data && (result.data.error || result.data.message))
                    || 'Server sedang error. Coba lagi.';
          showToast(msg, 'error');
          return;
        }

        const data = result.data;

        if (!data || data.status !== true) {
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
    const isVideo = data.isVideo === true;
    const downloads = data.download || [];
    const author = data.author || {};
    const music = data.music || {};
    const stats = data.stats || {};
    const cover = data.cover || null;

    /* Username untuk nama file */
    const username = author.username || author.nickname || 'tiktok';
    const cleanUsername = sanitizeFilename(username);

    /* Status text */
    const statusEl = document.getElementById('resultStatusText');
    if (statusEl) {
      statusEl.textContent = isVideo ? 'Video berhasil diambil' : 'Foto slide berhasil diambil';
    }

    /* === PREVIEW === */
    const thumbWrap = document.getElementById('thumbnailWrap');
    const slideWrap = document.getElementById('slideGridWrap');

    if (thumbWrap) {
      thumbWrap.style.display = '';

      if (isVideo) {
        if (cover) {
          thumbWrap.innerHTML =
            '<img src="' + escapeHtml(cover) + '" alt="Cover" loading="lazy">';
        } else {
          thumbWrap.innerHTML =
            '<div class="thumb-placeholder">' +
              "<i class='bx bx-video'></i>" +
              '<span>Preview tidak tersedia</span>' +
            '</div>';
        }
      } else {
        const firstImage = getUniqueImages(downloads)[0];
        if (cover) {
          thumbWrap.innerHTML =
            '<img src="' + escapeHtml(cover) + '" alt="Cover" loading="lazy">';
        } else if (firstImage) {
          thumbWrap.innerHTML =
            '<img src="' + escapeHtml(firstImage) + '" alt="Cover" loading="lazy">';
        } else {
          thumbWrap.innerHTML =
            '<div class="thumb-placeholder">' +
              "<i class='bx bx-image'></i>" +
              '<span>Preview tidak tersedia</span>' +
            '</div>';
        }
      }
    }

    /* === FOTO SLIDE GRID === */
    if (slideWrap) {
      if (!isVideo) {
        slideWrap.style.display = '';
        const uniqueImages = getUniqueImages(downloads);

        const countEl = document.getElementById('slideCount');
        if (countEl) countEl.textContent = uniqueImages.length + ' gambar';

        const grid = document.getElementById('slideGrid');
        if (grid) {
          grid.innerHTML = '';
          uniqueImages.forEach(function (url, i) {
            const slideNum = i + 1;
            const filename = 'Noerz - @' + cleanUsername + ' - ' + slideNum + '.jpg';
            grid.innerHTML +=
              '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener" class="slide-item" download="' + escapeHtml(filename) + '">' +
                '<img src="' + escapeHtml(url) + '" alt="Slide ' + slideNum + '" loading="lazy">' +
                '<span class="slide-badge">' + slideNum + '</span>' +
                "<span class='slide-dl'><i class='bx bx-download'></i></span>" +
              '</a>';
          });
        }
      } else {
        slideWrap.style.display = 'none';
      }
    }

    /* === AUTHOR === */
    const authorEl = document.getElementById('resultAuthor');
    let authorVal = '';
    let authorDisplay = '';
    if (author.nickname && author.username) {
      authorDisplay = author.nickname + ' (@' + author.username + ')';
      authorVal = author.username;
    } else if (author.username) {
      authorDisplay = '@' + author.username;
      authorVal = author.username;
    } else if (author.nickname) {
      authorDisplay = author.nickname;
      authorVal = author.nickname;
    }
    if (authorEl) authorEl.textContent = authorDisplay || '';

    /* === STATS === */
    const statsEl = document.getElementById('authorStats');
    if (statsEl) {
      const hasStats = stats.like || stats.views || stats.share || stats.comment;
      if (hasStats) {
        statsEl.style.display = 'flex';
        setText('statLike', formatNumber(stats.like));
        setText('statViews', formatNumber(stats.views));
        setText('statShare', formatNumber(stats.share));
        setText('statComment', formatNumber(stats.comment));
      } else {
        statsEl.style.display = 'none';
      }
    }

    /* === CAPTION === */
    const captionEl = document.getElementById('resultCaption');
    const captionVal = data.title || '';
    if (captionEl) captionEl.textContent = captionVal || '';

    /* === HASHTAG === */
    const hashtagEl = document.getElementById('resultHashtag');
    const hashtags = extractHashtags(captionVal);
    const hashtagStr = hashtags.join(' ');
    if (hashtagEl) hashtagEl.textContent = hashtagStr || '';

    /* === MUSIC === */
    const musicInfoEl = document.getElementById('musicInfo');
    if (musicInfoEl) {
      if (music.title || music.author) {
        musicInfoEl.style.display = '';
        setText('musicTitle', music.title || 'Audio');
        setText('musicAuthor', music.author ? 'by ' + music.author : '');
      } else {
        musicInfoEl.style.display = 'none';
      }
    }

    /* === DOWNLOAD BUTTONS === */
    renderDownloadButtons(data, cleanUsername);

    /* === Update copy buttons === */
    updateCopyBtn('copyAuthorBtn', authorVal);
    updateCopyBtn('copyCaptionBtn', captionVal);
    updateCopyBtn('copyHashtagBtn', hashtagStr);
    updateCopyBtn('copyMusicBtn', music.title ? (music.title + ' - ' + (music.author || '')) : '', 'Copy');

    /* Show result */
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
      hashtag: hashtagStr,
      music: music.title ? (music.title + ' - ' + (music.author || '')) : ''
    };
  }

  /* Ambil URL gambar unik dari array download */
  function getUniqueImages(urls) {
    if (!urls || !urls.length) return [];

    const seen = new Set();
    const result = [];

    urls.forEach(function (url) {
      const match = url.match(/\/([a-f0-9]{20,})[~.]/i);
      const key = match ? match[1] : url.split('?')[0];

      if (!seen.has(key)) {
        seen.add(key);
        result.push(url);
      }
    });

    if (result.length > 20) {
      return urls.filter(function (_, i) { return i % 2 === 0; });
    }

    return result;
  }

  function renderDownloadButtons(data, cleanUsername) {
    const grid = document.getElementById('downloadGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const isVideo = data.isVideo === true;
    const downloads = data.download || [];
    const music = data.music || {};

    let hasAny = false;

    if (isVideo) {
      if (downloads.length >= 1) {
        hasAny = true;
        const filenameHd = 'Noerz - @' + cleanUsername + ' - HD.mp4';
        grid.innerHTML +=
          '<a href="' + escapeHtml(downloads[0]) + '" target="_blank" rel="noopener" class="btn-download video full" download="' + escapeHtml(filenameHd) + '">' +
            "<i class='bx bx-video'></i> Download Video (HD · No Watermark)" +
          '</a>';
      }
      if (downloads.length >= 2) {
        const filenameSd = 'Noerz - @' + cleanUsername + ' - SD.mp4';
        grid.innerHTML +=
          '<a href="' + escapeHtml(downloads[1]) + '" target="_blank" rel="noopener" class="btn-download video full" download="' + escapeHtml(filenameSd) + '">' +
            "<i class='bx bx-video'></i> Download Video (SD · No Watermark)" +
          '</a>';
      }
    }

    if (music.url) {
      hasAny = true;
      const filenameAudio = 'Noerz - @' + cleanUsername + ' - Audio.mp3';
      grid.innerHTML +=
        '<a href="' + escapeHtml(music.url) + '" target="_blank" rel="noopener" class="btn-download audio full" download="' + escapeHtml(filenameAudio) + '">' +
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
  function updateCopyBtn(btnId, value, customLabel) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = !value;
    btn.classList.remove('copied');
    const label = btn.querySelector('span');
    if (label) {
      if (customLabel) {
        label.textContent = customLabel;
      } else if (btnId === 'copyAuthorBtn') {
        label.textContent = 'Copy Username';
      } else if (btnId === 'copyCaptionBtn') {
        label.textContent = 'Copy Caption';
      } else if (btnId === 'copyHashtagBtn') {
        label.textContent = 'Copy Hashtag';
      }
    }
  }

  function initCopyButtons() {
    const authorBtn  = document.getElementById('copyAuthorBtn');
    const captionBtn = document.getElementById('copyCaptionBtn');
    const hashtagBtn = document.getElementById('copyHashtagBtn');
    const musicBtn   = document.getElementById('copyMusicBtn');

    if (authorBtn)  authorBtn.addEventListener('click',  function () { handleCopy('author',  authorBtn); });
    if (captionBtn) captionBtn.addEventListener('click', function () { handleCopy('caption', captionBtn); });
    if (hashtagBtn) hashtagBtn.addEventListener('click', function () { handleCopy('hashtag', hashtagBtn); });
    if (musicBtn)   musicBtn.addEventListener('click',   function () { handleCopy('music',   musicBtn); });
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