const API_URL = '';

const ENUMS = {
  prioridade: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'],
  status: ['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CLIENTE', 'FECHADO'],
  perfil: ['TECNICO', 'ADMIN'],
};


const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtData = d => d ? new Date(d).toLocaleString('pt-BR') : '—';
const label = s => String(s ?? '').replace(/_/g, ' ');
const opts = arr => arr.map(v => ({ value: v, label: label(v) }));

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(API_URL + path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const j = await res.json();
      msg = j.message || j.mensagem || j.detail || j.erro || j.error || msg;
      if (Array.isArray(j.errors)) msg += ': ' + j.errors.map(e => e.defaultMessage || e.message || e).join('; ');
      if (j.campos) msg += ': ' + Object.values(j.campos).join('; ');
    } catch { /* corpo não-JSON */ }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

function toast(msg, err = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (err ? ' err' : '');
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// executa ação, mostrando erro/sucesso
async function run(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
  catch (e) { toast(e.message, true); throw e; }
}

function openModal(html) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener('mousedown', e => { if (e.target === bg) bg.remove(); });
  $('#modal-root').appendChild(bg);
  const close = () => bg.remove();
  bg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  return { el: bg, close };
}

function confirmDialog(msg) {
  return new Promise(resolve => {
    const m = openModal(`<h2>Confirmar</h2><p>${esc(msg)}</p>
      <div class="foot"><button class="btn" data-close>Cancelar</button>
      <button class="btn danger" id="ok">Confirmar</button></div>`);
    let done = false;
    const finish = v => { if (done) return; done = true; m.close(); resolve(v); };
    $('#ok', m.el).onclick = () => finish(true);
    m.el.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => finish(false)));
    // clicar fora da caixa (no fundo escuro) cancela
    m.el.addEventListener('mousedown', e => { if (e.target === m.el) finish(false); });
  });
}


function fieldHtml(f, v) {
  const val = v ?? '';
  const req = f.required === false ? '' : 'required';
  let input;
  if (f.type === 'select') {
    input = `<select name="${f.name}" ${req}><option value="">Selecione…</option>` +
      f.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(val) ? 'selected' : ''}>${esc(o.label)}</option>`).join('') +
      `</select>`;
  } else if (f.type === 'textarea') {
    input = `<textarea name="${f.name}" ${req} maxlength="${f.max || ''}">${esc(val)}</textarea>`;
  } else {
    input = `<input name="${f.name}" type="${f.type || 'text'}" value="${esc(val)}" ${req} maxlength="${f.max || ''}">`;
  }
  return `<label>${f.label}</label>${input}`;
}

function openForm({ title, fields, values = {}, submitLabel = 'Salvar', onSubmit }) {
  const m = openModal(`<h2>${esc(title)}</h2>
    <form id="f">${fields.map(f => fieldHtml(f, values[f.name])).join('')}
    <div class="foot"><button type="button" class="btn" data-close>Cancelar</button>
    <button class="btn primary">${submitLabel}</button></div></form>`);
  $('#f', m.el).addEventListener('submit', async e => {
    e.preventDefault();
    const data = {};
    for (const f of fields) {
      let v = new FormData(e.target).get(f.name);
      if (v === '' || v === null) v = f.required === false ? null : v;
      if (f.number && v !== null) v = Number(v);
      data[f.name] = v;
    }
    try { await onSubmit(data); m.close(); }
    catch (err) { toast(err.message, true); }
  });
}


const badge = v => v ? `<span class="badge b-${String(v).toLowerCase()}">${esc(label(v))}</span>` : '—';
const pick = (c, ...fns) => { for (const f of fns) { try { const r = f(c); if (r != null) return r; } catch {} } return null; };
const cliId = c => pick(c, x => x.clienteId, x => x.cliente?.id);
const catId = c => pick(c, x => x.categoriaId, x => x.categoria?.id);
const tecId = c => pick(c, x => x.tecnicoId, x => x.tecnico?.id);
const cliNome = c => pick(c, x => x.clienteNome, x => x.cliente?.nome, x => x.clienteId != null ? '#' + x.clienteId : null) ?? '—';
const catNome = c => pick(c, x => x.categoriaNome, x => x.categoria?.nome, x => x.categoriaId != null ? '#' + x.categoriaId : null) ?? '—';
const tecNome = c => pick(c, x => x.tecnicoNome, x => x.tecnico?.nome, x => x.tecnicoId != null ? '#' + x.tecnicoId : null) ?? 'Não atribuído';

async function optionsFrom(path, labelFn) {
  const list = await api(path);
  return list.map(x => ({ value: x.id, label: labelFn(x) || `#${x.id}` }));
}

const ENTITIES = {
  clientes: {
    title: 'Clientes', path: '/clientes', singular: 'Cliente',
    columns: [['ID', x => x.id], ['Nome', x => esc(x.nome)], ['E-mail', x => esc(x.email)], ['Telefone', x => esc(x.telefone || '—')]],
    fields: async () => [
      { name: 'nome', label: 'Nome', max: 100 },
      { name: 'email', label: 'E-mail', type: 'email', max: 120 },
      { name: 'telefone', label: 'Telefone', required: false, max: 20 },
    ],
  },
  tecnicos: {
    title: 'Técnicos', path: '/tecnicos', singular: 'Técnico',
    columns: [['ID', x => x.id], ['Nome', x => esc(x.nome)], ['E-mail', x => esc(x.email)], ['Perfil', x => badge(x.perfil)]],
    fields: async () => [
      { name: 'nome', label: 'Nome', max: 100 },
      { name: 'email', label: 'E-mail', type: 'email', max: 100 },
      { name: 'perfil', label: 'Perfil', type: 'select', options: opts(ENUMS.perfil) },
    ],
  },
  categorias: {
    title: 'Categorias', path: '/categorias', singular: 'Categoria',
    columns: [['ID', x => x.id], ['Nome', x => esc(x.nome)], ['Descrição', x => esc(x.descricao)]],
    fields: async () => [
      { name: 'nome', label: 'Nome', max: 100 },
      { name: 'descricao', label: 'Descrição', type: 'textarea', max: 1000 },
    ],
  },
  comentarios: {
    title: 'Comentários', path: '/comentarios', singular: 'Comentário',
    columns: [['ID', x => x.id], ['Chamado', x => '#' + esc(pick(x, y => y.chamadoId, y => y.chamado?.id) ?? '—')],
      ['Autor', x => esc(x.autor)], ['Texto', x => esc(x.texto)], ['Data', x => fmtData(x.dataCriacao)]],
    fields: async (editing) => {
      const f = [
        { name: 'texto', label: 'Texto', type: 'textarea', max: 100 },
        { name: 'autor', label: 'Autor', max: 100 },
      ];
      if (!editing) {
        const page = await api('/chamados?size=200');
        f.push({ name: 'chamadoId', label: 'Chamado', type: 'select', number: true,
          options: (page.content || []).map(c => ({ value: c.id, label: `#${c.id} — ${c.titulo}` })) });
      } else {
        // o backend exige chamadoId no request, mantém o existente
        f.push({ name: 'chamadoId', label: 'Chamado', type: 'select', number: true,
          options: (await api('/chamados?size=200')).content.map(c => ({ value: c.id, label: `#${c.id} — ${c.titulo}` })) });
      }
      return f;
    },
  },
};

async function renderCrud(key) {
  const cfg = ENTITIES[key];
  $('#title').textContent = cfg.title;
  $('#actions').innerHTML = `<button class="btn primary" id="novo">+ Novo ${cfg.singular}</button>`;
  $('#content').innerHTML = '<div class="card empty">Carregando…</div>';

  const load = async () => {
    let list;
    try { list = await api(cfg.path); }
    catch (e) { $('#content').innerHTML = `<div class="card empty">Falha ao carregar: ${esc(e.message)}</div>`; return; }
    const rows = list.map(x => `<tr>${cfg.columns.map(c => `<td>${c[1](x)}</td>`).join('')}
      <td class="row-actions">
        <button class="btn sm" data-edit="${x.id}">Editar</button>
        <button class="btn sm danger" data-del="${x.id}">Excluir</button></td></tr>`).join('');
    $('#content').innerHTML = `<div class="card table-wrap"><table>
      <thead><tr>${cfg.columns.map(c => `<th>${c[0]}</th>`).join('')}<th></th></tr></thead>
      <tbody>${rows || `<tr><td class="empty" colspan="${cfg.columns.length + 1}">Nenhum registro.</td></tr>`}</tbody></table></div>`;

    $('#content').querySelectorAll('[data-edit]').forEach(b => b.onclick = async () => {
      const item = list.find(x => x.id == b.dataset.edit);
      const values = { ...item, chamadoId: pick(item, y => y.chamadoId, y => y.chamado?.id) };
      openForm({ title: `Editar ${cfg.singular}`, fields: await cfg.fields(true), values,
        onSubmit: async d => { await api(`${cfg.path}/${item.id}`, { method: 'PUT', body: d }); toast('Atualizado!'); load(); } });
    });
    $('#content').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!await confirmDialog(`Excluir ${cfg.singular.toLowerCase()} #${b.dataset.del}?`)) return;
      run(() => api(`${cfg.path}/${b.dataset.del}`, { method: 'DELETE' }), 'Excluído!').then(load).catch(() => {});
    });
  };

  $('#novo').onclick = async () => openForm({
    title: `Novo ${cfg.singular}`, fields: await cfg.fields(false),
    onSubmit: async d => { await api(cfg.path, { method: 'POST', body: d }); toast('Criado!'); load(); },
  });
  load();
}

async function renderDashboard() {
  $('#title').textContent = 'Dashboard';
  $('#actions').innerHTML = '';
  $('#content').innerHTML = '<div class="card empty">Carregando…</div>';
  try {
    const [chs, cli, tec, cat] = await Promise.all([
      api('/chamados?size=500'), api('/clientes'), api('/tecnicos'), api('/categorias')]);
    const list = chs.content || [];
    const porStatus = {};
    list.forEach(c => porStatus[c.status] = (porStatus[c.status] || 0) + 1);
    const stat = (n, l) => `<div class="card stat"><div class="n">${n}</div><div class="l">${l}</div></div>`;
    $('#content').innerHTML = `<div class="stats">
      ${stat(chs.totalElements ?? list.length, 'Chamados')}
      ${Object.entries(porStatus).map(([s, n]) => stat(n, label(s))).join('')}
      ${stat(cli.length, 'Clientes')}${stat(tec.length, 'Técnicos')}${stat(cat.length, 'Categorias')}</div>
      <h3>Últimos chamados</h3>${chamadosTable(list.slice(0, 5), false)}`;
  } catch (e) {
    $('#content').innerHTML = `<div class="card empty">Falha ao carregar: ${esc(e.message)}</div>`;
  }
}


const chState = { page: 0, size: 10, status: '', prioridade: '', clienteId: '' };

function chamadosTable(list, withActions = true) {
  const rows = list.map(c => `<tr>
    <td>#${c.id}</td><td>${esc(c.titulo)}</td><td>${cliNome(c).toString().startsWith('#') ? esc(cliNome(c)) : esc(cliNome(c))}</td>
    <td>${esc(catNome(c))}</td><td>${badge(c.prioridade)}</td><td>${badge(c.status)}</td>
    <td>${esc(tecNome(c))}</td><td>${fmtData(c.dataCriacao)}</td>
    ${withActions ? `<td class="row-actions">
      <button class="btn sm" data-ver="${c.id}">Ver</button>
      <button class="btn sm" data-edit="${c.id}">Editar</button>
      <button class="btn sm danger" data-del="${c.id}">Excluir</button></td>` : ''}</tr>`).join('');
  return `<div class="card table-wrap"><table><thead><tr>
    <th>ID</th><th>Título</th><th>Cliente</th><th>Categoria</th><th>Prioridade</th><th>Status</th><th>Técnico</th><th>Criado em</th>${withActions ? '<th></th>' : ''}
    </tr></thead><tbody>${rows || '<tr><td class="empty" colspan="9">Nenhum chamado.</td></tr>'}</tbody></table></div>`;
}

async function chamadoFields() {
  const [clientes, categorias] = await Promise.all([
    optionsFrom('/clientes', x => x.nome), optionsFrom('/categorias', x => x.nome ?? x.descricao)]);
  return [
    { name: 'titulo', label: 'Título', max: 100 },
    { name: 'descricao', label: 'Descrição', type: 'textarea', max: 1000 },
    { name: 'prioridade', label: 'Prioridade', type: 'select', options: opts(ENUMS.prioridade) },
    { name: 'clienteId', label: 'Cliente', type: 'select', number: true, options: clientes },
    { name: 'categoriaId', label: 'Categoria', type: 'select', number: true, options: categorias },
  ];
}

async function renderChamados() {
  $('#title').textContent = 'Chamados';
  $('#actions').innerHTML = '<button class="btn primary" id="novo">+ Novo Chamado</button>';
  const clientes = await optionsFrom('/clientes', x => x.nome).catch(() => []);

  $('#content').innerHTML = `
    <div class="filters">
      <select id="f-status"><option value="">Todos os status</option>${ENUMS.status.map(s => `<option value="${s}">${label(s)}</option>`).join('')}</select>
      <select id="f-prio"><option value="">Todas as prioridades</option>${ENUMS.prioridade.map(s => `<option value="${s}">${label(s)}</option>`).join('')}</select>
      <select id="f-cli"><option value="">Todos os clientes</option>${clientes.map(c => `<option value="${c.value}">${esc(c.label)}</option>`).join('')}</select>
    </div><div id="lista"><div class="card empty">Carregando…</div></div>`;
  $('#f-status').value = chState.status; $('#f-prio').value = chState.prioridade; $('#f-cli').value = chState.clienteId;
  [['#f-status', 'status'], ['#f-prio', 'prioridade'], ['#f-cli', 'clienteId']].forEach(([sel, k]) =>
    $(sel).onchange = e => { chState[k] = e.target.value; chState.page = 0; load(); });

  $('#novo').onclick = async () => openForm({
    title: 'Novo Chamado', fields: await chamadoFields(),
    onSubmit: async d => { await api('/chamados', { method: 'POST', body: d }); toast('Chamado criado!'); load(); },
  });

  async function load() {
    const q = new URLSearchParams({ page: chState.page, size: chState.size });
    ['status', 'prioridade', 'clienteId'].forEach(k => chState[k] && q.set(k, chState[k]));
    let page;
    try { page = await api('/chamados?' + q); }
    catch (e) { $('#lista').innerHTML = `<div class="card empty">Falha ao carregar: ${esc(e.message)}</div>`; return; }
    const list = page.content || [];
    const total = page.totalPages ?? 1;
    $('#lista').innerHTML = chamadosTable(list) + `<div class="pager">
      <span>${page.totalElements ?? list.length} chamado(s) — página ${chState.page + 1} de ${Math.max(total, 1)}</span>
      <div><button class="btn sm" id="prev" ${chState.page <= 0 ? 'disabled' : ''}>← Anterior</button>
      <button class="btn sm" id="next" ${chState.page + 1 >= total ? 'disabled' : ''}>Próxima →</button></div></div>`;
    $('#prev').onclick = () => { chState.page--; load(); };
    $('#next').onclick = () => { chState.page++; load(); };

    $('#lista').querySelectorAll('[data-ver]').forEach(b => b.onclick = () => verChamado(b.dataset.ver, load));
    $('#lista').querySelectorAll('[data-edit]').forEach(b => b.onclick = async () => {
      const c = list.find(x => x.id == b.dataset.edit);
      openForm({ title: `Editar chamado #${c.id}`, fields: await chamadoFields(),
        values: { ...c, clienteId: cliId(c), categoriaId: catId(c) },
        onSubmit: async d => { await api(`/chamados/${c.id}`, { method: 'PUT', body: d }); toast('Atualizado!'); load(); } });
    });
    $('#lista').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!await confirmDialog(`Excluir chamado #${b.dataset.del}?`)) return;
      run(() => api(`/chamados/${b.dataset.del}`, { method: 'DELETE' }), 'Excluído!').then(load).catch(() => {});
    });
  }
  load();
}

async function verChamado(id, onChange) {
  let c, comentarios = [];
  try {
    c = await api(`/chamados/${id}`);
    comentarios = c.comentarios || [];
  } catch (e) { return toast(e.message, true); }

  const fechado = c.status === 'FECHADO';
  const m = openModal(`
    <h2>#${c.id} — ${esc(c.titulo)}</h2>
    <div class="kv">
      <span>Status</span><span>${badge(c.status)}</span>
      <span>Prioridade</span><span>${badge(c.prioridade)}</span>
      <span>Cliente</span><span>${esc(cliNome(c))}</span>
      <span>Categoria</span><span>${esc(catNome(c))}</span>
      <span>Técnico</span><span>${esc(tecNome(c))}</span>
      <span>Criado em</span><span>${fmtData(c.dataCriacao)}</span>
      <span>Fechado em</span><span>${fmtData(c.dataFechamento)}</span>
      <span>Descrição</span><span>${esc(c.descricao)}</span>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn sm" id="a-atribuir" ${fechado ? 'disabled' : ''}>Atribuir técnico</button>
      <button class="btn sm" id="a-status" ${fechado ? 'disabled' : ''}>Alterar status</button>
      <button class="btn sm primary" id="a-fechar" ${fechado ? 'disabled' : ''}>Fechar chamado</button>
    </div>
    <h3 style="margin-top:20px">Comentários (${comentarios.length})</h3>
    <div id="coms">${comentarios.map(x => `<div class="coment"><small>${esc(x.autor)} — ${fmtData(x.dataCriacao)}</small>${esc(x.texto)}</div>`).join('') || '<div class="empty">Sem comentários.</div>'}</div>
    <form id="f-com"><label>Novo comentário</label>
      <input name="autor" placeholder="Seu nome" required maxlength="100" style="margin-bottom:6px">
      <input name="texto" placeholder="Comentário (máx. 100 caracteres)" required maxlength="100">
      <div class="foot"><button type="button" class="btn" data-close>Fechar</button><button class="btn primary">Comentar</button></div></form>`);

  const refresh = () => { m.close(); verChamado(id, onChange); onChange && onChange(); };

  $('#a-atribuir', m.el).onclick = async () => openForm({
    title: 'Atribuir técnico',
    fields: [{ name: 'tecnicoId', label: 'Técnico', type: 'select', number: true, options: await optionsFrom('/tecnicos', t => `${t.nome} (${label(t.perfil)})`) }],
    values: { tecnicoId: tecId(c) }, submitLabel: 'Atribuir',
    onSubmit: async d => { await api(`/chamados/${id}/atribuir`, { method: 'PATCH', body: d }); toast('Técnico atribuído!'); refresh(); },
  });
  $('#a-status', m.el).onclick = () => openForm({
    title: 'Alterar status',
    fields: [{ name: 'status', label: 'Novo status', type: 'select', options: opts(ENUMS.status.filter(s => s !== 'FECHADO')) }],
    values: { status: c.status }, submitLabel: 'Alterar',
    onSubmit: async d => { await api(`/chamados/${id}/status`, { method: 'PATCH', body: d }); toast('Status alterado!'); refresh(); },
  });
  $('#a-fechar', m.el).onclick = async () => {
    if (!await confirmDialog('Fechar este chamado? Essa ação não pode ser desfeita por aqui.')) return;
    run(() => api(`/chamados/fechar/${id}`, { method: 'PUT' }), 'Chamado fechado!').then(refresh).catch(() => {});
  };
  $('#f-com', m.el).onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    run(() => api('/comentarios', { method: 'POST', body: { texto: fd.get('texto'), autor: fd.get('autor'), chamadoId: Number(id) } }), 'Comentário adicionado!')
      .then(refresh).catch(() => {});
  };
}

const VIEWS = {
  dashboard: renderDashboard,
  chamados: renderChamados,
  clientes: () => renderCrud('clientes'),
  tecnicos: () => renderCrud('tecnicos'),
  categorias: () => renderCrud('categorias'),
  comentarios: () => renderCrud('comentarios'),
};

function route() {
  const v = (location.hash || '#dashboard').slice(1);
  const view = VIEWS[v] ? v : 'dashboard';
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  VIEWS[view]();
}
window.addEventListener('hashchange', route);
route();
