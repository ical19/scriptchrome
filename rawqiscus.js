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
      flex: 1;
    `;
  }

  function createStatusModal() {
    let modal = document.getElementById('process-status-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'process-status-modal';
    modal.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffffff;
      border-radius: 12px;
      padding: 16px 24px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font-family: "Roboto", sans-serif;
      font-size: 14px;
      z-index: 99999;
      min-width: 300px;
      max-width: 90%;
      cursor: move;
    `;
    modal.innerHTML = `
      <div id="modal-header" style="cursor: move;"><strong style="font-size: 16px; color: #333;">Status proses</strong></div>
      <div id="process-status-text" style="margin: 8px 0; color: #444;">Memulai...</div>
      <div id="process-stats" style="font-size: 13px; color: #555;"></div>
      <div style="margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap;">
        <button id="pause-btn" style="${btnStyle()}">Pause</button>
        <button id="continue-btn" style="${btnStyle('green')}">Continue</button>
        <button id="stop-btn" style="${btnStyle('red')}">Stop</button>
        <button id="close-btn" style="${btnStyle('gray')}">Close</button>
      </div>
      <div style="margin-top: 12px;">
        <label>Cari teks:</label><br>
        <input id="keyword-input" type="text" value="${keyword}" style="width:100%; margin-top:4px; padding:4px;" />
        <br><br>
        <label>Interval cek ulang (menit):</label><br>
        <input id="interval-input" type="number" value="${intervalMinutes}" min="1" style="width:100%; margin-top:4px; padding:4px;" />
        <br><br>
        <button id="save-config" style="${btnStyle()} width:100%; margin-top:6px;">Simpan</button>
      </div>
    `;
    document.body.appendChild(modal);

    makeModalDraggable(modal);

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
    document.getElementById('close-btn').onclick = () => modal.remove();

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
        ⏱️ Durasi: <b>${dur}s</b>
      `;
    }
  }

  function standbyWatcher() {
    standbyInterval = setInterval(() => {
      if (!running && !paused) {
        console.log(`[AUTO-SCAN] Mulai ulang pengecekan...`);
        const firstRoom = document.querySelector('.room-item');
        if (firstRoom) {
          firstRoom.click();
          setTimeout(() => {
            running = true;
            counters.checked = 0;
            counters.assigned = 0;
            counters.startTime = Date.now();
            updateStatus('🔁 Standby aktif: memulai dari awal...');
            processCurrentRoom();
          }, 1000);
        } else {
          console.warn('❌ Tidak ada room-item ditemukan.');
        }
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
      updateStatus('🔧 Klik Add Agent...');
      const addAgent = [...document.querySelectorAll('#menu-assign li a')].find(a => a.textContent.trim() === 'Add Agent');
      if (!addAgent) return stop('❌ Tombol Add Agent tidak ditemukan');
      addAgent.click();

      setTimeout(() => {
        updateStatus('👥 Mencari agent Amru...');
        const agentLi = [...document.querySelectorAll('.agent-container ul li')].find(li => {
          const p = li.querySelector('p[title]');
          return p && p.title.toLowerCase().includes(AGENT_TEXT);
        });
        if (!agentLi) return stop('❌ Agent Amru tidak ditemukan');
        agentLi.click();

        setTimeout(() => {
          updateStatus('✅ Klik tombol Add...');
          const addBtn = [...document.querySelectorAll('.agent-list__footer button')].find(b => b.textContent.trim() === 'Add' && !b.disabled);
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
