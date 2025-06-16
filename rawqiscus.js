  let keyword = 'tunas toyota batu tulis';
  let intervalMinutes = 1;
  let running = false;
  let paused = false;
  let standbyInterval = null;
  const AGENT_TEXT = 'amru batu tulis';
  const counters = { checked: 0, assigned: 0, startTime: null };

  function createSidebar() {
    const upperSidebar = document.querySelector('.app-sidebar__upper');
    if (!upperSidebar || document.getElementById('assign-left-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'assign-left-panel';
    panel.innerHTML = `
      <div style="margin: 12px; padding: 10px; background: #fff; border-radius: 8px; font-size: 13px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h4 style="margin: 0 0 8px 0;">📌 Auto Assign Panel</h4>
        <div id="status">Status: ⏹️</div>
        <div id="stats"></div>
        <label>Teks:</label>
        <input id="keyInput" value="${keyword}" style="width: 100%; padding: 4px; margin-bottom: 6px;" />
        <label>Interval (m):</label>
        <input id="intervalInput" type="number" min="1" value="${intervalMinutes}" style="width: 100%; padding: 4px; margin-bottom: 6px;" />
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          <button id="pauseBtn" style="flex:1; ${btnStyle()}">Pause</button>
          <button id="continueBtn" style="flex:1; ${btnStyle('green')}">Continue</button>
          <button id="stopBtn" style="flex:1; ${btnStyle('red')}">Stop</button>
          <button id="saveBtn" style="flex:1; ${btnStyle('gray')}">💾 Simpan</button>
        </div>
      </div>`;

    upperSidebar.appendChild(panel);

    document.getElementById('pauseBtn').onclick = () => {
      paused = true;
      running = false;
      clearInterval(standbyInterval);
      updateStatus('⏸️ Dijeda');
    };
    document.getElementById('continueBtn').onclick = () => {
      if (!running) {
        paused = false;
        running = true;
        counters.checked = 0;
        counters.assigned = 0;
        counters.startTime = Date.now();
        updateStatus('▶️ Berjalan');
        processCurrentRoom();
        standbyWatcher();
      }
    };
    document.getElementById('stopBtn').onclick = () => {
      paused = false;
      running = false;
      clearInterval(standbyInterval);
      updateStatus('⛔ Dihentikan');
    };
    document.getElementById('saveBtn').onclick = () => {
      keyword = document.getElementById('keyInput').value.toLowerCase();
      intervalMinutes = Math.max(1, parseInt(document.getElementById('intervalInput').value));
      alert('✅ Disimpan!');
    };

    updateStatus('⏹️ Siap');
  }

  function updateStatus(text) {
    const el = document.getElementById('status');
    if (el) el.innerText = `Status: ${text}`;
    const dur = ((Date.now() - (counters.startTime || Date.now())) / 1000).toFixed(1);
    const stats = document.getElementById('stats');
    if (stats) stats.innerHTML = `✔️ Cek: ${counters.checked}, ✅ Assign: ${counters.assigned}, ⏱️ ${dur}s`;
  }

  function btnStyle(color = 'blue') {
    const c = {
      blue: '#2196f3', green: '#4caf50', red: '#f44336', gray: '#9e9e9e',
    }[color];
    return `background:${c};color:#fff;border:none;padding:4px;border-radius:4px;font-size:12px;cursor:pointer;`;
  }

  function standbyWatcher() {
    standbyInterval = setInterval(() => {
      if (!running && !paused) {
        running = true;
        updateStatus('🔁 Auto mulai...');
        processCurrentRoom();
      }
    }, intervalMinutes * 60 * 1000);
  }

  function processCurrentRoom() {
    if (!running || paused) return;

    const active = document.querySelector('.room-item.active');
    if (!active) return updateStatus('❌ Tidak ada chat aktif');

    counters.checked++;
    updateStatus(`🔍 Cek teks: "${keyword}"...`);
    setTimeout(() => {
      const msgs = [...document.querySelectorAll('.qcw-comment__content')].map(e => e.innerText.toLowerCase());
      if (msgs.some(txt => txt.includes(keyword))) {
        counters.assigned++;
        updateStatus('✅ Teks cocok. Assign...');
        assignToAmru(() => {
          updateStatus('✔️ Assign selesai');
          nextRoom(processCurrentRoom);
        });
      } else {
        updateStatus('➡️ Lanjut ke chat berikutnya');
        nextRoom(processCurrentRoom);
      }
    }, 1000);
  }

  function nextRoom(cb) {
    const curr = document.querySelector('.room-item.active');
    const next = curr?.nextElementSibling;
    if (next) {
      next.click();
      setTimeout(cb, 800);
    } else {
      updateStatus('🏁 Selesai. Standby...');
      running = false;
    }
  }

  function assignToAmru(cb) {
    if (typeof openMenuAssign !== 'function') return updateStatus('⚠️ Menu assign tidak ditemukan');
    openMenuAssign();
    setTimeout(() => {
      const add = [...document.querySelectorAll('#menu-assign li a')].find(a => a.textContent.includes('Add Agent'));
      if (!add) return updateStatus('❌ Add Agent tidak ditemukan');
      add.click();
      setTimeout(() => {
        const agent = [...document.querySelectorAll('.agent-container ul li p[title]')].find(p => p.title.toLowerCase().includes(AGENT_TEXT));
        if (!agent) return updateStatus('❌ Agent tidak ditemukan');
        agent.closest('li').click();
        setTimeout(() => {
          const btn = [...document.querySelectorAll('.agent-list__footer button')].find(b => b.textContent.includes('Add'));
          if (!btn || btn.disabled) return updateStatus('❌ Tombol Add tidak aktif');
          btn.click();
          setTimeout(() => {
            const ok = document.querySelector('.swal2-confirm');
            if (ok) ok.click();
            setTimeout(cb, 1000);
          }, 600);
        }, 600);
      }, 1000);
    }, 500);
  }

  // Aktifkan panel saat tombol / ditekan
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !document.getElementById('assign-left-panel')) createSidebar();
  });
