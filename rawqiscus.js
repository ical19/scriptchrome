  let keyword = 'tunas toyota batu tulis';
  let intervalMinutes = 1;
  let running = false;
  let paused = false;
  let standbyInterval = null;
  const AGENT_TEXT = 'amru batu tulis';

  const counters = { checked: 0, assigned: 0, startTime: null };

  function btnStyle(color = '#00B386') {
    return `
      padding: 6px 12px;
      background-color: ${color};
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-family: Inter, sans-serif;
    `;
  }

  function createStatusModal() {
    let modal = document.getElementById('process-status-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'process-status-modal';
    modal.style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      font-family: Inter, sans-serif;
      font-size: 14px;
      z-index: 9999;
      min-width: 320px;
      max-width: 95%;
      padding: 16px 20px 12px;
      cursor: move;
    `;

    modal.innerHTML = `
      <div id="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="font-size: 16px; color: #333;">Status Proses</strong>
        <div style="display: flex; gap: 10px; align-items: center;">
          <svg id="config-toggle" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.42 1.26 1.03 1.51H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <svg id="close-modal" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>
      </div>
      <div id="process-status-text" style="margin-top: 10px; color: #333;">Memulai...</div>
      <div id="process-stats" style="margin: 8px 0; font-size: 13px; color: #666;"></div>
      <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button id="pause-btn" style="${btnStyle()}">Pause</button>
        <button id="continue-btn" style="${btnStyle()}">Continue</button>
        <button id="stop-btn" style="${btnStyle('#e53935')}">Stop</button>
      </div>
      <div id="config-section" style="display:none; margin-top: 12px;">
        <label style="margin-top: 10px; display: block; font-weight: 500;">Cari teks:</label>
        <input id="keyword-input" type="text" value="${keyword}" style="width:100%; margin-top:4px; padding:6px; border:1px solid #ccc; border-radius:4px;" />
        <label style="margin-top: 10px; display: block; font-weight: 500;">Interval cek ulang (menit):</label>
        <input id="interval-input" type="number" value="${intervalMinutes}" min="1" style="width:100%; margin-top:4px; padding:6px; border:1px solid #ccc; border-radius:4px;" />
        <button id="save-config" style="${btnStyle()} width:100%; margin-top:12px;">Simpan</button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('close-modal').onclick = () => modal.remove();
    document.getElementById('config-toggle').onclick = () => {
      const sec = document.getElementById('config-section');
      sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
    };

    makeModalDraggable(modal);

    document.getElementById('pause-btn').onclick = () => {
      paused = true; running = false;
      clearInterval(standbyInterval);
      updateStatus('⏸️ Dijeda oleh pengguna');
    };
    document.getElementById('continue-btn').onclick = () => {
      if (!running) {
        paused = false;
        running = true;
        updateStatus('▶️ Lanjut memproses...');
        processCurrentRoom();
      }
    };
    document.getElementById('stop-btn').onclick = () => {
      paused = false; running = false;
      clearInterval(standbyInterval);
      updateStatus('⛔ Dihentikan pengguna');
    };
    document.getElementById('save-config').onclick = () => {
      keyword = document.getElementById('keyword-input').value.toLowerCase();
      intervalMinutes = Math.max(1, parseInt(document.getElementById('interval-input').value));
      alert('✅ Konfigurasi disimpan.');
    };
  }

  function makeModalDraggable(modal) {
    const header = modal.querySelector('#modal-header');
    let offsetX = 0, offsetY = 0, isDragging = false;
    header.onmousedown = (e) => {
      isDragging = true;
      offsetX = e.clientX - modal.offsetLeft;
      offsetY = e.clientY - modal.offsetTop;
    };
    document.onmouseup = () => isDragging = false;
    document.onmousemove = (e) => {
      if (!isDragging) return;
      modal.style.left = `${e.clientX - offsetX}px`;
      modal.style.top = `${e.clientY - offsetY}px`;
      modal.style.transform = 'none';
    };
  }

  function updateStatus(text) {
    const el = document.getElementById('process-status-text');
    if (el) el.textContent = text;
    updateStats();
  }

  function updateStats() {
    const stats = document.getElementById('process-stats');
    const dur = ((Date.now() - counters.startTime) / 1000).toFixed(1);
    if (stats) {
      stats.innerHTML = `
        🔄 Dicek: <b>${counters.checked}</b> |
        ✅ Assign: <b>${counters.assigned}</b> |
        ⏱️ Durasi: <b>${dur}s</b>`;
    }
  }

  function standbyWatcher() {
    standbyInterval = setInterval(() => {
      if (!running && !paused) {
        const first = document.querySelector('.room-item');
        if (first) first.click();
        setTimeout(() => {
          console.log(`[AUTO-SCAN] Mulai ulang pengecekan...`);
          running = true;
          processCurrentRoom();
        }, 1000);
      }
    }, intervalMinutes * 60 * 1000);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !running) {
      running = true; paused = false;
      counters.checked = 0; counters.assigned = 0;
      counters.startTime = Date.now();
      createStatusModal();
      updateStatus('Memulai proses...');
      processCurrentRoom();
      standbyWatcher();
    }
  });

  function processCurrentRoom() {
    if (!running || paused) return;

    const active = document.querySelector('.room-item.active');
    if (!active) {
      updateStatus('❌ Tidak ada chat aktif');
      running = false;
      return;
    }

    counters.checked++;
    updateStatus(`🔍 Mencari teks "${keyword.toUpperCase()}"...`);
    setTimeout(() => {
      const messages = [...document.querySelectorAll('.qcw-comment__content')].map(el => el.innerText.toLowerCase());
      if (messages.some(txt => txt.includes(keyword))) {
        updateStatus('✅ Teks ditemukan, assign ke Amru...');
        counters.assigned++;
        assignAmru(() => {
          updateStatus('✔️ Assign selesai, lanjut...');
          gotoNextRoom(processCurrentRoom);
        });
      } else {
        updateStatus('❌ Teks tidak ditemukan, lanjut...');
        gotoNextRoom(processCurrentRoom);
      }
    }, 1000);
  }

  function gotoNextRoom(cb) {
    const current = document.querySelector('.room-item.active');
    const next = current?.nextElementSibling;
    if (next) {
      next.click();
      setTimeout(() => {
        updateStatus('🔄 Memproses chat berikutnya...');
        cb();
      }, 800);
    } else {
      updateStatus('🏁 Semua chat selesai diproses. Standby aktif...');
      running = false;
    }
  }

  function assignAmru(cb) {
    if (typeof openMenuAssign !== 'function') {
      updateStatus('⚠️ openMenuAssign tidak ditemukan!');
      running = false;
      return;
    }
    openMenuAssign();
    setTimeout(() => {
      const addAgent = [...document.querySelectorAll('#menu-assign li a')].find(a => a.textContent.trim() === 'Add Agent');
      if (!addAgent) return stop('❌ Tombol Add Agent tidak ditemukan');
      addAgent.click();
      setTimeout(() => {
        const agentLi = [...document.querySelectorAll('.agent-container ul li')].find(li => li.querySelector('p[title]')?.title.toLowerCase().includes(AGENT_TEXT));
        if (!agentLi) return stop('❌ Agent Amru tidak ditemukan');
        agentLi.click();
        setTimeout(() => {
          const addBtn = [...document.querySelectorAll('.agent-list__footer button')].find(b => b.textContent.trim() === 'Add' && !b.disabled);
          if (!addBtn) return stop('❌ Tombol Add tidak aktif');
          addBtn.click();
          setTimeout(() => {
            const ok = document.querySelector('.swal2-confirm.swal2-styled');
            if (ok) ok.click();
            setTimeout(cb, 2000);
          }, 1000);
        }, 500);
      }, 2000);
    }, 600);

    function stop(msg) {
      updateStatus(msg);
      running = false;
    }
  }
