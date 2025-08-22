// --- SIMULATED DATABASE ---
const users = [
    { username: 'medico', password: '123', role: 'medico', nome: 'Dr. Carlos (Logado)' },
    { username: 'secretaria', password: '123', role: 'secretaria', nome: 'Ana (Secretária)' },
];
let currentUser = null;

let medicos = [
    { id: 1, nome: 'Dr. Carlos Andrade', especialidade: 'Cardiologia', crm: '12345-SP' },
    { id: 2, nome: 'Dra. Ana Beatriz', especialidade: 'Dermatologia', crm: '54321-RJ' },
];
let pacientes = [
    { id: 1, nome: 'João da Silva', dtNasc: '1985-02-20', cpf: '111.222.333-44', contato: '(11) 98765-4321' },
    { id: 2, nome: 'Maria Pereira', dtNasc: '1992-07-15', cpf: '444.555.666-77', contato: '(21) 91234-5678' },
];
let exames = [
    { id: 1, nome: 'Eletrocardiograma', tipo: 'Cardiológico', descricao: 'Avalia a atividade elétrica do coração.' },
    { id: 2, nome: 'Hemograma Completo', tipo: 'Laboratorial', descricao: 'Análise das células sanguíneas.' },
];
let consultas = [
    { id: 1, pacienteId: 1, medicoId: 1, data: '2025-08-25T10:00', status: 'Agendada', parecer: '' },
    { id: 2, pacienteId: 2, medicoId: 2, data: '2025-08-26T14:30', status: 'Realizada', parecer: 'Paciente apresenta quadro estável. Retornar em 6 meses.' },
];
let nextIds = { medico: 3, paciente: 3, exame: 3, consulta: 3 };

// --- AUTHENTICATION & PERMISSIONS ---
function applyRolePermissions() {
    const addPacienteContainer = document.getElementById('add-paciente-container');
    const addMedicoContainer = document.getElementById('add-medico-container');

    if (currentUser && currentUser.role === 'medico') {
        addPacienteContainer.classList.add('hidden');
        addMedicoContainer.classList.add('hidden');
    } else {
        addPacienteContainer.classList.remove('hidden');
        addMedicoContainer.classList.remove('hidden');
    }
}

document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        currentUser = user;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-screen').classList.remove('hidden');
        document.getElementById('user-info').textContent = `Bem-vindo(a), ${currentUser.nome}`;
        applyRolePermissions();
        renderAll();
    } else {
        errorDiv.classList.remove('hidden');
    }
});

document.getElementById('logout-button').addEventListener('click', function() {
    currentUser = null;
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
    document.getElementById('login-form').reset();
    document.getElementById('login-error').classList.add('hidden');
});


// --- RENDER FUNCTIONS ---
function renderAll() {
    renderMedicosTable();
    renderPacientesTable();
    renderExamesTable();
    renderAgendaTable();
}

function renderMedicosTable() {
    const tbody = document.getElementById('medicos-table-body');
    tbody.innerHTML = medicos.map(medico => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">${medico.nome}</td>
            <td class="py-3 px-4">${medico.especialidade}</td>
            <td class="py-3 px-4">${medico.crm}</td>
        </tr>
    `).join('');
}

function renderPacientesTable() {
    const tbody = document.getElementById('pacientes-table-body');
    tbody.innerHTML = pacientes.map(paciente => `
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
    tbody.innerHTML = exames.map(exame => `
        <tr class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">${exame.nome}</td>
            <td class="py-3 px-4">${exame.tipo}</td>
            <td class="py-3 px-4">${exame.descricao}</td>
        </tr>
    `).join('');
}

function renderAgendaTable() {
    const tbody = document.getElementById('agenda-table-body');
    consultas.sort((a, b) => new Date(a.data) - new Date(b.data)); // Sort by date
    tbody.innerHTML = consultas.map(consulta => {
        const paciente = pacientes.find(p => p.id === consulta.pacienteId);
        const medico = medicos.find(m => m.id === consulta.medicoId);
        const dataFormatada = new Date(consulta.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const statusClass = consulta.status === 'Agendada' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800';

        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">${dataFormatada}</td>
                <td class="py-3 px-4">${paciente?.nome || 'Não encontrado'}</td>
                <td class="py-3 px-4">${medico?.nome || 'Não encontrado'}</td>
                <td class="py-3 px-4"><span class="px-2 py-1 text-sm font-semibold rounded-full ${statusClass}">${consulta.status}</span></td>
                <td class="py-3 px-4 text-center">
                    <button onclick="openParecerModal(${consulta.id})" class="text-blue-600 hover:text-blue-800" title="Ver/Editar Parecer">
                        <i class="fas fa-file-medical-alt fa-lg"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
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
    pacienteSelect.innerHTML = '<option value="">Selecione um paciente</option>' + pacientes.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');

    const medicoSelect = document.getElementById('consulta-medico');
    medicoSelect.innerHTML = '<option value="">Selecione um médico</option>' + medicos.map(m => `<option value="${m.id}">${m.nome} - ${m.especialidade}</option>`).join('');
}

function openParecerModal(consultaId) {
    const consulta = consultas.find(c => c.id === consultaId);
    if (!consulta) return;

    const paciente = pacientes.find(p => p.id === consulta.pacienteId);
    const medico = medicos.find(m => m.id === consulta.medicoId);
    const dataFormatada = new Date(consulta.data).toLocaleString('pt-BR');

    document.getElementById('parecer-consulta-id').value = consulta.id;
    document.getElementById('parecer-paciente-nome').textContent = paciente?.nome || 'N/A';
    document.getElementById('parecer-medico-nome').textContent = medico?.nome || 'N/A';
    document.getElementById('parecer-data').textContent = dataFormatada;
    
    const parecerTexto = document.getElementById('parecer-texto');
    const salvarBtn = document.getElementById('parecer-salvar-btn');
    
    parecerTexto.value = consulta.parecer;

    // Role-based access control
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
document.getElementById('medico-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const novoMedico = {
        id: nextIds.medico++,
        nome: document.getElementById('medico-nome').value,
        especialidade: document.getElementById('medico-especialidade').value,
        crm: document.getElementById('medico-crm').value,
    };
    medicos.push(novoMedico);
    renderMedicosTable();
    closeModal('medico-modal');
});

document.getElementById('paciente-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const novoPaciente = {
        id: nextIds.paciente++,
        nome: document.getElementById('paciente-nome').value,
        dtNasc: document.getElementById('paciente-dtnasc').value,
        cpf: document.getElementById('paciente-cpf').value,
        contato: document.getElementById('paciente-contato').value,
    };
    pacientes.push(novoPaciente);
    renderPacientesTable();
    closeModal('paciente-modal');
});

document.getElementById('exame-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const novoExame = {
        id: nextIds.exame++,
        nome: document.getElementById('exame-nome').value,
        tipo: document.getElementById('exame-tipo').value,
        descricao: document.getElementById('exame-descricao').value,
    };
    exames.push(novoExame);
    renderExamesTable();
    closeModal('exame-modal');
});

document.getElementById('consulta-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const novaConsulta = {
        id: nextIds.consulta++,
        pacienteId: parseInt(document.getElementById('consulta-paciente').value),
        medicoId: parseInt(document.getElementById('consulta-medico').value),
        data: document.getElementById('consulta-data').value,
        status: 'Agendada',
        parecer: '',
    };
    consultas.push(novaConsulta);
    renderAgendaTable();
    closeModal('consulta-modal');
});

document.getElementById('parecer-form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (currentUser && currentUser.role !== 'medico') {
        console.error("Acesso negado: apenas médicos podem salvar pareceres.");
        return;
    }

    const consultaId = parseInt(document.getElementById('parecer-consulta-id').value);
    const parecerTexto = document.getElementById('parecer-texto').value;
    
    const consulta = consultas.find(c => c.id === consultaId);
    if (consulta) {
        consulta.parecer = parecerTexto;
        if (parecerTexto.trim() !== '') {
            consulta.status = 'Realizada';
        }
    }
    renderAgendaTable();
    closeModal('parecer-modal');
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
