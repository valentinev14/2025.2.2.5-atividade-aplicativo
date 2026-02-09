// Configuração do Banco de Dados
let db;
const dbName = "DreamyHabitsDB";

// 1. Conexão com IndexedDB
const request = indexedDB.open(dbName, 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("habits")) {
        db.createObjectStore("habits", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    renderHabits();
};

// 2. Adicionar Hábito
function addHabit() {
    const input = document.getElementById("habitInput");
    const name = input.value.trim();

    if (!name) return;

    const transaction = db.transaction(["habits"], "readwrite");
    const store = transaction.objectStore("habits");

    const newHabit = {
        name: name,
        count: 0,
        lastUpdated: null
    };

    store.add(newHabit);
    transaction.oncomplete = () => {
        input.value = "";
        renderHabits();
    };
}

// 3. Marcar Hábito (Check)
function checkHabit(id) {
    const transaction = db.transaction(["habits"], "readwrite");
    const store = transaction.objectStore("habits");
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
        const data = getRequest.result;
        const today = new Date().toLocaleDateString();

        if (data.lastUpdated !== today) {
            data.count++;
            data.lastUpdated = today;
            store.put(data);
        }
    };

    transaction.oncomplete = () => {
        renderHabits();
    };
}

// 4. Atualizar Barra de Progresso Iridescente
function updateProgressBar(habits) {
    const total = habits.length;
    const today = new Date().toLocaleDateString();
    const fill = document.getElementById("progressBarFill");
    const text = document.getElementById("progressPercent");

    if (total === 0) {
        fill.style.width = "0%";
        text.innerText = "0%";
        return;
    }

    const completedToday = habits.filter(h => h.lastUpdated === today).length;
    const percentage = Math.round((completedToday / total) * 100);
    
    fill.style.width = percentage + "%";
    text.innerText = percentage + "%";
}

// 5. Renderização Dinâmica (Construção do HTML)
function renderHabits() {
    const habitList = document.getElementById("habitList");
    habitList.innerHTML = "";
    const allHabits = [];

    const transaction = db.transaction(["habits"], "readonly");
    const store = transaction.objectStore("habits");

    store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
            const habit = cursor.value;
            allHabits.push(habit);
            
            const today = new Date().toLocaleDateString();
            const isDoneToday = habit.lastUpdated === today;

            // Criando o elemento HTML conforme a estética solicitada
            const habitCard = document.createElement("div");
            habitCard.className = "habit-card";
            if (isDoneToday) habitCard.style.opacity = "0.6";

            habitCard.innerHTML = `
                <div class="habit-info">
                    <h3>${habit.name}</h3>
                    <small>${isDoneToday ? '✨ Brilhando hoje' : 'Ainda não praticado'}</small>
                </div>
                <div style="display:flex; align-items:center;">
                    <span class="count-badge">${habit.count} 🐚</span>
                    <button class="btn-check" 
                            onclick="checkHabit(${habit.id})" 
                            ${isDoneToday ? 'disabled' : ''}>
                        ${isDoneToday ? '⭐' : '+'}
                    </button>
                    <button onclick="deleteHabit(${habit.id})" 
                            style="background:none; border:none; margin-left:10px; cursor:pointer; font-size:12px; opacity:0.4;">
                        ✕
                    </button>
                </div>
            `;
            
            habitList.appendChild(habitCard);
            cursor.continue();
        } else {
            updateProgressBar(allHabits);
        }
    };
}

// 6. Função Extra: Deletar Hábito
function deleteHabit(id) {
    const transaction = db.transaction(["habits"], "readwrite");
    const store = transaction.objectStore("habits");
    store.delete(id);
    transaction.oncomplete = () => renderHabits();
}

// 7. Lógica do Menu Inferior
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelector('.nav-item.active').classList.remove('active');
        this.classList.add('active');
    });
});