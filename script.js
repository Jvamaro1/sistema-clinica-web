// script.js

// --- INICIALIZAÇÃO DO FIREBASE ---
// COLE AQUI O OBJETO firebaseConfig QUE VOCÊ COPIOU DO CONSOLE DO FIREBASE
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- DADOS LOCAIS (APENAS PARA CONTROLE DE UI E CACHE) ---
let localMedicos = [];
let localPacientes = [];
let localExames = [];
let localConsultas = [];
let localUsers = [];

// --- AUTENTICAÇÃO E PERMISSÕES ---
let currentUser = null;

function applyRolePermissions() {
    const addPacienteContainer = document.getElementById('add-paciente-container');
    const addMedicoContainer = document.getElementById('add-medico-container');
    const adminNavLink = document.getElementById('nav-admin');

    // Reset visibility
    addPacienteContainer.classList.remove('hidden');
    addMedicoContainer.classList.remove('hidden');
    adminNavLink.classList.add('hidden');

    if (currentUser.role === 'admin') {
        adminNavLink.classList.remove('hidden');
    }
    if (currentUser.role === 'medico') {
        addPacienteContainer.classList.add('hidden');
        addMedicoContainer.classList.add('hidden');
    }
}

document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const userQuery = await db.collection('users')
            .where('username', '==', username)
            .where('password', '==', password)
            .get();

        if (!userQuery.empty) {
            currentUser = userQuery.docs[0].data();
            errorDiv.classList.add('hidden');
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-screen').classList.remove('hidden');
            document.getElementById('user-info').textContent = `Bem-vindo(a), ${currentUser.nome}`;
            applyRolePermissions();
            loadAllDataFromFirestore();
        } else {
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Erro de login: ", error);
        errorDiv.classList.remove('hidden');
    }
});

document.getElementById('logout-button').addEventListener('click', function() {
    currentUser = null;
    // Simple logout, for real apps use Firebase Auth
    location.reload();
});

// --- CARREGAMENTO DE DADOS EM TEMPO REAL DO FIRESTORE ---
function loadAllDataFromFirestore() {
    db.collection('medicos').onSnapshot(snapshot => {
        localMedicos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMedicosTable();
    });

    db.collection('pacientes').onSnapshot(snapshot => {
        localPacientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderPacientesTable();
    });

    db.collection('exames').onSnapshot(snapshot => {
        localExames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderExamesTable();
    });

    db.collection('consultas').orderBy('data').onSnapshot(snapshot => {
        localConsultas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAgendaTable();
    });

    if (currentUser.role === 'admin') {
        db.collection('users').onSnapshot(snapshot => {
            localUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderUsersTable();
        });
    }
}


// --- FUNÇÕES DE RENDERIZAÇÃO ---
function renderMedicosTable() {
    const tbody = document.getElementById('medicos-table-body');
    tbody.innerHTML = localMedicos.map(medico => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">${medico.nome}</td>
            <td class="py-3 px-4">${medico.especialidade}</td>
            <td class="py-3 px-4">${medico.crm}</td>
        </tr>
    `).join('');
}

function renderPacientesTable() {
    const tbody = document.getElementById('pacientes-table-body');
    tbody.innerHTML = localPacientes.map(paciente => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">${paciente.nome}</td>
            <td class="py-3 px-4">${new Date(paciente.dtNasc).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
            <td class="py-3 px-4">${paciente.cpf}</td>
            <td class="py-3 px-4">${paciente.contato}</td>
        </tr>
    `).join('');
}

function renderExamesTable() {
    const tbody = document.getElementById('exames-table-body');
    tbody.innerHTML = localExames.map(exame => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">${exame.nome}</td>
            <td class="py-3 px-4">${exame.tipo}</td>
            <td class="py-3 px-4">${exame.descricao}</td>
        </tr>
    `).join('');
}

function renderAgendaTable() {
    const tbody = document.getElementById('agenda-table-body');
    tbody.innerHTML = localConsultas.map(consulta => {
        const paciente = localPacientes.find(p => p.id === consulta.pacienteId);
        const medico = localMedicos.find(m => m.id === consulta.medicoId);
        const dataFormatada = new Date(consulta.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const statusClass = consulta.status === 'Agendada' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800';

        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">${dataFormatada}</td>
                <td class="py-3 px-4">${paciente?.nome || 'Não encontrado'}</td>
                <td class="py-3 px-4">${medico?.nome || 'Não encontrado'}</td>
                <td class="py-3 px-4"><span class="px-2 py-1 text-sm font-semibold rounded-full ${statusClass}">${consulta.status}</span></td>
                <td class="py-3 px-4 text-center">
                    <button onclick="openParecerModal('${consulta.id}')" class="text-blue-600 hover:text-blue-800" title="Ver/Editar Parecer">
                        <i class="fas fa-file-medical-alt fa-lg"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = localUsers.map(user => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">${user.nome}</td>
            <td class="py-3 px-4">${user.username}</td>
            <td class="py-3 px-4 capitalize">${user.role}</td>
        </tr>
    `).join('');
}

// --- MODAL FUNCTIONS ---
function openModal(modalId) {
    if (modalId === 'consulta-modal') {
        populateConsultaModalDropdowns();
    }
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    const form = document.getElementById(`${modalId.split('-')[0]}-form`);
    if (form) form.reset();
}

function populateConsultaModalDropdowns() {
    const pacienteSelect = document.getElementById('consulta-paciente');
    pacienteSelect.innerHTML = '<option value="">Selecione um paciente</option>' + localPacientes.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');

    const medicoSelect = document.getElementById('consulta-medico');
    medicoSelect.innerHTML = '<option value="">Selecione um médico</option>' + localMedicos.map(m => `<option value="${m.id}">${m.nome} - ${m.especialidade}</option>`).join('');
}

function openParecerModal(consultaId) {
    const consulta = localConsultas.find(c => c.id === consultaId);
    if (!consulta) return;

    const paciente = localPacientes.find(p => p.id === consulta.pacienteId);
    const medico = localMedicos.find(m => m.id === consulta.medicoId);
    const dataFormatada = new Date(consulta.data).toLocaleString('pt-BR');

    document.getElementById('parecer-consulta-id').value = consulta.id;
    document.getElementById('parecer-paciente-nome').textContent = paciente?.nome || 'N/A';
    document.getElementById('parecer-medico-nome').textContent = medico?.nome || 'N/A';
    document.getElementById('parecer-data').textContent = dataFormatada;
    
    const parecerTexto = document.getElementById('parecer-texto');
    const salvarBtn = document.getElementById('parecer-salvar-btn');
    
    parecerTexto.value = consulta.parecer;

    if (currentUser && currentUser.role === 'medico') {
        parecerTexto.readOnly = false;
        parecerTexto.classList.remove('bg-gray-200');
        salvarBtn.classList.remove('hidden');
    } else {
        parecerTexto.readOnly = true;
        parecerTexto.classList.add('bg-gray-200');
        salvarBtn.classList.add('hidden');
    }
    
    openModal('parecer-modal');
}

// --- FORM SUBMISSION HANDLERS ---
document.getElementById('medico-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const novoMedico = {
        nome: document.getElementById('medico-nome').value,
        especialidade: document.getElementById('medico-especialidade').value,
        crm: document.getElementById('medico-crm').value,
    };
    try {
        await db.collection('medicos').add(novoMedico);
        closeModal('medico-modal');
    } catch (error) {
        console.error("Erro ao adicionar médico: ", error);
    }
});

document.getElementById('paciente-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const novoPaciente = {
        nome: document.getElementById('paciente-nome').value,
        dtNasc: document.getElementById('paciente-dtnasc').value,
        cpf: document.getElementById('paciente-cpf').value,
        contato: document.getElementById('paciente-contato').value,
    };
    try {
        await db.collection('pacientes').add(novoPaciente);
        closeModal('paciente-modal');
    } catch (error) {
        console.error("Erro ao adicionar paciente: ", error);
    }
});

document.getElementById('exame-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const novoExame = {
        nome: document.getElementById('exame-nome').value,
        tipo: document.getElementById('exame-tipo').value,
        descricao: document.getElementById('exame-descricao').value,
    };
    try {
        await db.collection('exames').add(novoExame);
        closeModal('exame-modal');
    } catch (error) {
        console.error("Erro ao adicionar exame: ", error);
    }
});

document.getElementById('consulta-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const novaConsulta = {
        pacienteId: document.getElementById('consulta-paciente').value,
        medicoId: document.getElementById('consulta-medico').value,
        data: document.getElementById('consulta-data').value,
        status: 'Agendada',
        parecer: '',
    };
    try {
        await db.collection('consultas').add(novaConsulta);
        closeModal('consulta-modal');
    } catch (error) {
        console.error("Erro ao agendar consulta: ", error);
    }
});
        
document.getElementById('parecer-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (currentUser && currentUser.role !== 'medico') {
        console.error("Acesso negado.");
        return;
    }

    const consultaId = document.getElementById('parecer-consulta-id').value;
    const parecerTexto = document.getElementById('parecer-texto').value;
    
    const consultaRef = db.collection('consultas').doc(consultaId);
    
    try {
        await consultaRef.update({
            parecer: parecerTexto,
            status: parecerTexto.trim() !== '' ? 'Realizada' : 'Agendada'
        });
        closeModal('parecer-modal');
    } catch (error) {
        console.error("Erro ao salvar parecer: ", error);
    }
});

document.getElementById('create-user-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
        console.error("Acesso negado. Apenas administradores podem criar usuários.");
        return;
    }
    const newUser = {
        nome: document.getElementById('new-user-nome').value,
        username: document.getElementById('new-user-username').value,
        password: document.getElementById('new-user-password').value,
        role: document.getElementById('new-user-role').value,
    };
    try {
        await db.collection('users').add(newUser);
        document.getElementById('create-user-form').reset();
    } catch (error) {
        console.error("Erro ao criar usuário: ", error);
    }
});


// --- NAVIGATION ---
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('#views-container > div');
const pageTitle = document.getElementById('page-title');
const titles = {
    'nav-agenda': 'Agenda Completa',
    'nav-pacientes': 'Cadastro de Pacientes',
    'nav-medicos': 'Cadastro de Médicos',
    'nav-exames': 'Cadastro de Exames',
    'nav-admin': 'Administração de Usuários',
};

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetViewId = link.id.replace('nav-', '') + '-view';

        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        views.forEach(view => {
            view.classList.toggle('hidden', view.id !== targetViewId);
        });
        
        pageTitle.textContent = titles[link.id];
    });
});
