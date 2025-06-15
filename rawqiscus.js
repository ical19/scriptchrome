  let keyword = 'tunas toyota batu tulis';
  let intervalMinutes = 1;
  let running = false;
  let paused = false;
  let standbyInterval = null;

  const AGENT_TEXT = 'amru batu tulis';
  const counters = { checked: 0, assigned: 0, startTime: null };

  function btnStyle(color = 'blue') {
    const colors = {
      blue: '#2196f3',
      green: '#43a047',
      red: '#e53935',
      gray: '#757575',
    };
    return `
      padding: 6px 12px;
      background-color: ${colors[color]};
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    `;
  }

  function createSidebar() {
    let panel = document.getElementById('assign-sidebar-panel');
    if (panel) panel.remove();

    panel = document.createElement('div');
    panel.id = 'assign-sidebar-panel';
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      height: 100%;
      background: #ffffff;
      border-left: 2px solid #ddd;
      box-shadow: -2px 0 8px rgba(0,0,0,0.15);
      padding: 16px;
      font-family: "Roboto", sans-serif;
      font-size: 14px;
      z-index: 99999;
      overflow-y: auto;
    `;

    panel.innerHTML = `
      <h3 style="margin-top: 0; color: #333;">🚀 Auto Assign Panel</h3>
      <div id="process-status-text">Status: Menunggu mulai</div>
      <div id="process-stats" style="margin: 8px 0;"></div>
      <div style="margin: 8px 0;">
        <label>Cari teks:</label>
        <input id="keyword-input" type="text" value="${keyword}" style="width: 100%; padding: 4px;" />
      </div>
      <div style="margin: 8px 0;">
        <label>Interval cek ulang (menit):</label>
        <input id="interval-input" type="number" value="${intervalMinutes}" min="1" style="width: 100%; padding: 4px;" />
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0;">
        <button id="pause-btn" style="${btnStyle()} flex: 1;">Pause</button>
        <button id="continue-btn" style="${btnStyle('green')} flex: 1;">Continue</button>
        <button id="stop-btn" style="${btnStyle('red')} flex: 1;">Stop</button>
      </div>
      <button id="save-config" style="${btnStyle()} width: 100%;">💾 Simpan</button>
      <button id="close-btn" style="${btnStyle('gray')} width: 100%; margin-top: 8px;">❌ Tutup Panel</button>
    `;
    document.body.appendChild(panel);

    document.getElementById('pause-btn').onclick = () => {
      paused = true;
      running = false;
      clearInterval(standbyInterval);
      toggleInputs(false);
      updateStatus('⏸️ Dijeda oleh pengguna');
    };
    document.getElementById('continue-btn').onclick = () => {
      if (!running) {
        paused = false;
        running = true;
        toggleInputs(true);
        updateStatus('▶️ Lanjut memproses...');
        processCurrentRoom();
      }
    };
    document.getElementById('stop-btn').onclick = () => {
      paused = false;
      running = false;
      clearInterval(standbyInterval);
      toggleInputs(false);
      updateStatus('⛔ Dihentikan pengguna');
    };
    document.getElementById('close-btn').onclick = () => panel.remove();

    document.getElementById('save-config').onclick = () => {
      keyword = document.getElementById('keyword-input').value.toLowerCase();
      intervalMinutes = Math.max(1, parseInt(document.getElementById('interval-input').value));
      alert('✅ Konfigurasi disimpan.');
    };

    toggleInputs(true);
  }

  function toggleInputs(disabled) {
    document.getElementById('keyword-input').disabled = disabled;
    document.getElementById('interval-input').disabled = disabled;
    document.getElementById('save-config').disabled = disabled;
  }

  function updateStatus(text) {
    const el = document.getElementById('process-status-text');
    if (el) el.textContent = `Status: ${text}`;
    updateStats();
  }

  function updateStats() {
    const stats = document.getElementById('process-stats');
    const dur = ((Date.now() - counters.startTime) / 1000).toFixed(1);
    if (stats) {
      stats.innerHTML = `
        🔄 Dicek: <b>${counters.checked}</b><br>
        ✅ Assign: <b>${counters.assigned}</b><br>
        ⏱️ Durasi: <b>${dur}s</b>
      `;
    }
  }

  function standbyWatcher() {
    standbyInterval = setInterval(() => {
      if (!running && !paused) {
        console.log(`[AUTO-SCAN] Mulai ulang pengecekan...`);
        running = true;
        processCurrentRoom();
      }
    }, intervalMinutes * 60 * 1000);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !running) {
      running = true;
      paused = false;
      counters.checked = 0;
      counters.assigned = 0;
      counters.startTime = Date.now();
      createSidebar();
      updateStatus('Memulai proses...');
      processCurrentRoom();
      standbyWatcher();
    }
  });

  // proses utama tetap sama
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
      const messages = [...document.querySelectorAll('.qcw-comment__content')].map((el) => el.innerText.toLowerCase());

      if (messages.some((txt) => txt.includes(keyword))) {
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
      updateStatus('🔧 Klik Add Agent...');
      const addAgent = [...document.querySelectorAll('#menu-assign li a')].find((a) => a.textContent.trim() === 'Add Agent');
      if (!addAgent) return stop('❌ Tombol Add Agent tidak ditemukan');
      addAgent.click();

      setTimeout(() => {
        updateStatus('👥 Mencari agent Amru...');
        const agentLi = [...document.querySelectorAll('.agent-container ul li')].find((li) => {
          const p = li.querySelector('p[title]');
          return p && p.title.toLowerCase().includes(AGENT_TEXT);
        });
        if (!agentLi) return stop('❌ Agent Amru tidak ditemukan');
        agentLi.click();

        setTimeout(() => {
          updateStatus('✅ Klik tombol Add...');
          const addBtn = [...document.querySelectorAll('.agent-list__footer button')].find((b) => b.textContent.trim() === 'Add' && !b.disabled);
          if (!addBtn) return stop('❌ Tombol Add tidak aktif');
          addBtn.click();

          setTimeout(() => {
            updateStatus('📩 Klik OK setelah assign...');
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
