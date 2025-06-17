  let keyword = 'tunas toyota batu tulis';
  let intervalMinutes = 1;
  let running = false;
  let paused = false;
  let standbyInterval = null;

  const AGENT_TEXT = 'amru batu tulis';
  const counters = {
    checked: 0,
    assigned: 0,
    startTime: null,
  };

  function btnStyle(color = 'primary') {
    const colors = {
      primary: '#00B386',
      green: '#43a047',
      red: '#e53935',
      gray: '#e0e0e0',
    };
    return `
      padding: 8px 16px;
      background-color: ${colors[color]};
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      flex: 1;
    `;
  }

  function createStatusModal() {
    let modal = document.getElementById('qiscus-status-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'qiscus-status-modal';
    modal.style.cssText = `
      position: fixed;
      top: 80px;
      right: 40px;
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      font-family: "Inter", sans-serif;
      font-size: 14px;
      z-index: 99999;
      width: 320px;
    `;
    modal.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#00B386"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-2.83.48-5.66-.3-7.78-2.42C3.3 15.07 2.52 12.24 3 9.41 3.72 5.26 7.26 2 12 2v2c-3.86 0-7 3.14-7 7s3.14 7 7 7v2zm-1-6h2V7h-2v6zm0 4h2v-2h-2v2z"/></svg>
        <strong style="font-size: 16px; color: #333;">Status Proses</strong>
      </div>
      <div id="process-status-text" style="margin: 10px 0; color: #444;">Memulai...</div>
      <div id="process-stats" style="font-size: 13px; color: #555;"></div>
      <div style="margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap;">
        <button id="pause-btn" style="${btnStyle()}">Pause</button>
        <button id="continue-btn" style="${btnStyle('green')}">Continue</button>
        <button id="stop-btn" style="${btnStyle('red')}">Stop</button>
        <button id="close-btn" style="${btnStyle('gray')}; color: #333;">Close</button>
      </div>
      <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;">
      <div>
        <label style="color: #555; font-weight: 600;">Kata kunci pencarian:</label>
        <input id="keyword-input" type="text" value="${keyword}" style="width: 100%; margin-top: 4px; padding: 6px; border: 1px solid #ccc; border-radius: 4px;" />
        <br><br>
        <label style="color: #555; font-weight: 600;">Interval ulang (menit):</label>
        <input id="interval-input" type="number" value="${intervalMinutes}" min="1" style="width: 100%; margin-top: 4px; padding: 6px; border: 1px solid #ccc; border-radius: 4px;" />
        <br><br>
        <button id="save-config" style="${btnStyle()} width: 100%;">Simpan</button>
      </div>
    `;

    document.body.appendChild(modal);
    setupModalButtons();
  }

  function setupModalButtons() {
    document.getElementById('pause-btn').onclick = () => {
      paused = true;
      running = false;
      clearInterval(standbyInterval);
      updateStatus('⏸️ Dijeda oleh pengguna');
    };
    document.getElementById('continue-btn').onclick = () => {
      if (!running) {
        paused = false;
        running = true;
        updateStatus('▶️ Lanjut memproses...');
        processRooms();
      }
    };
    document.getElementById('stop-btn').onclick = () => {
      paused = false;
      running = false;
      clearInterval(standbyInterval);
      updateStatus('⛔ Dihentikan pengguna');
    };
    document.getElementById('close-btn').onclick = () => document.getElementById('qiscus-status-modal').remove();
    document.getElementById('save-config').onclick = () => {
      keyword = document.getElementById('keyword-input').value.toLowerCase();
      intervalMinutes = Math.max(1, parseInt(document.getElementById('interval-input').value));
      alert('✅ Konfigurasi disimpan.');
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
        ⏱️ Durasi: <b>${dur}s</b>
      `;
    }
  }

  function processRooms() {
    const firstRoom = document.querySelector('.room-item');
    if (!firstRoom) return updateStatus('❌ Tidak ada daftar chat');
    firstRoom.click();
    setTimeout(() => processCurrentRoom(), 800);
  }

  function standbyWatcher() {
    standbyInterval = setInterval(() => {
      if (!running && !paused) {
        running = true;
        counters.startTime = Date.now();
        counters.checked = 0;
        counters.assigned = 0;
        updateStatus('🔄 Standby aktif: mulai ulang...');
        processRooms();
      }
    }, intervalMinutes * 60000);
  }

  function processCurrentRoom() {
    if (!running || paused) return;

    const active = document.querySelector('.room-item.active');
    if (!active) {
      updateStatus('❌ Tidak ada chat aktif');
      running = false;
      return;
    }

    counters.checked++;
    updateStatus(`🔍 Mencari "${keyword.toUpperCase()}"...`);

    setTimeout(() => {
      const messages = [...document.querySelectorAll('.qcw-comment__content')].map(e => e.innerText.toLowerCase());
      if (messages.some(txt => txt.includes(keyword))) {
        updateStatus('✅ Teks ditemukan. Assign ke Amru...');
        counters.assigned++;
        assignAmru(() => {
          gotoNextRoom(processCurrentRoom);
        });
      } else {
        updateStatus('⏭️ Tidak ditemukan. Lanjut...');
        gotoNextRoom(processCurrentRoom);
      }
    }, 1000);
  }

  function gotoNextRoom(cb) {
    const current = document.querySelector('.room-item.active');
    const next = current?.nextElementSibling;
    if (next) {
      next.click();
      setTimeout(() => cb(), 700);
    } else {
      updateStatus('🏁 Semua chat selesai. Menunggu...');
      running = false;
    }
  }

  function assignAmru(cb) {
    if (typeof openMenuAssign !== 'function') {
      updateStatus('⚠️ openMenuAssign tidak tersedia');
      running = false;
      return;
    }

    openMenuAssign();
    setTimeout(() => {
      const addAgent = [...document.querySelectorAll('#menu-assign li a')].find(a => a.textContent.trim() === 'Add Agent');
      if (!addAgent) return stop('❌ Add Agent tidak ditemukan');
      addAgent.click();

      setTimeout(() => {
        const agentLi = [...document.querySelectorAll('.agent-container ul li')].find(li => li.querySelector('p[title]')?.title.toLowerCase().includes(AGENT_TEXT));
        if (!agentLi) return stop('❌ Agent tidak ditemukan');
        agentLi.click();

        setTimeout(() => {
          const addBtn = [...document.querySelectorAll('.agent-list__footer button')].find(b => b.textContent.trim() === 'Add' && !b.disabled);
          if (!addBtn) return stop('❌ Tombol Add tidak aktif');
          addBtn.click();

          setTimeout(() => {
            const ok = document.querySelector('.swal2-confirm.swal2-styled');
            if (ok) ok.click();
            setTimeout(cb, 1500);
          }, 1000);
        }, 600);
      }, 1200);
    }, 600);

    function stop(msg) {
      updateStatus(msg);
      running = false;
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !running) {
      running = true;
      paused = false;
      counters.checked = 0;
      counters.assigned = 0;
      counters.startTime = Date.now();
      createStatusModal();
      updateStatus('🔄 Memulai...');
      processRooms();
      standbyWatcher();
    }
  });
