// O modo estrito ajuda a pegar erros, como usar uma variável sem declarar.
'use strict';


// Essa é a chave que o navegador usa pra guardar os dados da demonstração.
const KEY = 'alveris-demo-v1';


// Atalho para buscar um elemento da página pelo ID.
const $ = id => document.getElementById(id);


// Mantém só os números para comparar ou formatar CPF e telefone.
const digits = value => value.replace(/\D/g, '');


// Prepara o texto antes de colocar na página, pra ele aparecer como texto mesmo.
const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);


// Limita o CPF a 11 dígitos e coloca pontos e hífen conforme a digitação.
const cpfMask = value => digits(value).slice(0, 11)
  .replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
  .replace(/(\.\d{3})(\d)/, '$1-$2');


// Separa o DDD e aplica o hífen aos telefones de 10 ou 11 dígitos.
const phoneMask = value => {
  const number = digits(value).slice(0, 11);
  if (number.length <= 2) return number;
  const prefix = number.length === 11 ? 7 : 6;
  return '(' + number.slice(0, 2) + ') ' + number.slice(2, prefix) +
    (number.length > prefix ? '-' + number.slice(prefix) : '');
};


// Soma ou subtrai dias a partir de hoje e devolve a data local no formato AAAA-MM-DD.
function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDate(date);
}


// As datas dos exemplos são calculadas ao iniciar ou restaurar a demonstração.
function nextMonthDate(day) {
  const today = new Date();
  return localDate(new Date(today.getFullYear(), today.getMonth() + 1, day));
}


// Formata a data usando o calendário local para preencher os campos do formulário.
function localDate(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-');
}


// Prepara pacientes, médicos e consultas fictícias para a demonstração.
function examples() {
  const past = [
    [1, 1, 7, 'Item Alfa'], [1, 2, 65, 'Item Beta'],
    [2, 2, 5, 'Item Gama'], [2, 1, 38, 'Item Delta'],
    [3, 1, 12, 'Item Épsilon'], [3, 2, 55, 'Item Zeta']
  ];
  return {
    patients: [
      {id: 1, name: 'Bruno Lima', age: 35, cpf: '00000000001', phone: '62000000001', address: 'Rua Exemplo, 20', plan: 'SUS'},
      {id: 2, name: 'Lia Santos', age: 42, cpf: '00000000002', phone: '62000000002', address: 'Rua Exemplo, 40', plan: 'Convênio'},
      {id: 3, name: 'Rui Alves', age: 26, cpf: '00000000003', phone: '62000000003', address: 'Rua Exemplo, 50', plan: 'SUS'}
    ],
    audit: [],
    doctors: [{id: 1, name: 'Dr. Carlos Mendes'}, {id: 2, name: 'Dra. Marina Costa'}],
    appointments: [
      {id: 1, patientId: 1, doctorId: 1, date: dateAfter(1), time: '15:00', status: 'Confirmado'},
      {id: 2, patientId: 2, doctorId: 2, date: dateAfter(2), time: '09:00', status: 'Aguardando', arrivedAt: Date.now() - 300000},
      {id: 9, patientId: 2, doctorId: 1, date: nextMonthDate(4), time: '10:00', status: 'Agendado'},
      {id: 10, patientId: 1, doctorId: 2, date: nextMonthDate(10), time: '11:00', status: 'Confirmado'},
      ...past.map(([patientId, doctorId, days], index) => ({
        id: index + 3, patientId, doctorId, date: dateAfter(-days), time: '09:00', status: 'Finalizado',
        timeline: ['Agendado', 'Confirmado', 'Chegou', 'Em atendimento', 'Atendido']
      })),
      {id: 11, patientId: 1, doctorId: 1, date: dateAfter(-18), time: '10:00', status: 'Cancelado',
        timeline: ['Agendado', 'Confirmado', 'Cancelado'], cancelReason: 'Remarcação solicitada pelo paciente'},
      {id: 12, patientId: 1, doctorId: 2, date: dateAfter(-24), time: '14:00', status: 'Não compareceu'}
    ],
    encounters: past.map(([patientId, doctorId, days, medicine], index) => ({
      id: index + 1, appointmentId: index + 3, patientId, doctorId, status: 'Finalizado',
      startedAt: new Date(dateAfter(-days) + 'T09:00').getTime(),
      finishedAt: new Date(dateAfter(-days) + 'T09:30').getTime(),
      notes: {complaint: 'Retorno de acompanhamento fictício', diagnosis: 'Avaliação simulada.'},
      prescription: [{medicine, dose: 'Dose simulada', frequency: 'Frequência simulada', duration: 'Período simulado'}]
    }))
  };
}
let storageAvailable = true;


// O protótipo guarda os dados no navegador para reaproveitar entre os perfis.
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


// Salva no navegador as mudanças que acabaram de ser feitas.
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}


// Aqui ficam os menus que cada perfil pode acessar.
const profiles = {
  reception: {name: 'Recepção', home: 'patients', pages: {
    patients: 'Pacientes', appointments: 'Novo agendamento', queue: 'Fila de espera',
    manage: 'Gestão da agenda', audit: 'Atividade da conta'}},
  doctor: {name: 'Área médica', home: 'doctorQueue', pages: {
    doctorQueue: 'Minha fila', chart: 'Prontuário', audit: 'Atividade da conta'}},
  patient: {name: 'Portal do Paciente', home: 'upcoming', pages: {
    upcoming: 'Meus agendamentos', details: 'Meus dados', prescriptions: 'Minhas prescrições'}}
};
const descriptions = {
  patients: 'Cadastre e consulte os dados administrativos dos pacientes.',
  appointments: 'Marque e confirme consultas.',
  queue: 'Acompanhe chegadas e encaminhe pacientes.',
  manage: 'Filtre, reagende ou cancele consultas.',
  upcoming: 'Confira as próximas consultas vinculadas à sua conta.',
  details: 'Consulte suas informações cadastrais.',
  doctorQueue: 'Acompanhe a sua fila e inicie um atendimento.',
  chart: 'Registre a consulta, prescreva e acompanhe o histórico.',
  prescriptions: 'Consulte as prescrições emitidas para você.',
  audit: 'Consulte os eventos registrados para esta conta.'
};


// Configuração da sessão e da senha compartilhada pelas contas de demonstração.
const TIMEOUT = 5 * 60 * 1000;
const SESSION_KEY = 'alveris-demo-session';
const PASSWORD = 'alveris';
let session = readSession();


// Estado da tela, dos filtros e dos formulários durante a navegação.
let agendaFilters = {date: '', doctorId: '', status: ''};
let agendaEdit = null;
let role;
let page;
let patientId;
let doctorId;
let editId = null;


// Atalhos para encontrar pessoas pelos IDs que ligam os registros.
const patient = id => data.patients.find(item => item.id === id);
const doctor = id => data.doctors.find(item => item.id === id);
const nextId = items => Math.max(0, ...items.map(item => item.id)) + 1;
const dateLabel = date => date.split('-').reverse().join('/');


// Peças pequenas de HTML que aparecem em várias telas.
const badge = status => '<span class="badge">' + escape(status) + '</span>';
const action = (type, id, label, disabled = false) =>
  '<button type="button" data-action="' + type + '" data-id="' + id + '"' +
  (disabled ? ' disabled' : '') + '>' + label + '</button>';
const options = (items, selected) => items.map(item =>
  '<option value="' + item.id + '"' + (item.id === selected ? ' selected' : '') + '>' +
  escape(item.name) + '</option>').join('');


// Monta a tabela a partir dos títulos das colunas e das linhas recebidas.
function table(headers, rows, empty) {
  if (!rows.length) return '<p class="muted">' + empty + '</p>';
  return '<div class="scroll" tabindex="0" role="region" aria-label="Tabela de resultados"><table><thead><tr>' +
    headers.map(header => '<th scope="col">' + header + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(row => '<tr>' + row.map(cell => '<td>' + cell + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>';
}


// Mostra o resultado da ação acima do conteúdo da tela.
function message(text, error = false) {
  $('message').textContent = text + (storageAvailable ? '' :
    ' O armazenamento local está indisponível. Os dados duram até fechar ou recarregar a página.');
  $('message').className = error ? 'error' : '';
}


// Monta de novo a tela atual com os dados atualizados.
function render() {
  const profile = profiles[role];
  $('title').textContent = profile.pages[page];
  $('description').textContent = descriptions[page];
  $('content').innerHTML = views[page]();
  if (page === 'patients') renderPatientList();
}


// Monta o formulário da recepção. Na edição, usa os dados do paciente escolhido.
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
  <input id="search" type="search" placeholder="Digite para filtrar"></label><div id="patient-list"></div></section>
  <dialog id="appointment-history" aria-labelledby="appointment-history-title">
  <h2 id="appointment-history-title"></h2><div id="appointment-history-body"></div>
  <form method="dialog"><button>Fechar</button></form></dialog>`;
}


// Filtra a lista por nome ou CPF conforme a recepção digita.
function renderPatientList() {
  const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const search = normalize($('search').value.trim());
  const cpfQuery = /^[\d.\-\s]+$/.test(search) ? digits(search) : '';
  const rows = data.patients.filter(item => normalize(item.name).includes(search) ||
    (cpfQuery && item.cpf.includes(cpfQuery))).map(item =>
    [action('patient-history', item.id, escape(item.name)), cpfMask(item.cpf), item.age, phoneMask(item.phone),
      escape(item.plan), '<div class="actions">' + action('edit', item.id, 'Editar') +
        action('patient-history', item.id, 'Ver agendamentos') + '</div>']);
  $('patient-list').innerHTML = table(['Paciente', 'CPF fictício', 'Idade', 'Telefone', 'Cobertura', 'Ação'],
    rows, 'Nenhum paciente encontrado.');
}


// A agenda mostra os horários futuros. O histórico é consultado por paciente.
function isUpcoming(item) {
  return !['Finalizado', 'Cancelado', 'Não compareceu'].includes(item.status) &&
    new Date(item.date + 'T' + item.time) >= new Date();
}


// Recupera as etapas da consulta, inclusive para registros salvos em versões antigas.
function appointmentTimeline(item) {
  if (item.timeline) return item.timeline;
  // Os dados de versões anteriores guardavam só o estado atual e a chegada.
  switch (item.status) {
    case 'Finalizado': return ['Agendado', 'Confirmado', 'Chegou', 'Atendido'];
    case 'Em Atendimento': return ['Agendado', 'Confirmado', 'Chegou', 'Em atendimento'];
    case 'Aguardando': return ['Agendado', 'Confirmado', 'Chegou'];
    case 'Agendado': return ['Agendado'];
    default: return ['Agendado', item.status];
  }
}


// Acrescenta a nova etapa ao histórico da consulta antes de mudar o status atual.
function recordAppointmentStep(item, step) {
  item.timeline = [...appointmentTimeline(item), step];
}


// A recepção e o portal usam a mesma lista, cada um para o paciente certo.
function patientAppointments(id, canMarkAbsence = false) {
  const items = data.appointments.filter(item => item.patientId === id);
  const compare = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);
  const upcoming = items.filter(isUpcoming).sort(compare);
  const history = items.filter(item => !isUpcoming(item)).sort((a, b) => compare(b, a));
  const columns = ['Data e hora', 'Médico', 'Situação', 'Motivo do cancelamento'];
  if (canMarkAbsence) columns.push('Ações');

  function list(records, empty) {
    return table(columns, records.map(item => {
      const absenceAllowed = canMarkAbsence && editableAppointment(item) && !isUpcoming(item);
      const status = item.status === 'Finalizado' ? 'Atendido' : item.status;
      const row = [dateLabel(item.date) + ' · ' + item.time, escape(doctor(item.doctorId).name),
        badge(status), item.status === 'Cancelado' ? escape(item.cancelReason || 'Não informado') : '—'];
      if (canMarkAbsence) row.push(absenceAllowed ? action('mark-absence', item.id, 'Marcar ausência') : '—');
      return row;
    }), empty);
  }

  return '<section class="panel"><h2>Próximos agendamentos</h2>' +
    list(upcoming, 'Nenhum horário futuro marcado.') +
    '</section><section class="panel"><h2>Histórico de agendamentos</h2>' +
    list(history, 'Nenhum agendamento anterior ou encerrado.') + '</section>';
}


// Ao clicar no paciente, a recepção vê todos os agendamentos dele.
function showPatientHistory(id) {
  const entry = patient(id);
  if (role !== 'reception' || !entry) return;
  const dialog = $('appointment-history');
  $('appointment-history-title').textContent = 'Agendamentos de ' + entry.name;
  $('appointment-history-body').innerHTML = patientAppointments(id, true);
  dialog.showModal();
}


// A recepção confirma a ausência depois que o horário passa.
function markAbsence(id) {
  const item = data.appointments.find(entry => entry.id === id);
  if (role !== 'reception' || !item || !editableAppointment(item) || isUpcoming(item)) return;
  if (!window.confirm('Registrar que ' + patient(item.patientId).name + ' não compareceu?')) return;
  recordAppointmentStep(item, 'Não compareceu');
  item.status = 'Não compareceu';
  receptionLog('Ausência registrada', item.patientId);
  $('appointment-history-body').innerHTML = patientAppointments(item.patientId, true);
  $('appointment-history-body').querySelector('h2')?.setAttribute('tabindex', '-1');
  $('appointment-history-body').querySelector('h2')?.focus();
}


// Prepara as linhas da agenda. As ações administrativas aparecem na visão da recepção.
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


// Junta o formulário de agendamento com a lista das próximas consultas.
function appointmentsView() {
  return `<section class="panel"><h2>Novo agendamento</h2><form id="appointment-form"><div class="fields">
  <label>Paciente<select name="patientId" required><option value="">Selecione</option>${options(data.patients)}</select></label>
  <label>Médico<select name="doctorId" required><option value="">Selecione</option>${options(data.doctors)}</select></label>
  <label>Data<input type="date" name="date" required min="${dateAfter(0)}" value="${dateAfter(1)}"></label>
  <label>Horário<input type="time" name="time" required value="14:00"></label>
  </div><div class="actions"><button>Revisar e agendar</button></div></form></section>
  <section class="panel"><h2>Agendamentos registrados</h2>
  ${table(['Paciente', 'Data e hora', 'Médico', 'Status', 'Ação'], appointmentRows(data.appointments.filter(isUpcoming), true), 'Nenhum agendamento.')}</section>`;
}


// Usa o ID da sessão para exibir os dados e os agendamentos do próprio paciente.
function patientView() {
  const entry = patient(patientId);
  if (page === 'details') {
    const fields = [['Nome', entry.name], ['Idade', entry.age], ['CPF fictício', cpfMask(entry.cpf)],
      ['Telefone', phoneMask(entry.phone)], ['Endereço', entry.address], ['Cobertura', entry.plan]];
    return '<section class="panel"><h2>Dados cadastrais</h2><dl>' +
      fields.map(([label, value]) => '<div><dt>' + label + '</dt><dd>' + escape(value) + '</dd></div>').join('') +
      '</dl></section>';
  }
  return patientAppointments(patientId);
}


// Consultas em espera e consultas que já foram iniciadas.
const waiting = () => data.appointments.filter(item => item.status === 'Aguardando')
  .sort((first, second) => first.arrivedAt - second.arrivedAt);
const activeFor = id => data.appointments.find(item => item.doctorId === id && item.status === 'Em Atendimento');


// Mostra quem chegou, a posição na fila e as opções de encaminhamento.
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


// Calcula há quantos minutos o paciente está esperando desde a chegada.
function waitTime(start) {
  return Math.max(0, Math.floor((Date.now() - Number(start)) / 60000)) + ' min';
}


// Mostra a fila do médico da sessão e o atendimento que ele já iniciou.
function doctorQueue() {
  const active = activeFor(doctorId);
  const current = active && patient(active.patientId);
  const rows = waiting().filter(item => item.doctorId === doctorId).map(item => {
    const entry = patient(item.patientId);
    return [escape(entry.name), entry.age, escape(entry.plan), dateLabel(item.date) + ' · ' + item.time,
      badge(item.calledAt ? 'Encaminhado' : 'Aguardando'),
      action('start', item.id, 'Iniciar atendimento', Boolean(active))];
  });
  return '<section class="panel"><h2>Atendimento atual</h2>' +
    (current ? '<p><strong>' + escape(current.name) + '</strong> · ' + current.age + ' anos · ' +
      escape(current.plan) + ' ' + badge(active.status) + '</p><p class="muted">A Recepção pode acompanhar o status desta consulta.</p>' :
      '<p class="muted">Nenhum atendimento iniciado.</p>') + '</section><section class="panel"><h2>Fila deste médico</h2>' +
    table(['Paciente', 'Idade', 'Cobertura', 'Horário', 'Situação', 'Ação'], rows,
      'Nenhum paciente aguardando para este médico.') + '</section>';
}


// Relaciona o nome da tela à função que monta seu conteúdo.
const views = {patients: patientsView, appointments: appointmentsView, queue: receptionQueue,
  upcoming: patientView, details: patientView, doctorQueue, chart: chartView, manage: agendaView,
  prescriptions: prescriptionsView, audit: auditView};


// Valida os campos do cadastro e impede que dois pacientes tenham o mesmo CPF.
function savePatient(form) {
  const values = Object.fromEntries(new FormData(form));
  const address = values.address.trim();
  const phone = digits(values.phone);
  if (!address || ![10, 11].includes(phone.length)) return message('Informe o endereço e um telefone com DDD.', true);
  const editable = {address, phone, plan: values.plan};
  if (editId !== null) {
    const entry = patient(editId);
    Object.assign(entry, editable);
    receptionLog('Dados do paciente atualizados', entry.id);
    editId = null;
    return commit('Dados do paciente atualizados.');
  }
  const name = values.name.trim();
  const cpf = digits(values.cpf);
  if (!name || cpf.length !== 11) return message('Informe o nome e um CPF fictício com 11 dígitos.', true);
  if (data.patients.some(item => item.cpf === cpf)) return message('Já existe um paciente com esse CPF.', true);
  data.patients.push({id: nextId(data.patients), name, cpf, age: Number(values.age), ...editable});
  receptionLog('Paciente cadastrado', data.patients.at(-1).id);
  commit('Paciente cadastrado.');
}


// Confere o horário e os conflitos antes de criar o agendamento.
function saveAppointment(form) {
  const values = Object.fromEntries(new FormData(form));
  const doctorId = Number(values.doctorId);
  const patientId = Number(values.patientId);
  const {date, time} = values;
  if (new Date(date + 'T' + time) < new Date()) return message('Escolha um horário futuro.', true);
  const conflict = appointmentConflict({doctorId, patientId, date, time});
  if (conflict) return message(conflict, true);
  if (!window.confirm('Agendar ' + patient(patientId).name + ' com ' + doctor(doctorId).name +
    ' em ' + dateLabel(date) + ' às ' + time + '?')) return;
  data.appointments.push({id: nextId(data.appointments), doctorId, patientId, date, time, status: 'Agendado'});
  receptionLog('Consulta agendada', patientId);
  commit('Consulta agendada.');
}


// Usamos a mesma regra para criar e reagendar consultas.
function appointmentConflict({doctorId, patientId, date, time, id}) {
  const sameSlot = data.appointments.filter(item => item.id !== id && item.date === date &&
    item.time === time && !['Cancelado', 'Finalizado', 'Não compareceu'].includes(item.status));
  if (sameSlot.some(item => item.doctorId === doctorId)) {
    return 'Esse médico já tem um agendamento nessa data e horário.';
  }
  if (sameSlot.some(item => item.patientId === patientId)) {
    return 'Esse paciente já tem uma consulta nessa data e horário.';
  }
  return '';
}


// Salva a mudança, atualiza a tela e mostra a mensagem da operação.
function commit(text) {
  save();
  render();
  message(text);
}


// Aqui a consulta muda de situação: confirmação, chegada, fila e atendimento.
function appointmentAction(type, id) {
  const item = data.appointments.find(entry => entry.id === id);
  if (!item) return;
  if (role === 'reception' && type === 'confirm' && item.status === 'Agendado') {
    recordAppointmentStep(item, 'Confirmado');
    item.status = 'Confirmado';
    receptionLog('Agendamento confirmado', item.patientId);
    commit('Agendamento confirmado.');
  } else if (role === 'reception' && type === 'arrive' && item.status === 'Confirmado') {
    recordAppointmentStep(item, 'Chegou');
    item.status = 'Aguardando';
    receptionLog('Chegada confirmada', item.patientId);
    item.arrivedAt = Date.now();
    setRoute('queue');
    commit('Chegada confirmada. Paciente incluído na fila.');
  } else if (role === 'reception' && type === 'call' && item.status === 'Aguardando' && !item.calledAt) {
    recordAppointmentStep(item, 'Encaminhado');
    item.calledAt = Date.now();
    receptionLog('Paciente encaminhado', item.patientId);
    commit('Paciente chamado e encaminhado ao médico.');
  } else if (role === 'doctor' && type === 'start' && item.status === 'Aguardando' && item.doctorId === doctorId) {
    if (activeFor(doctorId)) return message('Este médico já está em atendimento.', true);
    recordAppointmentStep(item, 'Em atendimento');
    item.status = 'Em Atendimento';
    data.encounters.push({id: nextId(data.encounters), appointmentId: item.id,
      patientId: item.patientId, doctorId, startedAt: Date.now(), status: item.status});
    audit('Atendimento iniciado', 'Atendimento #' + data.encounters.at(-1).id);
    commit('Atendimento iniciado. O prontuário está disponível no menu.');
  }
}


// Reage à digitação para filtrar listas e aplicar máscaras.
$('content').addEventListener('input', event => {
  if (!checkSession()) return;
  if (event.target.id === 'prescription-search') updatePrescriptions();
  if (event.target.id === 'search') renderPatientList();
  if (event.target.name === 'cpf') event.target.value = cpfMask(event.target.value);
  if (event.target.name === 'phone') event.target.value = phoneMask(event.target.value);
});


// Atualiza a tela quando um filtro selecionado muda.
$('content').addEventListener('change', event => {
  if (!checkSession()) return;
  if (event.target.id === 'prescription-period') return updatePrescriptions();
  if (page === 'manage' && event.target.form?.id === 'agenda-filters') {
    agendaFilters = Object.fromEntries(new FormData(event.target.form));
    agendaEdit = null;
    const field = event.target.name;
    render();
    $('agenda-filters').elements[field].focus();
    return;
  }

});


// Envia cada formulário para a função responsável pela operação.
$('content').addEventListener('submit', event => {
  if (event.target.id === 'login-form' || event.target.method === 'dialog') return;
  event.preventDefault();
  if (!checkSession()) return;
  if (page === 'chart' && event.target.id === 'chart-form') return saveChart(event.target, event.submitter?.value);
  if (page === 'manage' && event.target.id === 'reschedule-form') return reschedule(event.target);
  if (role !== 'reception') return;
  if (page === 'patients' && event.target.id === 'patient-form') savePatient(event.target);
  if (page === 'appointments' && event.target.id === 'appointment-form') saveAppointment(event.target);
});


// Identifica o botão clicado e chama a ação da tela atual.
$('content').addEventListener('click', event => {
  const {action: type, id} = event.target.dataset;
  if (!type || !checkSession()) return;
  if (page === 'prescriptions' && type === 'prescription-detail') return showPrescription(Number(id));
  if (page === 'chart' && type === 'history-detail') return logHistory(event.target, Number(id));
  if (page === 'patients' && type === 'mark-absence') return markAbsence(Number(id));
  if (page === 'patients' && type === 'patient-history') return showPatientHistory(Number(id));
  if (page === 'manage') return manageAction(type, Number(id));
  if (page === 'patients' && ['edit', 'cancel-edit'].includes(type)) {
    editId = type === 'edit' ? Number(id) : null;
    message('');
    render();
    $('patient-form').querySelector('input').focus();
    return;
  }
  if (['appointments', 'queue', 'doctorQueue'].includes(page)) appointmentAction(type, Number(id));
});


// Recarrega os exemplos após a confirmação da recepção.
$('reset').addEventListener('click', () => {
  if (!checkSession() || role !== 'reception') return;
  if (!window.confirm('Restaurar os exemplos? As alterações e a trilha local serão apagadas.')) return;
  data = examples();
  audit('Dados de demonstração restaurados', '', false, 'reception');
  endSession('Exemplos restaurados. Entre novamente.');
});
setInterval(() => {
  document.querySelectorAll('[data-arrived]').forEach(element => {
    element.textContent = waitTime(element.dataset.arrived);
  });
}, 15000);


// Encontra o prontuário aberto pelo médico a partir do agendamento em atendimento.
function currentEncounter() {
  const appointment = activeFor(doctorId);
  return appointment && data.encounters.find(item =>
    item.appointmentId === appointment.id && item.doctorId === doctorId && item.status === 'Em Atendimento');
}


// Monta a tabela de medicamentos usada no prontuário e no portal.
function prescriptionList(items) {
  return table(['Medicamento', 'Dosagem', 'Frequência', 'Duração'],
    items.map(item => [item.medicine, item.dose, item.frequency, item.duration].map(escape)),
    'Nenhum item registrado.');
}


// Monta o prontuário e libera o histórico do paciente enquanto a consulta está aberta.
function chartView() {
  const encounter = currentEncounter();
  if (!encounter) return '<section class="panel"><h2>Sem consulta aberta</h2><p>Inicie uma consulta em Minha fila para abrir o histórico do paciente.</p></section>';
  // Durante a consulta, o médico pode ver os registros anteriores desse paciente.
  const records = data.encounters.filter(item => item.status === 'Finalizado' &&
    item.patientId === encounter.patientId).sort((a, b) => b.startedAt - a.startedAt);
  const history = `<section class="panel"><h2>Histórico do paciente em atendimento</h2>
    ${table(['Data', 'Paciente', 'Queixa', 'Médico', 'Detalhes'], records.map(item => [
      new Date(item.startedAt).toLocaleDateString('pt-BR'), escape(patient(item.patientId).name),
      escape(item.notes?.complaint || 'Sem registro'), escape(doctor(item.doctorId).name),
      `<details><summary data-action="history-detail" data-id="${item.id}">Ver histórico</summary>
      <p><strong>Observações</strong><br>${escape(item.notes?.observations || 'Sem registro')}</p>
      <p><strong>Diagnóstico</strong><br>${escape(item.notes?.diagnosis || 'Sem registro')}</p>
      <p><strong>Prescrição definitiva</strong></p>${prescriptionList(item.prescription ?? [])}</details>`
    ]), 'Nenhum atendimento anterior disponível.')}</section>`;
  const entry = patient(encounter.patientId);
  const notes = encounter.notes ?? {};
  const textarea = (name, label) => `<label>${label}<textarea name="${name}" maxlength="500" rows="3">${escape(notes[name])}</textarea></label>`;
  return `<form id="chart-form">
    <section class="panel"><h2>${escape(entry.name)} · ${entry.age} anos · ${escape(entry.plan)}</h2>
    ${badge('Em Atendimento')}<p class="muted">Até 500 caracteres por campo.</p>
    <div class="fields">${textarea('complaint', 'Queixa principal')}${textarea('observations', 'Observações')}${textarea('diagnosis', 'Diagnóstico')}</div>
    </section>
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


// Valida os campos, inclui itens na prescrição e fecha o atendimento após a confirmação.
function saveChart(form, operation) {
  const encounter = currentEncounter();
  if (role !== 'doctor' || !encounter || !['add', 'finish'].includes(operation)) return;
  const values = Object.fromEntries(new FormData(form));
  const notes = {complaint: values.complaint.trim(), observations: values.observations.trim(), diagnosis: values.diagnosis.trim()};
  if (Object.values(notes).some(value => value.length > 500)) return chartError(encounter, 'Respeite o limite de 500 caracteres por campo.');
  const item = {medicine: values.medicine.trim(), dose: values.dose.trim(),
    frequency: values.frequency.trim(), duration: values.duration.trim()};
  const hasPendingItem = Object.values(item).some(Boolean);
  if (operation === 'add') {
    if (!Object.values(item).every(Boolean)) return chartError(encounter, 'Preencha os quatro campos da prescrição.');
    (encounter.prescription ??= []).push(item);
  }
  if (operation === 'finish') {
    if (hasPendingItem) return chartError(encounter, 'Adicione o item preenchido à prescrição ou limpe seus campos antes de finalizar.');
    if (!notes.diagnosis) return chartError(encounter, 'Preencha o diagnóstico para finalizar a consulta.');
    if (!window.confirm('Finalizar o atendimento e encerrar a edição do prontuário?')) return;
    const appointment = activeFor(doctorId);
    if (appointment.id !== encounter.appointmentId || appointment.patientId !== encounter.patientId) {
      return chartError(encounter, 'O atendimento precisa estar vinculado ao agendamento correto.');
    }
    encounter.status = 'Finalizado';
    encounter.finishedAt = Date.now();
    recordAppointmentStep(appointment, 'Atendido');
    appointment.status = 'Finalizado';
    audit('Atendimento finalizado', 'Atendimento #' + encounter.id);
    if (encounter.prescription?.length) audit('Prescrição finalizada', 'Prescrição #' + encounter.id);
  }
  encounter.notes = notes;
  if (operation === 'add') audit('Item de prescrição registrado', 'Atendimento #' + encounter.id);
  commit(operation === 'add' ? 'Item incluído na prescrição provisória.' : 'Atendimento finalizado.');
}


// Só os horários agendados ou confirmados podem ser alterados na agenda.
const editableAppointment = item => ['Agendado', 'Confirmado'].includes(item.status);


// Aplica os filtros e mostra as ações disponíveis para cada consulta.
function agendaView() {
  const filters = agendaFilters;
  const statuses = ['Agendado', 'Confirmado', 'Aguardando', 'Em Atendimento'];
  const items = data.appointments.filter(item => isUpcoming(item) &&
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


// Abre a edição do horário ou registra o cancelamento com o motivo informado.
function manageAction(type, id) {
  const item = data.appointments.find(entry => entry.id === id);
  if (role !== 'reception' || !item || !editableAppointment(item)) return;
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
    recordAppointmentStep(item, 'Cancelado');
    item.status = 'Cancelado';
    receptionLog('Consulta cancelada', item.patientId);
    item.cancelReason = reason.trim().slice(0, 200);
    item.cancelledAt = Date.now();
    agendaEdit = null;
    commit('Consulta cancelada. O registro ficou no histórico do paciente.');
  }
}


// Confere o novo horário e registra a mudança no histórico da consulta.
function reschedule(form) {
  const item = data.appointments.find(entry => entry.id === agendaEdit);
  if (role !== 'reception' || !item || !editableAppointment(item)) return;
  const {date, time} = Object.fromEntries(new FormData(form));
  if (new Date(date + 'T' + time) < new Date()) return message('Escolha um horário futuro.', true);
  const conflict = appointmentConflict({...item, date, time});
  if (conflict) return message(conflict, true);
  recordAppointmentStep(item, 'Reagendado de ' + dateLabel(item.date) + ' às ' + item.time);
  item.date = date;
  item.time = time;
  agendaEdit = null;
  receptionLog('Horário atualizado', item.patientId);
  commit('Horário atualizado.');
}


// Recupera a sessão ao recarregar a página na mesma aba.
function readSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    return saved && typeof saved.login === 'string' && Number.isFinite(saved.lastActivity) ? saved : null;
  } catch {
    return null;
  }
}


// Guarda o login e o horário da última atividade na aba.
function storeSession() {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // A sessão continua em memória se o navegador bloquear esse armazenamento.
  }
}


// Gera as contas de demonstração a partir dos médicos e pacientes cadastrados.
function accounts() {
  return [
    {login: 'recepcao', role: 'reception', name: 'Recepção ALVERIS'},
    ...data.doctors.map((item, index) => ({login: ['carlos', 'marina'][index] ?? 'medico' + item.id,
      role: 'doctor', personId: item.id, name: item.name})),
    ...data.patients.map((item, index) => ({login: ['bruno', 'lia', 'rui'][index] ?? 'paciente' + item.id,
      role: 'patient', personId: item.id, name: item.name}))
  ];
}


// Os logs registram a ação e sua referência, sem copiar o conteúdo clínico.
function audit(event, resource = '', alert = false, category = '') {
  const login = session?.login ?? 'visitante';
  const account = accounts().find(item => item.login === login);
  const logs = data.audit ??= [];
  logs.push({id: (logs.at(-1)?.id ?? 0) + 1, when: Date.now(), login,
    profile: account ? profiles[account.role].name : 'Visitante', event, resource, alert, category});
  save();
}


// Lê a parte do endereço depois do # para identificar a tela solicitada.
function route() {
  return window.location.hash.slice(1);
}


// Atualiza o endereço e guarda a tela selecionada.
function setRoute(destination) {
  const hash = '#' + destination;
  if (window.location.hash !== hash) history.replaceState(null, '', hash);
  page = destination;
}


// Encerra a sessão quando o tempo de inatividade chega ao limite.
function checkSession() {
  if (!session) return false;
  if (Date.now() - session.lastActivity >= TIMEOUT) {
    audit('Sessão expirada');
    endSession('Sessão expirada por inatividade. Entre novamente.');
    return false;
  }
  return true;
}


// Limpa a sessão e volta para o login.
function endSession(text) {
  session = null;
  storeSession();
  navigate('login');
  message(text);
}


// Monta o formulário de login e os atalhos das contas fictícias.
function loginView() {
  return `<section class="panel login-form"><h2>Acesse sua conta</h2>
    <form id="login-form" autocomplete="off">
      <div class="fields"><label>Usuário<input name="login" required maxlength="50"></label>
      <label>Senha<input name="password" type="password" required maxlength="60"></label></div>
      <div class="actions"><button>Entrar</button></div>
    </form></section>
    <section class="panel login-accounts"><h2>Contas de demonstração</h2>
    <p class="muted">Senha para todas as contas: <strong>alveris</strong>. Use apenas dados fictícios.</p>
    <div class="account-grid">${accounts().map(account => `<button type="button" class="secondary"
      data-demo-login="${escape(account.login)}"><strong>${escape(account.name)}</strong>
      <small>${profiles[account.role].name} · ${escape(account.login)}</small></button>`).join('')}</div></section>`;
}


// A sessão identifica o usuário. Cada perfil tem sua própria lista de telas.
function navigate(destination) {
  if (session && !checkSession()) return;
  const account = session && accounts().find(item => item.login === session.login);
  $('sidebar').hidden = !account;
  $('session-bar').hidden = !account;
  $('reset').hidden = account?.role !== 'reception';
  $('identity').textContent = account?.name ?? '';
  $('tabs').innerHTML = '';
  $('layout').classList.toggle('signed-out', !account);
  message('');
  if (!account) {
    if (destination && destination !== 'login') audit('Rota privada sem sessão', 'Tela #' + safeRoute(destination), true);
    setRoute('login');
    $('section').textContent = '';
    $('title').textContent = 'Entrar no ALVERIS';
    $('description').textContent = 'Protótipo acadêmico com autenticação simulada.';
    $('content').innerHTML = loginView();
    if (destination && destination !== 'login') message('Entre na sua conta para acessar esta tela.', true);
    return;
  }
  role = account.role;
  patientId = role === 'patient' ? account.personId : null;
  doctorId = role === 'doctor' ? account.personId : null;
  const profile = profiles[role];
  const target = !destination || destination === 'login' ? profile.home : destination;
  $('profile').textContent = profile.name;
  $('section').textContent = profile.name;
  const allowed = Object.hasOwn(profile.pages, target);
  $('tabs').innerHTML = Object.entries(profile.pages).map(([key, label]) =>
    `<a href="#${key}" ${key === target ? 'aria-current="page"' : ''}>${label}</a>`).join('');
  editId = null;
  agendaEdit = null;
  if (!allowed) {
    audit('Acesso negado', 'Tela #' + safeRoute(target), true);
    setRoute('acesso-negado');
    $('title').textContent = '403 — Acesso negado';
    $('description').textContent = 'Esta tela está restrita a outro perfil.';
    $('content').innerHTML = `<a href="#${profile.home}">Voltar para minha área</a>`;
    return;
  }
  setRoute(target);
  if (page === 'chart') {
    const encounter = currentEncounter();
    if (encounter) audit('Prontuário visualizado', 'Atendimento #' + encounter.id);
  }
  render();
}


// Usa apenas nomes conhecidos de telas ao registrar uma tentativa de acesso.
function safeRoute(destination) {
  return Object.values(profiles).some(profile => Object.hasOwn(profile.pages, destination)) ?
    destination : 'desconhecida';
}


// Confere se a receita pertence ao paciente da sessão antes de abrir os detalhes.
function showPrescription(id) {
  const record = patientPrescriptions().find(item => item.id === id);
  if (!record) {
    audit('Acesso negado', 'Prescrição #' + id, true);
    return message('403 — Prescrição indisponível para esta conta.', true);
  }
  audit('Prescrição visualizada', 'Prescrição #' + id);
  $('prescription-title').textContent = doctor(record.doctorId).name + ' · ' + prescriptionDate(record);
  $('prescription-body').innerHTML = '<p><strong>Diagnóstico</strong><br>' +
    escape(record.notes?.diagnosis || 'Sem diagnóstico informado.') + '</p>' + prescriptionList(record.prescription);
  $('prescription-dialog').showModal();
}


// Registra a abertura dos detalhes de uma consulta anterior.
function logHistory(summary, id) {
  if (summary.parentElement.open) return;
  const record = data.encounters.find(item => item.id === id && item.patientId === currentEncounter()?.patientId && item.status === 'Finalizado');
  audit(record ? 'Histórico clínico visualizado' : 'Acesso negado', 'Atendimento #' + id, !record);
}


// Mostra apenas prescrições finalizadas e vinculadas ao paciente da sessão.
function patientPrescriptions() {
  if (role !== 'patient') return [];
  return data.encounters.filter(item => item.patientId === patientId && item.status === 'Finalizado' &&
    item.prescription?.length && doctor(item.doctorId))
    .sort((a, b) => issuedAt(b) - issuedAt(a));
}


// Usa a data da finalização da receita, com a data do atendimento como alternativa.
const issuedAt = record => record.finishedAt ?? record.startedAt;
const prescriptionDate = record => new Date(issuedAt(record)).toLocaleDateString('pt-BR');
const searchable = value => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');


// Cruza o que foi digitado na busca com o período escolhido.
function prescriptionResults(query = '', period = 'all') {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  if (period === '30') since.setDate(since.getDate() - 30);
  if (period === '6') {
    const day = since.getDate();
    since.setDate(1);
    since.setMonth(since.getMonth() - 6);
    const endOfMonth = new Date(since.getFullYear(), since.getMonth() + 1, 0).getDate();
    since.setDate(Math.min(day, endOfMonth));
  }
  const words = searchable(query).trim().split(/\s+/).filter(Boolean);
  const results = patientPrescriptions().filter(record => {
    if (period !== 'all' && issuedAt(record) < since.getTime()) return false;
    const fields = [doctor(record.doctorId).name, prescriptionDate(record),
      prescriptionDate(record).split('/').reverse().join('-'), ...record.prescription.map(item => item.medicine)];
    return words.every(word => fields.some(value => searchable(value).includes(word)));
  });
  if (!results.length) return '<p class="muted">Nenhuma prescrição encontrada. Experimente outro termo ou período.</p>';
  return `<div class="prescription-grid">${results.map(record => `<article class="panel prescription-card">
    <p class="eyebrow">${prescriptionDate(record)}</p><h2>${escape(doctor(record.doctorId).name)}</h2>
    <ul>${record.prescription.map(item => `<li><strong>${escape(item.medicine)}</strong>
      <small>${[item.dose, item.frequency, item.duration].map(escape).join(' · ')}</small></li>`).join('')}</ul>
    ${action('prescription-detail', record.id, 'Ver detalhes')}</article>`).join('')}</div>`;
}


// Monta os filtros, a lista de receitas e a janela de detalhes.
function prescriptionsView() {
  return `<section class="panel fields">
    <label>Buscar por médico, medicamento ou data<input id="prescription-search" type="search" placeholder="Ex.: Item Alfa"></label>
    <label>Período<select id="prescription-period"><option value="all">Todos</option>
    <option value="30">Últimos 30 dias</option><option value="6">Últimos 6 meses</option></select></label>
    </section><div id="prescription-results" aria-live="polite">${prescriptionResults()}</div>
    <dialog id="prescription-dialog" aria-labelledby="prescription-title">
    <h2 id="prescription-title"></h2><div id="prescription-body"></div>
    <form method="dialog" class="actions"><button>Fechar</button></form></dialog>`;
}


// Atualiza os resultados dos filtros sem recarregar a página.
function updatePrescriptions() {
  $('prescription-results').innerHTML = prescriptionResults($('prescription-search').value, $('prescription-period').value);
}


// Registra a ação administrativa com o nome do paciente.
function receptionLog(event, id) {
  audit(event, patient(id).name, false, 'reception');
}


// Mostra o erro do prontuário e registra o paciente na atividade do médico.
function chartError(encounter, reason) {
  audit(reason, patient(encounter.patientId).name, true, 'chart-error');
  message(reason, true);
}


// Cada perfil vê só os registros relevantes na atividade da conta.
function auditView() {
  const logs = (data.audit ?? []).filter(item => {
    if (item.login !== session.login) return false;
    if (role === 'doctor') return item.category === 'chart-error';
    return item.category === 'reception' ||
      ['Login bem-sucedido', 'Saída da conta', 'Sessão expirada'].includes(item.event);
  }).reverse();
  return '<section class="panel">' + table(['ID', 'Data e hora', 'Perfil', 'Evento', 'Paciente ou referência'],
    logs.map(item => [item.id, new Date(item.when).toLocaleString('pt-BR'), escape(item.profile),
      escape(item.event), escape(item.resource || '—')]),
    'Ainda não há eventos registrados para esta conta.') + '</section>';
}


// Preenche o usuário ao escolher uma conta de demonstração.
$('content').addEventListener('click', event => {
  const button = event.target.closest('[data-demo-login]');
  if (!button || session) return;
  $('login-form').elements.login.value = button.dataset.demoLogin;
  $('login-form').elements.password.focus();
});


// Confere o usuário e a senha e abre a tela inicial do perfil.
$('content').addEventListener('submit', event => {
  if (event.target.id !== 'login-form' || session) return;
  event.preventDefault();
  const {login, password} = Object.fromEntries(new FormData(event.target));
  const account = accounts().find(item => item.login === login.trim().toLowerCase());
  if (!account || password !== PASSWORD) {
    message('Usuário ou senha inválidos.', true);
    return;
  }
  session = {login: account.login, lastActivity: Date.now()};
  storeSession();
  audit('Login bem-sucedido');
  navigate(profiles[account.role].home);
});


// Registra a saída do usuário antes de limpar a sessão.
$('logout').addEventListener('click', () => {
  if (!checkSession()) return;
  audit('Saída da conta');
  endSession('Sessão encerrada.');
});


// Atualiza a página ao navegar pelos links e reinicia o prazo da sessão com a interação.
window.addEventListener('hashchange', () => navigate(route()));
for (const event of ['pointerdown', 'keydown', 'input']) {
  document.addEventListener(event, () => {
    if (!checkSession()) return;
    session.lastActivity = Date.now();
    storeSession();
  }, true);
}
setInterval(checkSession, 1000);
navigate(route());
