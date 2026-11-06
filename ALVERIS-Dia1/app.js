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
    encounters: []
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
  const [name, description, pages] = roles[role];
  $('roles').innerHTML = Object.entries(roles).map(([key, info]) =>
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
      escape(current.plan) + ' ' + badge(active.status) + '</p><p class="muted">Finalize a demonstração deste fluxo na Recepção. A finalização da consulta pertence ao Dia 2.</p>' :
      '<p class="muted">Nenhum atendimento iniciado.</p>') + '</section><section class="panel"><h2>Fila deste médico</h2>' +
    table(['Paciente', 'Idade', 'Cobertura', 'Horário', 'Situação', 'Ação'], rows,
      'Nenhum paciente aguardando para este médico.') + '</section>';
}
const views = {patients: patientsView, appointments: appointmentsView, queue: receptionQueue,
  upcoming: patientView, details: patientView, doctorQueue};

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
  if (data.appointments.some(item => item.doctorId === doctorId && item.date === date && item.time === time)) {
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

$('roles').addEventListener('click', event => {
  const next = event.target.dataset.role;
  if (!next) return;
  role = next;
  page = Object.keys(roles[role][2])[0];
  if (role === 'reception' && data.appointments.some(item => item.status === 'Em Atendimento')) page = 'queue';
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
  if (role !== 'reception') return;
  if (event.target.id === 'patient-form') savePatient(event.target);
  if (event.target.id === 'appointment-form') saveAppointment(event.target);
});
$('content').addEventListener('click', event => {
  const {action: type, id} = event.target.dataset;
  if (!type) return;
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
