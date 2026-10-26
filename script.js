const windows = document.querySelectorAll('.window');
const icons = document.querySelectorAll('.icon');
const tasks = document.querySelectorAll('.task');

const startBtn = document.getElementById('start');
const startMenu = document.getElementById('start-menu');
const shutdownBtn = document.getElementById('shutdown-btn');
const shutdownYes = document.getElementById('shutdown-yes');
const shutdownEl = document.getElementById('shutdown');
const dimEl = document.getElementById('dim');
const bootEl = document.getElementById('boot');
const clockEl = document.getElementById('clock');

let topZ = 10;
let placedCount = 0;

function getTask(win) {
    return document.querySelector(`[data-task="${win.id}"]`);
}

function placeWindow(win) {
    const offset = placedCount * 24;
    const left = (window.innerWidth - win.offsetWidth) / 2 + offset;
    const top = (window.innerHeight - 32 - win.offsetHeight) / 2 + offset;

    win.style.left = `${Math.max(8, left)}px`;
    win.style.top = `${Math.max(8, top)}px`;
    win.dataset.placed = 'true';
    placedCount++;
}

function focusWindow(win) {
    windows.forEach(w => w.classList.remove('active'));
    tasks.forEach(task => task.classList.remove('active'));

    topZ++;
    win.style.zIndex = topZ;
    win.classList.add('active');
    getTask(win).classList.add('active');
}

function openWindow(id) {
    const win = document.getElementById(id);

    win.hidden = false;
    getTask(win).hidden = false;

    if (!win.dataset.placed) {
        placeWindow(win);
    }

    focusWindow(win);
}

function minimizeWindow(win) {
    win.hidden = true;
    win.classList.remove('active');
    getTask(win).classList.remove('active');
}

function closeWindow(win) {
    minimizeWindow(win);
    win.classList.remove('maximized');
    getTask(win).hidden = true;

    if (win.id === 'shutdown-dialog') {
        dimEl.hidden = true;
    }
}

function makeDraggable(win) {
    const titleBar = win.querySelector('.title-bar');

    titleBar.addEventListener('pointerdown', e => {
        if (e.target.closest('button') || win.classList.contains('maximized')) return;

        const startX = e.clientX - win.offsetLeft;
        const startY = e.clientY - win.offsetTop;

        function move(e) {
            const maxTop = window.innerHeight - 32 - titleBar.offsetHeight;

            win.style.left = `${e.clientX - startX}px`;
            win.style.top = `${Math.min(maxTop, Math.max(0, e.clientY - startY))}px`;
        }

        function stop() {
            titleBar.removeEventListener('pointermove', move);
            titleBar.removeEventListener('pointerup', stop);
        }

        titleBar.setPointerCapture(e.pointerId);
        titleBar.addEventListener('pointermove', move);
        titleBar.addEventListener('pointerup', stop);
    });

    titleBar.addEventListener('dblclick', e => {
        if (e.target.closest('button') || !win.querySelector('[data-action="maximize"]')) return;
        win.classList.toggle('maximized');
    });
}

function launch(el) {
    const link = el.dataset.link;

    if (el.dataset.open) {
        openWindow(el.dataset.open);
    } else if (link.startsWith('mailto:')) {
        location.href = link;
    } else {
        window.open(link, '_blank');
    }
}

function toggleStart(open) {
    startMenu.hidden = !open;
    startBtn.classList.toggle('active', open);
}

function restart() {
    sessionStorage.removeItem('booted');
    location.reload();
}

function boot() {
    if (sessionStorage.getItem('booted')) return;

    sessionStorage.setItem('booted', 'true');
    bootEl.hidden = false;

    setTimeout(() => bootEl.classList.add('splash'), 1200);
    setTimeout(() => bootEl.hidden = true, 4000);
}

function updateClock() {
    clockEl.innerText = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

windows.forEach(win => {
    win.addEventListener('pointerdown', () => focusWindow(win));

    win.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;

            if (action === 'minimize') minimizeWindow(win);
            if (action === 'maximize') win.classList.toggle('maximized');
            if (action === 'close') closeWindow(win);
        });
    });

    makeDraggable(win);
});

icons.forEach(icon => {
    icon.addEventListener('click', () => {
        icons.forEach(i => i.classList.remove('selected'));
        icon.classList.add('selected');
    });

    icon.addEventListener('dblclick', () => launch(icon));

    icon.addEventListener('keydown', e => {
        if (e.key === 'Enter') launch(icon);
    });
});

document.querySelectorAll('.start-item[data-open], .menu-item, .button[data-open]').forEach(item => {
    item.addEventListener('click', () => {
        toggleStart(false);
        openWindow(item.dataset.open);
    });
});

tasks.forEach(task => {
    task.addEventListener('click', () => {
        const win = document.getElementById(task.dataset.task);

        if (win.hidden) {
            win.hidden = false;
            focusWindow(win);
        } else if (win.classList.contains('active')) {
            minimizeWindow(win);
        } else {
            focusWindow(win);
        }
    });
});

startBtn.addEventListener('click', () => toggleStart(startMenu.hidden));

shutdownBtn.addEventListener('click', () => {
    toggleStart(false);
    topZ++;
    dimEl.style.zIndex = topZ;
    dimEl.hidden = false;
    openWindow('shutdown-dialog');
});

shutdownYes.addEventListener('click', () => {
    const choice = document.querySelector('input[name="shutdown"]:checked').value;

    if (choice === 'restart') {
        restart();
        return;
    }

    closeWindow(document.getElementById('shutdown-dialog'));
    shutdownEl.hidden = false;
});

shutdownEl.addEventListener('click', restart);
bootEl.addEventListener('click', () => bootEl.hidden = true);

document.addEventListener('pointerdown', e => {
    if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
        toggleStart(false);
    }

    if (!e.target.closest('.icon')) {
        icons.forEach(i => i.classList.remove('selected'));
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggleStart(false);
});

updateClock();
setInterval(updateClock, 10000);
openWindow('main');
boot();
