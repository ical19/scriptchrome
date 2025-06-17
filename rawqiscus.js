    let keyword = 'tunas toyota batu tulis';
    let intervalMinutes = 1;
    let running = false;
    let paused = false;
    let standbyInterval = null;

    const AGENT_TEXT = 'amru batu tulis';
    const counters = { checked: 0, assigned: 0, startTime: null };

    const iosGreen = '#34C759';
    const iosGray = '#F2F2F7';
    const iosFont = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

    function btnStyle(color = 'default') {
        const colors = {
            default: iosGray,
            green: iosGreen,
            red: '#FF3B30',
            dark: '#1C1C1E',
        };
        return `
      padding: 6px 14px;
      background-color: ${colors[color]};
      color: ${color === 'dark' ? '#fff' : '#000'};
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      font-family: ${iosFont};
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
      background: white;
      border-radius: 18px;
      padding: 0;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      font-family: ${iosFont};
      font-size: 14px;
      z-index: 99999;
      width: 340px;
      overflow: hidden;
    `;
        modal.innerHTML = `
      <div id="modal-header" style="background: ${iosGreen}; padding: 10px 12px; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div id="duration-text" style="font-size: 13px; font-weight: bold;">⏱️ 0s</div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <span id="setting-toggle" style="cursor:pointer;">⚙️</span>
          <span id="log-toggle" style="cursor:pointer;">📜</span>
          <span id="close-btn" style="cursor:pointer;">❌</span>
        </div>
      </div>
      <div style="padding: 16px;">
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <button id="pause-btn" style="${btnStyle('default')}">Pause</button>
          <button id="continue-btn" style="${btnStyle('green')}">Continue</button>
          <button id="stop-btn" style="${btnStyle('red')}">Stop</button>
        </div>
        <div id="process-status-text" style="color: #333; font-weight: 500; margin-bottom: 8px;">Memulai...</div>
        <div style="display:flex; justify-content: space-between; margin-bottom: 10px;">
          <div style="font-size: 28px; font-weight: bold; color: #000;">🔄 <span id="count-checked">0</span></div>
          <div style="font-size: 28px; font-weight: bold; color: ${iosGreen};">✅ <span id="count-assigned">0</span></div>
        </div>
        <div id="setting-panel" style="display: none;">
          <label>Kata kunci:</label>
          <input id="keyword-input" type="text" value="${keyword}" style="width: 100%; padding: 6px; border-radius: 10px; border: 1px solid #ccc;">
          <label style="margin-top: 10px; display:block;">Interval ulang (menit):</label>
          <input id="interval-input" type="number" value="${intervalMinutes}" min="1" style="width: 100%; padding: 6px; border-radius: 10px; border: 1px solid #ccc;">
          <button id="save-config" style="${btnStyle('green')}; width: 100%; margin-top: 10px;">Simpan</button>
        </div>
      </div>
    `;

        document.body.appendChild(modal);
        makeDraggable(modal, document.getElementById('modal-header'));
        setupModalEvents();
    }

    function makeDraggable(elmnt, dragHandle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            const newTop = elmnt.offsetTop - pos2;
            const newLeft = elmnt.offsetLeft - pos1;
            elmnt.style.top = newTop + 'px';
            elmnt.style.left = newLeft + 'px';

            // Sinkronkan posisi log modal jika aktif
            const logModal = document.getElementById('qiscus-log-modal');
            if (logModal && logModal.style.display !== 'none') {
                logModal.style.top = newTop + 'px';
                logModal.style.left = (newLeft + elmnt.offsetWidth + 10) + 'px';
            }
        }


        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }


    function setupModalEvents() {
        document.getElementById('pause-btn').onclick = () => { paused = true; running = false; clearInterval(standbyInterval); updateStatus('⏸️ Dijeda'); };
        document.getElementById('continue-btn').onclick = () => { if (!running) { paused = false; running = true; updateStatus('▶️ Lanjut...'); processRooms(); } };
        document.getElementById('stop-btn').onclick = () => { paused = false; running = false; clearInterval(standbyInterval); updateStatus('⛔ Dihentikan'); };
        document.getElementById('close-btn').onclick = () => document.getElementById('qiscus-status-modal').remove();
        document.getElementById('save-config').onclick = () => {
            keyword = document.getElementById('keyword-input').value.toLowerCase();
            intervalMinutes = Math.max(1, parseInt(document.getElementById('interval-input').value));
            alert('✅ Konfigurasi disimpan.');
        };
        document.getElementById('close-btn').onclick = () => {
            document.getElementById('qiscus-status-modal').style.display = 'none';
            const logModal = document.getElementById('qiscus-log-modal');
            if (logModal) logModal.style.display = 'none';
        };
        document.getElementById('setting-toggle').onclick = () => {
            const panel = document.getElementById('setting-panel');
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        };
        document.getElementById('log-toggle').onclick = toggleLogModal;
    }

    function updateStatus(text) {
        const el = document.getElementById('process-status-text');
        if (el) el.textContent = text;
        updateStats();
    }

    function updateStats() {
        const dur = ((Date.now() - counters.startTime) / 1000).toFixed(1);
        const checked = document.getElementById('count-checked');
        const assigned = document.getElementById('count-assigned');
        const duration = document.getElementById('duration-text');
        if (checked) checked.textContent = counters.checked;
        if (assigned) assigned.textContent = counters.assigned;
        if (duration) duration.textContent = `⏱️ ${dur}s`;
    }

    function appendLog(name, status) {
        const log = document.getElementById('qiscus-log-modal');
        if (!log) return;
        const entry = document.createElement('div');
        entry.style.whiteSpace = 'pre';
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${name} => ${status}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }

    function createLogModal() {
        if (document.getElementById('qiscus-log-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'qiscus-log-modal';
        modal.style.cssText = `
      position: fixed;
      top: 80px;
      right: 400px;
      width: 380px;
      height: 320px;
      background: #1e1e1e;
      color: #33FF33;
      font-family: monospace;
      font-size: 13px;
      border-radius: 12px;
      overflow-y: auto;
      white-space: pre;
      z-index: 99998;
      display: none;
    `;
        modal.innerHTML = `<div style="padding: 6px 10px; background: #333; color: #fff; font-weight: bold;"><i class="bi bi-file-earmark"></i> Log Aktivitas</div>`;
        document.body.appendChild(modal);
    }


    function toggleLogModal() {
        const modal = document.getElementById('qiscus-log-modal');
        if (modal) modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
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
                updateStatus('🔄 Standby aktif');
                processRooms();
            }
        }, intervalMinutes * 60000);
    }

    function processCurrentRoom() {
        if (!running || paused) return;

        const active = document.querySelector('.room-item.active');
        const name = active?.querySelector('.room-detail__name div[title]')?.getAttribute('title') || 'Unknown';

        counters.checked++;
        updateStatus(`🔍 Mencari "${keyword.toUpperCase()}"...`);

        setTimeout(() => {
            const messages = [...document.querySelectorAll('.qcw-comment__content')].map(e => e.innerText.toLowerCase());
            if (messages.some(txt => txt.includes(keyword))) {
                updateStatus('✅ Teks ditemukan. Assign...');
                counters.assigned++;
                appendLog(name, '✔️ Ditambahkan ke agent');
                assignAmru(() => gotoNextRoom(processCurrentRoom));
            } else {
                appendLog(name, '❌ Kata kunci tidak terdeteksi');
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
            createLogModal();
            updateStatus('🔄 Memulai...');
            processRooms();
            standbyWatcher();
        }
    });
