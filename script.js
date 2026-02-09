let db;
const request = indexedDB.open("HabitAppDB", 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore("habits", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = (e) => {
    db = e.target.result;
    render();
};

function addHabit() {
    const name = document.getElementById("habitInput").value;
    if (!name) return;

    const transaction = db.transaction(["habits"], "readwrite");
    transaction.objectStore("habits").add({ name, count: 0, lastDate: "" });
    
    transaction.oncomplete = () => {
        document.getElementById("habitInput").value = "";
        render();
    };
}

function toggleHabit(id) {
    const transaction = db.transaction(["habits"], "readwrite");
    const store = transaction.objectStore("habits");
    const req = store.get(id);

    req.onsuccess = () => {
        const data = req.result;
        const today = new Date().toLocaleDateString();
        
        if (data.lastDate !== today) {
            data.count++;
            data.lastDate = today;
            store.put(data);
        }
    };
    transaction.oncomplete = render;
}

function render() {
    const list = document.getElementById("habitList");
    list.innerHTML = "";
    let all = [];

    db.transaction("habits").objectStore("habits").openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const h = cursor.value;
            all.push(h);
            const today = new Date().toLocaleDateString();
            const done = h.lastDate === today;

            list.innerHTML += `
                <div class="habit-card" style="opacity: ${done ? 0.6 : 1}">
                    <div class="habit-info">
                        <h3>${h.name}</h3>
                        <p>${done ? '✨ Feito por hoje' : 'Pendente'}</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px">
                        <strong>${h.count}d</strong>
                        <button class="btn-check ${done ? 'done' : ''}" onclick="toggleHabit(${h.id})">
                            ${done ? '✓' : '+'}
                        </button>
                    </div>
                </div>
            `;
            cursor.continue();
        } else {
            updateProgress(all);
        }
    };
}

function updateProgress(habits) {
    const today = new Date().toLocaleDateString();
    const done = habits.filter(h => h.lastDate === today).length;
    const percent = habits.length ? Math.round((done / habits.length) * 100) : 0;
    
    document.getElementById("progressBarFill").style.width = percent + "%";
    document.getElementById("progressPercent").innerText = percent + "%";
}