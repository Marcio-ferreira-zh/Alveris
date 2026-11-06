'use strict';

const KEY = 'alveris-demo-v1';
const $ = id => document.getElementById(id);
const digits = value => value.replace(/\D/g, '');
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
const cpfMask = value => digits(value).slice(0, 11)
  .replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
  .replace(/(\.\d{3})(\d)/, '$1-$2');
const phoneMask = value => {
  const number = digits(value).slice(0, 11);
  if (number.length <= 2) return number;
  const prefix = number.length === 11 ? 7 : 6;
  return '(' + number.slice(0, 2) + ') ' + number.slice(2, prefix) +
    (number.length > prefix ? '-' + number.slice(prefix) : '');
};
function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-');
}
function examples() {
  return {
    patients: [
      {id: 1, name: 'Bruno Lima', age: 35, cpf: '00000000001', phone: '62000000001', address: 'Rua Exemplo, 20', plan: 'SUS'},
      {id: 2, name: 'Lia Santos', age: 42, cpf: '00000000002', phone: '62000000002', address: 'Rua Exemplo, 40', plan: 'Convênio'},
      {id: 3, name: 'Rui Alves', age: 26, cpf: '00000000003', phone: '62000000003', address: 'Rua Exemplo, 50', plan: 'SUS'}
    ],
    doctors: [{id: 1, name: 'Dr. Carlos Mendes'}, {id: 2, name: 'Dra. Marina Costa'}],
    appointments: [
      {id: 1, patientId: 1, doctorId: 1, date: dateAfter(1), time: '15:00', status: 'Confirmado'},
      {id: 2, patientId: 2, doctorId: 2, date: dateAfter(0), time: '09:00', status: 'Aguardando', arrivedAt: Date.now() - 300000}
    ],
    encounters: [
      {id: 1, patientId: 1, doctorId: 1, startedAt: Date.now() - 604800000,
        status: 'Finalizado', notes: {complaint: 'Retorno de acompanhamento fictício',
          observations: 'Registro de exemplo para demonstração.', diagnosis: 'Avaliação simulada.'}}
    ]
  };
}
let storageAvailable = true;
function load() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    storageAvailable = false;
  }
  return examples();
}
let data = load();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}

const roles = {
  reception: ['Recepção', 'Cadastre pacientes, marque consultas e acompanhe a fila.', {
    patients: 'Pacientes', appointments: 'Agendamentos', queue: 'Fila de espera'
  }],
  patient: ['Portal do Paciente', 'Consulte as informações do paciente selecionado.', {
    upcoming: 'Agendamentos', details: 'Meus dados'
  }],
  doctor: ['Painel Médico', 'Acompanhe a fila e inicie a consulta do médico selecionado.', {
    doctorQueue: 'Fila médica'
  }]
};
const modules = {
  operations: ['Recepção e triagem', 'Do cadastro à abertura da consulta'],
  clinical: ['Prontuário e agenda', 'Registro clínico e gestão das consultas']
};
const clinicalRoles = {
  doctor: ['Painel Médico', 'Registre e finalize os atendimentos do médico selecionado.', {chart: 'Prontuário'}],
  reception: ['Recepção', 'Filtre, reagende ou cancele consultas.', {manage: 'Gestão de agendamentos'}]
};
let module = 'operations';
const availableRoles = () => module === 'operations' ? roles : clinicalRoles;
let agendaFilters = {date: '', doctorId: '', status: ''};
let agendaEdit = null;
let role = 'reception';
let page = 'patients';
let patientId = 1;
let doctorId = 1;
let editId = null;
const patient = id => data.patients.find(item => item.id === id);
const doctor = id => data.doctors.find(item => item.id === id);
const nextId = items => Math.max(0, ...items.map(item => item.id)) + 1;
const dateLabel = date => date.split('-').reverse().join('/');
const badge = status => '<span class="badge">' + escape(status) + '</span>';
const action = (type, id, label, disabled = false) =>
  '<button type="button" data-action="' + type + '" data-id="' + id + '"' +
  (disabled ? ' disabled' : '') + '>' + label + '</button>';
const options = (items, selected) => items.map(item =>
  '<option value="' + item.id + '"' + (item.id === selected ? ' selected' : '') + '>' +
  escape(item.name) + '</option>').join('');
function table(headers, rows, empty) {
  if (!rows.length) return '<p class="muted">' + empty + '</p>';
  return '<div class="scroll" tabindex="0" role="region" aria-label="Tabela de resultados"><table><thead><tr>' +
    headers.map(header => '<th scope="col">' + header + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(row => '<tr>' + row.map(cell => '<td>' + cell + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
}
function message(text, error = false) {
  $('message').textContent = text + (storageAvailable ? '' :
    ' O armazenamento local está indisponível. Os dados duram até fechar ou recarregar a página.');
  $('message').className = error ? 'error' : '';
}
function render() {
  const [name, description, pages] = availableRoles()[role];
  $('modules').innerHTML = Object.entries(modules).map(([key, [label, detail]], index) =>
    `<button data-module="${key}" aria-current="${key === module}"><span class="module-number">0${index + 1}</span><span><strong>${label}</strong><small>${detail}</small></span></button>`).join('');
  $('roles').innerHTML = Object.entries(availableRoles()).map(([key, info]) =>
    '<button data-role="' + key + '" aria-current="' + (key === role) + '">' + info[0] + '</button>').join('');
  $('tabs').innerHTML = Object.entries(pages).map(([key, label]) =>
    '<button data-page="' + key + '" aria-current="' + (key === page) + '">' + label + '</button>').join('');
  $('section').textContent = name;
  $('title').textContent = pages[page];
  $('description').textContent = description;
  $('content').innerHTML = views[page]();
  if (page === 'patients') renderPatientList();
}
function patientsView() {
  const entry = patient(editId);
  const field = (label, name, attributes = '', value = entry?.[name]) =>
    '<label>' + label + '<input name="' + name + '" required ' + attributes +
    ' value="' + escape(value) + '"></label>';
  return `<section class="panel"><h2>${entry ? 'Editar contato, endereço e cobertura' : 'Cadastrar paciente'}</h2>
  <form id="patient-form"><div class="fields">
  ${entry ? '<p><strong>' + escape(entry.name) + '</strong><br>' + cpfMask(entry.cpf) + '</p>' :
    field('Nome completo', 'name', 'maxlength="90"') +
    field('Idade', 'age', 'type="number" min="0" max="130"') +
    field('CPF fictício', 'cpf', 'inputmode="numeric" maxlength="14" placeholder="000.000.000-00"')}
  ${field('Telefone', 'phone', 'inputmode="tel" maxlength="15"', phoneMask(entry?.phone ?? ''))}
  ${field('Endereço', 'address', 'maxlength="150"')}
  <label>Cobertura<select name="plan" required><option value="">Selecione</option>
  <option ${entry?.plan === 'SUS' ? 'selected' : ''}>SUS</option>
  <option ${entry?.plan === 'Convênio' ? 'selected' : ''}>Convênio</option></select></label>
  </div><div class="actions"><button>Salvar paciente</button>${entry ? action('cancel-edit', 0, 'Cancelar') : ''}</div></form></section>
  <section class="panel"><h2>Pacientes cadastrados</h2><label>Buscar por nome ou CPF
  <input id="search" type="search" placeholder="Digite para filtrar"></label><div id="patient-list"></div></section>`;
}
function renderPatientList() {
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const search = normalize($('search').value.trim());
  const cpfQuery = /^[\d.\-\s]+$/.test(search) ? digits(search) : '';
  const rows = data.patients.filter(item => normalize(item.name).includes(search) ||
    (cpfQuery && item.cpf.includes(cpfQuery))).map(item =>
    [escape(item.name), cpfMask(item.cpf), item.age, phoneMask(item.phone),
      escape(item.plan), action('edit', item.id, 'Editar')]);
  $('patient-list').innerHTML = table(['Paciente', 'CPF fictício', 'Idade', 'Telefone', 'Cobertura', 'Ação'],
    rows, 'Nenhum paciente encontrado.');
}
function appointmentRows(items, reception) {
  return items.map(item => {
    const row = [dateLabel(item.date) + ' · ' + item.time, escape(doctor(item.doctorId).name), badge(item.status)];
    if (reception) {
      row.unshift(escape(patient(item.patientId).name));
      row.push(item.status === 'Agendado' ? action('confirm', item.id, 'Confirmar agendamento') :
        item.status === 'Confirmado' ? action('arrive', item.id, 'Confirmar chegada') : '—');
    }
    return row;
  });
}
function appointmentsView() {
  return `<section class="panel"><h2>Novo agendamento</h2><form id="appointment-form"><div class="fields">
  <label>Paciente<select name="patientId" required><option value="">Selecione</option>${options(data.patients)}</select></label>
  <label>Médico<select name="doctorId" required><option value="">Selecione</option>${options(data.doctors)}</select></label>
  <label>Data<input type="date" name="date" required min="${dateAfter(0)}" value="${dateAfter(1)}"></label>
  <label>Horário<input type="time" name="time" required value="14:00"></label>
  </div><div class="actions"><button>Revisar e agendar</button></div></form></section>
  <section class="panel"><h2>Agendamentos registrados</h2>
  ${table(['Paciente', 'Data e hora', 'Médico', 'Status', 'Ação'], appointmentRows(data.appointments, true), 'Nenhum agendamento.')}</section>`;
}
function selector(label, id, items, selected) {
  return '<section class="panel"><label>' + label + '<select id="' + id + '">' +
    options(items, selected) + '</select></label></section>';
}
function patientView() {
  const entry = patient(patientId);
  const selected = selector('Paciente simulado', 'patient-select', data.patients, patientId);
  if (page === 'details') {
    const fields = [['Nome', entry.name], ['Idade', entry.age], ['CPF fictício', cpfMask(entry.cpf)],
      ['Telefone', phoneMask(entry.phone)], ['Endereço', entry.address], ['Cobertura', entry.plan]];
    return selected + '<section class="panel"><h2>Dados cadastrais</h2><dl>' +
      fields.map(([label, value]) => '<div><dt>' + label + '</dt><dd>' + escape(value) + '</dd></div>').join('') +
      '</dl></section>';
  }
  const items = data.appointments.filter(item => item.patientId === patientId &&
    ['Agendado', 'Confirmado'].includes(item.status) && new Date(item.date + 'T' + item.time) >= new Date())
    .sort((first, second) => (first.date + first.time).localeCompare(second.date + second.time));
  return selected + '<section class="panel"><h2>Próximas consultas</h2>' +
    table(['Data e hora', 'Médico', 'Status'], appointmentRows(items, false),
      'Você não tem consultas futuras agendadas.') + '</section>';
}
const waiting = () => data.appointments.filter(item => item.status === 'Aguardando')
  .sort((first, second) => first.arrivedAt - second.arrivedAt);
const activeFor = id => data.appointments.find(item => item.doctorId === id && item.status === 'Em Atendimento');
function receptionQueue() {
  const rows = waiting().map((item, index) => [
    index + 1, escape(patient(item.patientId).name), escape(doctor(item.doctorId).name),
    dateLabel(item.date) + ' · ' + item.time,
    '<span data-arrived="' + item.arrivedAt + '">' + waitTime(item.arrivedAt) + '</span>',
    item.calledAt ? badge('Encaminhado') : action('call', item.id, 'Chamar / Encaminhar')
  ]);
  const active = data.appointments.filter(item => item.status === 'Em Atendimento');
  return '<section class="panel"><h2>Pacientes aguardando</h2>' +
    table(['Posição', 'Paciente', 'Médico', 'Horário', 'Espera', 'Ação'], rows, 'A fila está vazia.') +
    '</section><section class="panel"><h2>Consultas em andamento</h2>' +
    table(['Paciente', 'Data e hora', 'Médico', 'Status'], active.map(item =>
      [escape(patient(item.patientId).name), ...appointmentRows([item], false)[0]]),
    'Nenhuma consulta em andamento.') + '</section>';
}
function waitTime(start) {
  return Math.max(0, Math.floor((Date.now() - Number(start)) / 60000)) + ' min';
}
function doctorQueue() {
  const active = activeFor(doctorId);
  const current = active && patient(active.patientId);
  const rows = waiting().filter(item => item.doctorId === doctorId).map(item => {
    const entry = patient(item.patientId);
    return [escape(entry.name), entry.age, escape(entry.plan), dateLabel(item.date) + ' · ' + item.time,
      badge(item.calledAt ? 'Encaminhado' : 'Aguardando'),
      action('start', item.id, 'Iniciar atendimento', Boolean(active))];
  });
  return selector('Médico simulado', 'doctor-select', data.doctors, doctorId) +
    '<section class="panel"><h2>Atendimento atual</h2>' +
    (current ? '<p><strong>' + escape(current.name) + '</strong> · ' + current.age + ' anos · ' +
      escape(current.plan) + ' ' + badge(active.status) + '</p><p class="muted">A Recepção pode acompanhar o status desta consulta.</p>' :
      '<p class="muted">Nenhum atendimento iniciado.</p>') + '</section><section class="panel"><h2>Fila deste médico</h2>' +
    table(['Paciente', 'Idade', 'Cobertura', 'Horário', 'Situação', 'Ação'], rows,
      'Nenhum paciente aguardando para este médico.') + '</section>';
}
const views = {patients: patientsView, appointments: appointmentsView, queue: receptionQueue,
  upcoming: patientView, details: patientView, doctorQueue, chart: chartView, manage: agendaView};

function savePatient(form) {
  const values = Object.fromEntries(new FormData(form));
  const address = values.address.trim();
  const phone = digits(values.phone);
  if (!address || ![10, 11].includes(phone.length)) return message('Informe o endereço e um telefone com DDD.', true);
  const editable = {address, phone, plan: values.plan};
  if (editId !== null) {
    Object.assign(patient(editId), editable);
    editId = null;
    return commit('Dados do paciente atualizados.');
  }
  const name = values.name.trim();
  const cpf = digits(values.cpf);
  if (!name || cpf.length !== 11) return message('Informe o nome e um CPF fictício com 11 dígitos.', true);
  if (data.patients.some(item => item.cpf === cpf)) return message('Já existe um paciente com esse CPF.', true);
  data.patients.push({id: nextId(data.patients), name, cpf, age: Number(values.age), ...editable});
  commit('Paciente cadastrado.');
}
function saveAppointment(form) {
  const values = Object.fromEntries(new FormData(form));
  const doctorId = Number(values.doctorId);
  const patientId = Number(values.patientId);
  const {date, time} = values;
  if (new Date(date + 'T' + time) < new Date()) return message('Escolha um horário futuro.', true);
  if (data.appointments.some(item => item.doctorId === doctorId && item.date === date && item.time === time && item.status !== 'Cancelado')) {
    return message('Esse médico já tem um agendamento nessa data e horário.', true);
  }
  if (!window.confirm('Agendar ' + patient(patientId).name + ' com ' + doctor(doctorId).name +
    ' em ' + dateLabel(date) + ' às ' + time + '?')) return;
  data.appointments.push({id: nextId(data.appointments), doctorId, patientId, date, time, status: 'Agendado'});
  commit('Consulta agendada.');
}
function commit(text) {
  save();
  render();
  message(text);
}
function appointmentAction(type, id) {
  const item = data.appointments.find(entry => entry.id === id);
  if (!item) return;
  if (role === 'reception' && type === 'confirm' && item.status === 'Agendado') {
    item.status = 'Confirmado';
    commit('Agendamento confirmado.');
  } else if (role === 'reception' && type === 'arrive' && item.status === 'Confirmado') {
    item.status = 'Aguardando';
    item.arrivedAt = Date.now();
    page = 'queue';
    commit('Chegada confirmada. Paciente incluído na fila.');
  } else if (role === 'reception' && type === 'call' && item.status === 'Aguardando' && !item.calledAt) {
    item.calledAt = Date.now();
    commit('Paciente chamado e encaminhado ao médico.');
  } else if (role === 'doctor' && type === 'start' && item.status === 'Aguardando' && item.doctorId === doctorId) {
    if (activeFor(doctorId)) return message('Este médico já está em atendimento.', true);
    item.status = 'Em Atendimento';
    data.encounters.push({id: nextId(data.encounters), appointmentId: item.id,
      patientId: item.patientId, doctorId, startedAt: Date.now(), status: item.status});
    commit('Atendimento iniciado. A Recepção já pode acompanhar o status.');
  }
}

$('modules').addEventListener('click', event => {
  const button = event.target.closest('[data-module]');
  if (!button || button.dataset.module === module) return;
  module = button.dataset.module;
  role = module === 'clinical' ? 'doctor' : 'reception';
  page = module === 'clinical' ? 'chart' : 'patients';
  editId = null;
  agendaEdit = null;
  message('');
  render();
  $('modules').querySelector('[aria-current="true"]').focus();
});
$('roles').addEventListener('click', event => {
  const next = event.target.dataset.role;
  if (!next) return;
  role = next;
  page = Object.keys(availableRoles()[role][2])[0];
  if (module === 'operations' && role === 'reception' && data.appointments.some(item => item.status === 'Em Atendimento')) page = 'queue';
  editId = null;
  message('');
  render();
  $('roles').querySelector('[aria-current="true"]').focus();
});
$('tabs').addEventListener('click', event => {
  if (!event.target.dataset.page) return;
  page = event.target.dataset.page;
  editId = null;
  message('');
  render();
  $('tabs').querySelector('[aria-current="true"]').focus();
});
$('content').addEventListener('input', event => {
  if (event.target.id === 'search') renderPatientList();
  if (event.target.name === 'cpf') event.target.value = cpfMask(event.target.value);
  if (event.target.name === 'phone') event.target.value = phoneMask(event.target.value);
});
$('content').addEventListener('change', event => {
  if (event.target.form?.id === 'agenda-filters') {
    agendaFilters = Object.fromEntries(new FormData(event.target.form));
    agendaEdit = null;
    const field = event.target.name;
    render();
    $('agenda-filters').elements[field].focus();
    return;
  }
  if (event.target.id === 'patient-select') patientId = Number(event.target.value);
  else if (event.target.id === 'doctor-select') doctorId = Number(event.target.value);
  else return;
  const selectId = event.target.id;
  message('');
  render();
  $(selectId).focus();
});
$('content').addEventListener('submit', event => {
  event.preventDefault();
  if (page === 'chart' && event.target.id === 'chart-form') return saveChart(event.target, event.submitter?.value);
  if (page === 'manage' && event.target.id === 'reschedule-form') return reschedule(event.target);
  if (role !== 'reception') return;
  if (event.target.id === 'patient-form') savePatient(event.target);
  if (event.target.id === 'appointment-form') saveAppointment(event.target);
});
$('content').addEventListener('click', event => {
  const {action: type, id} = event.target.dataset;
  if (!type) return;
  if (page === 'manage') return manageAction(type, Number(id));
  if (page === 'patients' && ['edit', 'cancel-edit'].includes(type)) {
    editId = type === 'edit' ? Number(id) : null;
    message('');
    render();
    $('patient-form').querySelector('input').focus();
    return;
  }
  appointmentAction(type, Number(id));
});
$('reset').addEventListener('click', () => {
  if (!window.confirm('Restaurar os exemplos e apagar as alterações desta demonstração?')) return;
  data = examples();
  module = 'operations';
  agendaFilters = {date: '', doctorId: '', status: ''};
  agendaEdit = null;
  role = 'reception';
  page = 'patients';
  patientId = 1;
  doctorId = 1;
  editId = null;
  commit('Dados de exemplo restaurados.');
});
setInterval(() => {
  document.querySelectorAll('[data-arrived]').forEach(element => {
    element.textContent = waitTime(element.dataset.arrived);
  });
}, 15000);
save();
render();
message('');

function currentEncounter() {
  const appointment = activeFor(doctorId);
  return appointment && data.encounters.find(item =>
    item.appointmentId === appointment.id && item.doctorId === doctorId && item.status === 'Em Atendimento');
}

function prescriptionList(items) {
  return table(['Medicamento', 'Dosagem', 'Frequência', 'Duração'],
    items.map(item => [item.medicine, item.dose, item.frequency, item.duration].map(escape)),
    'Nenhum item registrado.');
}

function chartView() {
  const selected = selector('Médico simulado', 'doctor-select', data.doctors, doctorId);
  const encounter = currentEncounter();
  const records = data.encounters.filter(item => item.doctorId === doctorId && item.status === 'Finalizado' &&
    (!encounter || item.patientId === encounter.patientId)).sort((a, b) => b.startedAt - a.startedAt);
  const history = `<section class="panel"><h2>${encounter ? 'Histórico do paciente em atendimento' : 'Consultas finalizadas deste médico'}</h2>
    ${table(['Data', 'Paciente', 'Queixa', 'Médico', 'Detalhes'], records.map(item => [
      new Date(item.startedAt).toLocaleDateString('pt-BR'), escape(patient(item.patientId).name),
      escape(item.notes?.complaint || 'Sem registro'), escape(doctor(item.doctorId).name),
      `<details><summary>Ver histórico</summary>
      <p><strong>Observações</strong><br>${escape(item.notes?.observations || 'Sem registro')}</p>
      <p><strong>Diagnóstico</strong><br>${escape(item.notes?.diagnosis || 'Sem registro')}</p>
      <p><strong>Prescrição definitiva</strong></p>${prescriptionList(item.prescription ?? [])}</details>`
    ]), 'Nenhum atendimento anterior disponível.')}</section>`;
  if (!encounter) return selected + '<section class="panel"><h2>Sem consulta aberta</h2><p>Inicie uma consulta na fila médica da área Recepção e triagem.</p></section>' + history;
  const entry = patient(encounter.patientId);
  const notes = encounter.notes ?? {};
  const textarea = (name, label) => `<label>${label}<textarea name="${name}" maxlength="500" rows="3">${escape(notes[name])}</textarea></label>`;
  return selected + `<form id="chart-form">
    <section class="panel"><h2>${escape(entry.name)} · ${entry.age} anos · ${escape(entry.plan)}</h2>
    ${badge('Em Atendimento')}<p class="muted">Até 500 caracteres por campo.</p>
    <div class="fields">${textarea('complaint', 'Queixa principal')}${textarea('observations', 'Observações')}${textarea('diagnosis', 'Diagnóstico')}</div>
    <div class="actions"><button name="operation" value="draft">Salvar rascunho</button></div></section>
    <section class="panel"><h2>Prescrição provisória</h2><p class="muted">Preencha com informações fictícias.</p>
    ${prescriptionList(encounter.prescription ?? [])}
    <div class="fields prescription-fields"><label>Medicamento fictício<input name="medicine" maxlength="80"></label>
    <label>Dosagem fictícia<input name="dose" maxlength="80"></label>
    <label>Frequência<input name="frequency" maxlength="80"></label>
    <label>Duração<input name="duration" maxlength="80"></label></div>
    <div class="actions"><button name="operation" value="add">Adicionar item</button></div></section>
    <section class="panel"><h2>Encerramento da consulta</h2><p>Ao finalizar, o prontuário e a prescrição ficam disponíveis para consulta no histórico.</p>
    <button name="operation" value="finish">Finalizar atendimento</button></section></form>` + history;
}

function saveChart(form, operation = 'draft') {
  const encounter = currentEncounter();
  if (module !== 'clinical' || role !== 'doctor' || !encounter) return;
  const values = Object.fromEntries(new FormData(form));
  const notes = {complaint: values.complaint.trim(), observations: values.observations.trim(), diagnosis: values.diagnosis.trim()};
  if (Object.values(notes).some(value => value.length > 500)) return message('Respeite o limite de 500 caracteres por campo.', true);
  const item = {medicine: values.medicine.trim(), dose: values.dose.trim(),
    frequency: values.frequency.trim(), duration: values.duration.trim()};
  const hasPendingItem = Object.values(item).some(Boolean);
  if (operation === 'add') {
    if (!Object.values(item).every(Boolean)) return message('Preencha os quatro campos da prescrição.', true);
    (encounter.prescription ??= []).push(item);
  }
  if (operation === 'finish') {
    if (hasPendingItem) return message('Adicione o item preenchido à prescrição ou limpe seus campos antes de finalizar.', true);
    if (!notes.diagnosis) return message('Preencha o diagnóstico para finalizar a consulta.', true);
    if (!window.confirm('Finalizar o atendimento e encerrar a edição do prontuário?')) return;
    encounter.status = 'Finalizado';
    encounter.finishedAt = Date.now();
    activeFor(doctorId).status = 'Finalizado';
  }
  encounter.notes = notes;
  if (operation === 'draft') {
    save();
    return message('Rascunho salvo.');
  }
  commit(operation === 'add' ? 'Item incluído na prescrição provisória.' : 'Atendimento finalizado.');
}

const editableAppointment = item => ['Agendado', 'Confirmado'].includes(item.status);
function agendaView() {
  const filters = agendaFilters;
  const statuses = ['Agendado', 'Confirmado', 'Aguardando', 'Em Atendimento', 'Finalizado', 'Cancelado'];
  const items = data.appointments.filter(item =>
    (!filters.date || item.date === filters.date) &&
    (!filters.doctorId || item.doctorId === Number(filters.doctorId)) &&
    (!filters.status || item.status === filters.status))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const editing = data.appointments.find(item => item.id === agendaEdit && editableAppointment(item));
  return `<section class="panel"><h2>Filtros da agenda</h2>
    <form id="agenda-filters" class="fields"><label>Data<input type="date" name="date" value="${escape(filters.date)}"></label>
    <label>Médico<select name="doctorId"><option value="">Todos</option>${options(data.doctors, Number(filters.doctorId))}</select></label>
    <label>Status<select name="status"><option value="">Todos</option>${statuses.map(status =>
      `<option ${status === filters.status ? 'selected' : ''}>${status}</option>`).join('')}</select></label></form></section>
    ${editing ? `<section class="panel"><h2>Reagendar ${escape(patient(editing.patientId).name)}</h2>
    <form id="reschedule-form"><div class="fields"><label>Nova data<input type="date" name="date" min="${dateAfter(0)}" value="${editing.date}" required></label>
    <label>Novo horário<input type="time" name="time" value="${editing.time}" required></label></div>
    <div class="actions"><button>Salvar horário</button>${action('close-edit', editing.id, 'Voltar')}</div></form></section>` : ''}
    <section class="panel"><h2>Consultas registradas</h2>
    ${table(['Paciente', 'Data e hora', 'Médico', 'Status', 'Ações'], items.map(item => [
      escape(patient(item.patientId).name), ...appointmentRows([item], false)[0].slice(0, 2),
      badge(item.status) + (item.cancelReason ? '<br><small>' + escape(item.cancelReason) + '</small>' : ''),
      editableAppointment(item) ? '<div class="actions">' + action('reschedule', item.id, 'Reagendar') +
        action('cancel-appointment', item.id, 'Cancelar consulta') + '</div>' : '—'
    ]), 'Nenhuma consulta para os filtros selecionados.')}</section>`;
}

function manageAction(type, id) {
  const item = data.appointments.find(entry => entry.id === id);
  if (module !== 'clinical' || role !== 'reception' || !item || !editableAppointment(item)) return;
  if (type === 'reschedule' || type === 'close-edit') {
    agendaEdit = type === 'reschedule' ? id : null;
    message('');
    render();
    $('reschedule-form')?.elements.date.focus();
  } else if (type === 'cancel-appointment') {
    const reason = window.prompt('Cancelar a consulta de ' + patient(item.patientId).name +
      '? Informe o motivo e pressione OK para confirmar.');
    if (reason === null) return;
    if (!reason.trim()) return message('Informe o motivo do cancelamento.', true);
    item.status = 'Cancelado';
    item.cancelReason = reason.trim().slice(0, 200);
    item.cancelledAt = Date.now();
    agendaEdit = null;
    commit('Consulta cancelada. O registro foi mantido na agenda.');
  }
}

function reschedule(form) {
  const item = data.appointments.find(entry => entry.id === agendaEdit);
  if (module !== 'clinical' || role !== 'reception' || !item || !editableAppointment(item)) return;
  const {date, time} = Object.fromEntries(new FormData(form));
  if (new Date(date + 'T' + time) < new Date()) return message('Escolha um horário futuro.', true);
  if (data.appointments.some(entry => entry.id !== item.id && entry.doctorId === item.doctorId &&
    entry.date === date && entry.time === time && entry.status !== 'Cancelado')) {
    return message('Esse médico já tem um agendamento nessa data e horário.', true);
  }
  item.date = date;
  item.time = time;
  agendaEdit = null;
  commit('Horário atualizado.');
}
