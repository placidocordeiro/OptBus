
const { useState, useEffect, useRef, useMemo } = React;

/* ════════════════════════════════════════════
   MOCK DATA
════════════════════════════════════════════ */
const LINES = [
  { id:'L001', name:'Centro — Pajuçara',          km:8.4,  buses:8,  eff:72, occ:81, delay:4.2, color:'#FFDD00',
    route:[[-9.6658,-35.7350],[-9.6620,-35.7290],[-9.6580,-35.7220],[-9.6545,-35.7165],[-9.6510,-35.7128],[-9.6498,-35.7089]] },
  { id:'L002', name:'Farol — Benedito Bentes',    km:13.1, buses:7,  eff:88, occ:64, delay:1.8, color:'#3DA85A',
    route:[[-9.6733,-35.7386],[-9.6680,-35.7410],[-9.6580,-35.7430],[-9.6380,-35.7450],[-9.6120,-35.7460],[-9.5869,-35.7459]] },
  { id:'L003', name:'Tabuleiro — Serraria',        km:11.6, buses:10, eff:61, occ:88, delay:7.5, color:'#CC3333',
    route:[[-9.6390,-35.7850],[-9.6340,-35.7760],[-9.6280,-35.7680],[-9.6220,-35.7640],[-9.6180,-35.7610],[-9.6156,-35.7589]] },
  { id:'L004', name:'Mangabeiras — Centro',        km:9.2,  buses:9,  eff:79, occ:75, delay:3.1, color:'#A855F7',
    route:[[-9.6847,-35.7623],[-9.6800,-35.7560],[-9.6760,-35.7500],[-9.6720,-35.7440],[-9.6690,-35.7390],[-9.6658,-35.7350]] },
  { id:'L005', name:'Ponta Verde — Antares',       km:12.3, buses:5,  eff:91, occ:58, delay:1.2, color:'#4A90D9',
    route:[[-9.6576,-35.7147],[-9.6480,-35.7200],[-9.6350,-35.7280],[-9.6200,-35.7380],[-9.6090,-35.7490],[-9.5987,-35.7631]] },
];

const HOURLY = [
  {h:'05',d:28},{h:'06',d:55},{h:'07',d:87},{h:'08',d:94},{h:'09',d:72},{h:'10',d:51},
  {h:'11',d:48},{h:'12',d:66},{h:'13',d:62},{h:'14',d:49},{h:'15',d:53},{h:'16',d:71},
  {h:'17',d:95},{h:'18',d:98},{h:'19',d:82},{h:'20',d:58},{h:'21',d:39},{h:'22',d:21},
];

// Per-line mock demand (deterministic)
const LINE_HOURLY = {
  L001: [22,48,91,96,68,45,42,61,58,44,50,67,92,97,85,62,37,19],
  L002: [18,42,72,81,78,58,52,69,65,52,56,63,88,91,78,55,32,15],
  L003: [30,60,95,99,74,52,48,68,63,48,55,74,99,100,88,65,42,22],
  L004: [25,52,85,90,71,49,46,64,60,46,51,70,90,94,82,60,36,18],
  L005: [14,34,58,65,60,42,38,52,48,36,40,50,68,72,61,44,25,11],
};

const INCIDENTS = [
  {id:1,sev:'Alta',  type:'Assalto',        line:'L003',loc:'Av. Fernandes Lima, 1200',      time:'08:14', desc:'Passageiro relatou assalto a mão armada dentro do veículo em movimento.',    st:'pending'},
  {id:2,sev:'Média', type:'Briga',           line:'L001',loc:'Terminal Rodoviário de Maceió', time:'10:32', desc:'Conflito físico entre dois passageiros ao embarcar no terminal.',              st:'pending'},
  {id:3,sev:'Baixa', type:'Assédio verbal',  line:'L002',loc:'R. do Comércio, próx. 340',    time:'11:05', desc:'Relato de assédio verbal contra passageira por outro usuário.',                st:'pending'},
  {id:4,sev:'Alta',  type:'Vandalismo',       line:'L004',loc:'Av. Gustavo Paiva, 5200',      time:'13:48', desc:'Vidro traseiro do veículo quebrado por passageiro não identificado.',          st:'pending'},
  {id:5,sev:'Média', type:'Irregularidade',  line:'L005',loc:'Pq. Municipal de Maceió',       time:'15:20', desc:'Motorista recusou embarque de passageiro com mobilidade reduzida.',           st:'pending'},
];

const FAQ = [
  {q:'Como filtrar os dados por linha específica?',
   a:'Nas telas de Painel Geral e Linhas, use o menu suspenso "Filtrar linha" no topo. Os gráficos, o mapa e a tabela se atualizam automaticamente.'},
  {q:'O que é o índice de eficiência de rota?',
   a:'É um índice composto (0–100%) que considera a ocupação média, o tempo de percurso real versus o estimado e a frequência de atrasos. Valores abaixo de 70% indicam necessidade de revisão; acima de 85% indicam operação saudável.'},
  {q:'Como executar a otimização de uma linha?',
   a:'Na tela "Linhas", selecione a linha desejada e clique em "Executar Otimização". O algoritmo analisa dados dos últimos 30 dias e exibe sugestões de divisão, fusão ou ajuste de frequência da rota.'},
  {q:'Como funciona a alocação automática de frota?',
   a:'O sistema analisa a demanda histórica por faixa de horário para cada linha. O algoritmo identifica períodos com superlotação ou ociosidade e recomenda redistribuição de veículos.'},
  {q:'Quando uma denúncia é encaminhada automaticamente à polícia?',
   a:'Ocorrências de severidade "Alta" dos tipos Assalto, Ameaça ou Crime são sinalizadas para acionamento policial automático, mas o operador deve confirmar antes do envio efetivo.'},
  {q:'Com que frequência os dados de lotação são atualizados?',
   a:'Os dados de ocupação são atualizados a cada ~2 minutos com base nas leituras de RFID nas portas de embarque e desembarque de cada veículo.'},
  {q:'Como exportar um relatório de dados?',
   a:'No momento, a exportação em CSV está disponível pelo ícone de exportação no canto direito de cada tabela. A integração com PDF está prevista para versão 1.1.'},
];

const OPT = {
  L001: {tipo:'divisão',    titulo:'Dividir linha em dois segmentos',
    desc:'A linha L001 (8,4 km) apresenta alta variância de lotação entre os trechos. Sugere-se divisão em L001A (Centro–Pajuçara, 4,2 km) e L001B (Pajuçara–Ponta Verde, 4,2 km) com integração em terminal intermediário na Orla.',
    impacto:'↓ 18% no tempo médio de viagem · ↑ 12% de cobertura · necessidade de +2 veículos'},
  L002: {tipo:'manutenção', titulo:'Rota dentro dos parâmetros aceitáveis',
    desc:'A linha L002 apresenta eficiência de 88% e atrasos de apenas 1,8 min. Nenhuma reestruturação necessária. Recomenda-se revisão periódica em 90 dias.',
    impacto:'Sem alterações recomendadas'},
  L003: {tipo:'ajuste',     titulo:'Rebalanceamento de frequência e trajeto',
    desc:'Linha L003 com eficiência crítica de 61% e superlotação de 88%. Sugere-se aumento de frequência nos picos (06–09h e 17–19h) e incorporação de trecho ao corredor da L004 (Mangabeiras), eliminando 2,8 km de sobreposição.',
    impacto:'↓ 23% no tempo de espera · ↓ 11% de sobreposição · necessidade de +3 veículos no pico'},
  L004: {tipo:'ajuste',     titulo:'Realocação pontual de veículo',
    desc:'Linha L004 com eficiência de 79%. Recomenda-se retirada de 1 veículo entre 10h e 16h para realocação na L003 (Tabuleiro–Serraria), que opera com déficit no mesmo período.',
    impacto:'↓ 1 veículo entre 10h–16h · veículo realocado para L003'},
  L005: {tipo:'manutenção', titulo:'Linha de alto desempenho',
    desc:'L005 com eficiência de 91% — melhor da frota. Nenhuma intervenção necessária. Pode servir de referência operacional para outras linhas.',
    impacto:'Nenhuma alteração necessária'},
};

const ALLOC = {
  '05:00–07:00': {alta:[{id:'L003',n:'Tabuleiro–Serraria',cur:6,rec:8,d:'+2'},{id:'L001',n:'Centro–Pajuçara',cur:5,rec:6,d:'+1'}], baixa:[{id:'L005',n:'Ponta Verde–Antares',cur:4,rec:2,d:'-2'},{id:'L002',n:'Farol–Ben. Bentes',cur:5,rec:3,d:'-2'}]},
  '07:00–10:00': {alta:[{id:'L003',n:'Tabuleiro–Serraria',cur:8,rec:12,d:'+4'},{id:'L001',n:'Centro–Pajuçara',cur:8,rec:11,d:'+3'},{id:'L004',n:'Mangabeiras–Centro',cur:9,rec:11,d:'+2'}], baixa:[{id:'L005',n:'Ponta Verde–Antares',cur:5,rec:3,d:'-2'},{id:'L002',n:'Farol–Ben. Bentes',cur:6,rec:4,d:'-2'}]},
  '10:00–14:00': {alta:[{id:'L002',n:'Farol–Ben. Bentes',cur:6,rec:7,d:'+1'}], baixa:[{id:'L003',n:'Tabuleiro–Serraria',cur:10,rec:6,d:'-4'},{id:'L001',n:'Centro–Pajuçara',cur:8,rec:5,d:'-3'}]},
  '14:00–17:00': {alta:[{id:'L004',n:'Mangabeiras–Centro',cur:7,rec:8,d:'+1'},{id:'L002',n:'Farol–Ben. Bentes',cur:6,rec:7,d:'+1'}], baixa:[{id:'L005',n:'Ponta Verde–Antares',cur:5,rec:3,d:'-2'},{id:'L001',n:'Centro–Pajuçara',cur:8,rec:6,d:'-2'}]},
  '17:00–20:00': {alta:[{id:'L001',n:'Centro–Pajuçara',cur:8,rec:13,d:'+5'},{id:'L003',n:'Tabuleiro–Serraria',cur:10,rec:14,d:'+4'},{id:'L004',n:'Mangabeiras–Centro',cur:9,rec:12,d:'+3'}], baixa:[{id:'L005',n:'Ponta Verde–Antares',cur:5,rec:2,d:'-3'}]},
  '20:00–23:00': {alta:[], baixa:[{id:'L003',n:'Tabuleiro–Serraria',cur:10,rec:5,d:'-5'},{id:'L004',n:'Mangabeiras–Centro',cur:9,rec:4,d:'-5'},{id:'L001',n:'Centro–Pajuçara',cur:8,rec:4,d:'-4'}]},
};

const CHAT_KB = [
  {keys:['filtro','filtrar','linha','selecionar'],   r:'Para aplicar filtros, use os menus suspensos no topo de cada tela. Você pode filtrar por linha e por período. Os gráficos, mapas e tabelas se atualizam automaticamente.'},
  {keys:['otimiz','rota'],                            r:'A otimização de rota é acessada na tela "Linhas". Selecione a linha e clique em "Executar Otimização". O algoritmo analisa os últimos 30 dias e sugere ajustes como divisão, fusão ou remoção de trechos.'},
  {keys:['frota','ônibus','alocar','aloc','redistrib'],r:'Na tela "Alocação de Frota", selecione o turno desejado e clique em "Atualizar". O sistema mostrará as linhas com maior demanda (reforçar) e menor demanda (reduzir) e os veículos recomendados.'},
  {keys:['denúncia','seguran','polí','ocorrência','incidente'], r:'Ocorrências de segurança ficam na tela "Segurança". Cada card mostra a severidade, tipo e localização. Você pode Acionar a Polícia, Arquivar ou Ignorar cada registro.'},
  {keys:['relatório','relatorio','export','baixar'],  r:'A exportação em CSV está disponível pelo ícone no canto de cada tabela. Exportação em PDF está prevista para a versão 1.1 do sistema.'},
  {keys:['login','senha','acesso','entrar'],          r:'O acesso é feito com as credenciais fornecidas pelo administrador da DMTT. Em caso de problema com login ou senha, contate o suporte técnico pelo ramal 4120.'},
  {keys:['eficiência','índice','indicador'],          r:'A eficiência é um índice de 0 a 100% que combina ocupação média, tempo de percurso real vs. estimado e frequência de atrasos. Abaixo de 70% indica necessidade de revisão; acima de 85% é operação saudável.'},
  {keys:['mapa','rota','trajeto','traçado'],          r:'Os mapas de rotas estão disponíveis nas telas Painel Geral, Linhas e Alocação de Frota. Use o filtro de linha para destacar um trajeto específico.'},
];

const getReply = msg => {
  const m = msg.toLowerCase();
  for (const item of CHAT_KB) if (item.keys.some(k => m.includes(k))) return item.r;
  return 'Não encontrei uma resposta específica para isso. Tente perguntar sobre: filtros, otimização de rota, alocação de frota, ocorrências de segurança ou exportação de dados. Você também pode consultar o FAQ para respostas detalhadas.';
};

/* ════════════════════════════════════════════
   ÍCONES SVG
════════════════════════════════════════════ */
const Ic = ({ n, s=15, c='currentColor' }) => ({
  dash:  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke={c} strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1" stroke={c} strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1" stroke={c} strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1" stroke={c} strokeWidth="1.3"/></svg>,
  route: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="4" cy="4" r="2.5" stroke={c} strokeWidth="1.3"/><circle cx="12" cy="12" r="2.5" stroke={c} strokeWidth="1.3"/><path d="M4 6.5V8.5a3 3 0 003 3H9" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>,
  fleet: <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="1" y="5" width="14" height="7" rx="1.5" stroke={c} strokeWidth="1.3"/><circle cx="4.5" cy="12" r="1.5" stroke={c} strokeWidth="1.2"/><circle cx="11.5" cy="12" r="1.5" stroke={c} strokeWidth="1.2"/><path d="M1 8h14" stroke={c} strokeWidth="1.3"/><path d="M6 5V3h4v2" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>,
  sec:   <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 1.5L2 4v4.5C2 11.5 4.7 14 8 15c3.3-1 6-3.5 6-6.5V4L8 1.5z" stroke={c} strokeWidth="1.3"/><path d="M5.5 8l2 2 3-3" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chat:  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 3V3z" stroke={c} strokeWidth="1.3"/></svg>,
  faq:   <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={c} strokeWidth="1.3"/><path d="M6.5 6.5a1.5 1.5 0 113 0c0 1-1.5 1.5-1.5 2.5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="11.5" r="0.5" fill={c}/></svg>,
  out:   <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke={c} strokeWidth="1.3" strokeLinecap="round"/><path d="M11 11l3-3-3-3M14 8H6" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bus:   <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="9" rx="1.5" stroke={c} strokeWidth="1.3"/><circle cx="4" cy="12" r="1.5" stroke={c} strokeWidth="1.2"/><circle cx="12" cy="12" r="1.5" stroke={c} strokeWidth="1.2"/><path d="M1 7h14M6 3v5M10 3v5" stroke={c} strokeWidth="1.3"/></svg>,
  send:  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M14 2L7 9M14 2L9 14l-2-5-5-2 12-5z" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chv:   <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chvu:  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 10l4-4 4 4" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  ref:   <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M13 8a5 5 0 11-1.46-3.54L13 3v4h-4" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  warn:  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2L1.5 14h13L8 2z" stroke={c} strokeWidth="1.3"/><path d="M8 6.5v4" stroke={c} strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="12" r="0.5" fill={c}/></svg>,
  eye:   <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke={c} strokeWidth="1.3"/><circle cx="8" cy="8" r="2.5" stroke={c} strokeWidth="1.3"/></svg>,
  eyeo:  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.7A2.5 2.5 0 0010.3 10M4 4C2.5 5.2 1.5 7 1.5 7s2.5 5 6.5 5c1.3 0 2.5-.4 3.5-1M7 3.1C7.3 3 7.7 3 8 3c4 0 6.5 4 6.5 5s-.6 1.4-1.5 2.3" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>,
  lock:  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="8" rx="1.5" stroke={c} strokeWidth="1.3"/><path d="M5 7V5a3 3 0 016 0v2" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>,
  user:  <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke={c} strokeWidth="1.3"/><path d="M2.5 14c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/></svg>,
}[n] || null);

/* ════════════════════════════════════════════
   LEAFLET MAP
════════════════════════════════════════════ */
const LeafletMap = ({ highlightId=null, height='380px', mapKey }) => {
  const divRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!divRef.current) return;
    const map = L.map(divRef.current, { zoomControl: true, attributionControl: false })
      .setView([-9.640, -35.737], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    mapRef.current = map;

    LINES.forEach(ln => {
      const isHL = highlightId ? ln.id === highlightId : true;
      const routeColor = isHL ? '#FFDD00' : '#444444';
      L.polyline(ln.route, {
        color: routeColor,
        weight: highlightId ? (isHL ? 5 : 1.5) : 2.5,
        opacity: highlightId ? (isHL ? 1 : 0.3) : 0.7,
      }).addTo(map);
      if (!highlightId || isHL) {
        const r = ln.route;
        L.circleMarker(r[0], { radius:5, color:routeColor, fillColor:'#141414', fillOpacity:1, weight:2 }).addTo(map);
        L.circleMarker(r[r.length-1], { radius:5, color:routeColor, fillColor:routeColor, fillOpacity:1, weight:2 }).addTo(map);
      }
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [mapKey, highlightId]);

  return <div ref={divRef} style={{ height, width:'100%', borderRadius:4, zIndex:0 }}/>;
};

/* ════════════════════════════════════════════
   SVG BAR CHART
════════════════════════════════════════════ */
const BarChart = ({ data, h=100 }) => {
  const max = Math.max(...data.map(d=>d.d));
  const W = 500, bw = Math.floor(W/data.length)-2;
  return (
    <svg viewBox={`0 0 ${W} ${h+22}`} width="100%" preserveAspectRatio="none">
      {data.map((d,i) => {
        const bh = Math.round((d.d/max)*h);
        const x = i*(W/data.length)+1;
        const col = d.d>80?'#FFDD00':'#333333';
        return (
          <g key={d.h}>
            <rect x={x} y={h-bh} width={bw} height={bh} fill={col} rx="2" opacity="0.83"/>
            <text x={x+bw/2} y={h+15} textAnchor="middle" fontSize="8.5" fill="#A6A6A6">{d.h}h</text>
          </g>
        );
      })}
    </svg>
  );
};

/* ════════════════════════════════════════════
   DONUT CHART
════════════════════════════════════════════ */
const Donut = ({ items }) => {
  const total = items.reduce((s,i)=>s+i.v,0);
  let angle = -90;
  const r=50, cx=65, cy=65;
  const slices = items.map(it => {
    const a = (it.v/total)*360;
    const s = (angle*Math.PI)/180, e = ((angle+a)*Math.PI)/180;
    const x1=cx+r*Math.cos(s), y1=cy+r*Math.sin(s), x2=cx+r*Math.cos(e), y2=cy+r*Math.sin(e);
    const p = `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${a>180?1:0} 1 ${x2} ${y2} Z`;
    angle += a;
    return { ...it, p };
  });
  return (
    <div style={{display:'flex',alignItems:'center',gap:18}}>
      <svg viewBox="0 0 130 130" width="110" height="110" style={{flexShrink:0}}>
        {slices.map((s,i)=><path key={i} d={s.p} fill={s.col} opacity="0.88"/>)}
        <circle cx={cx} cy={cy} r="30" style={{fill:"var(--card)"}}/>
        <text x={cx} y={cy-3} textAnchor="middle" fontSize="12" fontWeight="700" style={{fill:"var(--text)"}}>{total}</text>
        <text x={cx} y={cy+12} textAnchor="middle" fontSize="7.5" style={{fill:"var(--muted)"}}>total</text>
      </svg>
      <div style={{display:'flex',flexDirection:'column',gap:7}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:7,fontSize:11}}>
            <span style={{width:9,height:9,borderRadius:2,background:s.col,flexShrink:0}}/>
            <span style={{color:'var(--muted)'}}>{s.lbl}</span>
            <span style={{fontFamily:'IBM Plex Mono',fontWeight:600,marginLeft:'auto',paddingLeft:8}}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════ */
const Sidebar = ({ cur, nav, logout }) => {
  const items = [
    {id:'dash',  lbl:'Painel Geral',      ic:'dash',  sec:'Análise'},
    {id:'linha', lbl:'Linhas',            ic:'route'},
    {id:'frota', lbl:'Alocação de Frota', ic:'fleet'},
    {id:'sec',   lbl:'Segurança',         ic:'sec',   sec:'Operações'},
    {id:'chat',  lbl:'Assistente',        ic:'chat',  sec:'Suporte'},
    {id:'faq',   lbl:'FAQ',               ic:'faq'},
  ];
  return (
    <aside className="sidebar">
      <div className="sb-header">
        <div className="sb-logo">OptBus</div>
        <div className="sb-sub">DMTT — Gestão de Transporte</div>
      </div>
      <nav className="sb-nav">
        {items.map(item => (
          <React.Fragment key={item.id}>
            {item.sec && <div className="nav-sect">{item.sec}</div>}
            <div className={`nav-item${cur===item.id?' active':''}`} onClick={()=>nav(item.id)}>
              {Ic({n:item.ic, s:14, c:cur===item.id?'#FFDD00':'#7A8799'})}
              {item.lbl}
            </div>
          </React.Fragment>
        ))}
      </nav>
      <div className="sb-footer">
        <div className="sb-user"><strong>João Silva</strong>Operador Sênior</div>
        <div className="nav-item" style={{padding:'6px 0',cursor:'pointer',marginTop:10}} onClick={logout}>
          {Ic({n:'out',s:13,c:'#7A8799'})}
          <span style={{fontSize:12,color:'var(--muted)'}}>Encerrar sessão</span>
        </div>
      </div>
    </aside>
  );
};

/* ════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════ */
const Login = ({ onLogin }) => (
  <div className="login-page">
    <div className="login-left">
      <div className="login-brand">
        <div className="login-brand-icon">TV</div>
        <div>
          <div className="login-brand-name">OptBus</div>
          <div className="login-brand-sub">Secretaria Municipal de Trânsito e Transporte</div>
        </div>
      </div>
      <div className="login-hero">
        <div className="login-tag-line"><span className="login-tag-bar"/>Sistema Oficial</div>
        <h1 className="login-heading">Gestão integrada de transporte público baseada em RFID</h1>
        <p className="login-desc">Plataforma institucional para monitoramento da frota, análise de fluxo de passageiros, otimização de rotas e segurança operacional em tempo real.</p>
        <ul className="login-bullets">
          <li>Leitura automática via cartões RFID</li>
          <li>Indicadores de ocupação por linha</li>
          <li>Registro auditável de eventos</li>
        </ul>
      </div>
      <div className="login-left-footer">© 2026 Prefeitura Municipal — Uso restrito a servidores autorizados.</div>
    </div>

    <div className="login-right">
      <div className="login-right-inner">
        <div className="login-right-title">Acesso ao sistema</div>
        <div className="login-right-sub">Informe suas credenciais institucionais.</div>
        <div className="login-form-card">
          <div className="login-field">
            <div className="login-field-lbl">USUÁRIO</div>
            <div className="login-input-wrap">
              {Ic({n:'user',s:14,c:'var(--muted)'})}
              <input className="login-field-input" type="text" placeholder="carlos.mendes"/>
            </div>
          </div>
          <div className="login-field">
            <div className="login-field-lbl">SENHA</div>
            <div className="login-input-wrap">
              {Ic({n:'lock',s:14,c:'var(--muted)'})}
              <input className="login-field-input" type="password" placeholder="••••••••"/>
            </div>
          </div>
          <div className="login-row">
            <label className="login-check-lbl"><input type="checkbox" className="login-check"/> Manter conectado</label>
            <span className="login-forgot">Esqueci a senha</span>
          </div>
          <button className="btn btn-primary login-btn" onClick={onLogin}>Entrar</button>
          <div className="login-secure">
            {Ic({n:'sec',s:13,c:'var(--green)'})} Conexão segura • Acesso registrado e auditado
          </div>
        </div>
        <div className="login-support">
          Em caso de dúvidas, contate o suporte: <em>suporte@dmtt.gov.br</em>
        </div>
      </div>
    </div>
  </div>
);

/* ════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════ */
const Dashboard = () => {
  const [fl, setFl]=useState('all');
  const shown = fl==='all' ? LINES : LINES.filter(l=>l.id===fl);
  const avgOcc = Math.round(shown.reduce((s,l)=>s+l.occ,0)/shown.length);
  const donutItems = [
    {lbl:'Alta (>80%)',  v:shown.filter(l=>l.occ>80).length||0,  col:'#FFDD00'},
    {lbl:'Moderada 60–80%', v:shown.filter(l=>l.occ>=60&&l.occ<=80).length||0, col:'#A6A6A6'},
    {lbl:'Baixa (<60%)', v:shown.filter(l=>l.occ<60).length||0,  col:'#383838'},
  ].filter(x=>x.v>0);
  if(!donutItems.length) donutItems.push({lbl:'Sem dados',v:1,col:'#383838'});

  return (
    <div>
      <div className="topbar">
        <div>
          <span className="topbar-title">Painel Geral</span>
          <span className="topbar-meta" style={{marginLeft:14}}>Atualizado às 14:27 · dados em tempo quase real</span>
        </div>
        <div className="frow">
          <span className="flbl">Filtrar linha:</span>
          <select className="sel" value={fl} onChange={e=>setFl(e.target.value)}>
            <option value="all">Todas as linhas</option>
            {LINES.map(l=><option key={l.id} value={l.id}>{l.id} — {l.name}</option>)}
          </select>
        </div>
      </div>
      <div className="content">
        <div className="kpi-grid">
          {[
            {lbl:'Linhas Monitoradas', val:shown.length, delta:'em operação', cls:'c-nt'},
            {lbl:'Veículos em Circulação', val:shown.reduce((s,l)=>s+l.buses,0), delta:'+2 vs ontem', cls:'c-up'},
            {lbl:'Ocupação Média', val:`${avgOcc}%`, delta:avgOcc>80?'⚠ Crítica':avgOcc>65?'Moderada':'Normal', cls:avgOcc>80?'c-dn':avgOcc>65?'c-nt':'c-up'},
            {lbl:'Ocorrências Hoje', val:'5', delta:'2 requerem ação', cls:'c-dn'},
          ].map((k,i)=>(
            <div key={i} className="kpi">
              <div className="kpi-lbl">{k.lbl}</div>
              <div className="kpi-val">{k.val}</div>
              <div className={`kpi-delta ${k.cls}`}>{k.delta}</div>
            </div>
          ))}
        </div>

        <div className="g2 mb14">
          <div className="card">
            <div className="card-title">Demanda por hora — hoje</div>
            <BarChart data={HOURLY}/>
            <div style={{display:'flex',gap:14,marginTop:6,fontSize:10,color:'var(--muted)'}}>
              <span>■ <span style={{color:'#FFDD00'}}>Pico (&gt;80%)</span></span>
              <span>■ <span style={{color:'#6B6B6B'}}>Normal (&lt;80%)</span></span>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Distribuição de lotação</div>
            <Donut items={donutItems}/>
            <div style={{marginTop:14}}>
              {shown.map(l=>(
                <div key={l.id} style={{marginBottom:8}}>
                  <div className="prow"><span style={{fontSize:12}}>{l.id} — {l.name.split('—')[0].trim()}</span><span className="mono" style={{fontSize:11}}>{l.occ}%</span></div>
                  <div className="pbar"><div className="pfill" style={{width:`${l.occ}%`,background:'#FFDD00'}}/></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card mb14">
          <div className="card-title">Mapa de rotas — Maceió/AL</div>
          <LeafletMap highlightId={fl!=='all'?fl:null} height="390px" mapKey={`dash-${fl}`}/>
        </div>

        <div className="card">
          <div className="card-title">Resumo das linhas</div>
          <table className="tbl">
            <thead><tr><th>Linha</th><th>Trajeto</th><th>Veículos</th><th>Extensão</th><th>Ocupação</th><th>Eficiência</th><th>Atraso médio</th></tr></thead>
            <tbody>
              {shown.map(l=>(
                <tr key={l.id}>
                  <td><span className="badge bb">{l.id}</span></td>
                  <td style={{fontSize:12}}>{l.name}</td>
                  <td className="mono" style={{fontSize:12}}>{l.buses}</td>
                  <td className="mono" style={{fontSize:12}}>{l.km} km</td>
                  <td><span className={`badge ${l.occ>80?'br':l.occ>60?'by':'bg'}`}>{l.occ}%</span></td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:7}}>
                      <div className="eff"><div className="eff-f" style={{width:`${l.eff}%`,background:'#FFDD00'}}/></div>
                      <span className="mono" style={{fontSize:11}}>{l.eff}%</span>
                    </div>
                  </td>
                  <td className="mono" style={{fontSize:12}}>{l.delay} min</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   LINHAS
════════════════════════════════════════════ */
const Linha = () => {
  const [sel, setSel]=useState(LINES[0]);
  const [modal, setModal]=useState(false);
  const [done, setDone]=useState(false);
  const sug = OPT[sel.id];
  const hData = useMemo(()=>HOURLY.map((d,i)=>({h:d.h, d:LINE_HOURLY[sel.id][i]})),[sel.id]);
  const effColor = '#FFDD00';
  const occColor = '#FFDD00';

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Detalhe de Linha</span>
        <select className="sel" value={sel.id} onChange={e=>{setSel(LINES.find(l=>l.id===e.target.value));setDone(false);}}>
          {LINES.map(l=><option key={l.id} value={l.id}>{l.id} — {l.name}</option>)}
        </select>
      </div>
      <div className="content">
        <div className="g2 mb14">
          <div>
            <div className="card mb14">
              <div className="card-title">Informações da linha</div>
              <div className="mrow"><span className="mk">Identificação</span><span className="mv">{sel.id}</span></div>
              <div className="mrow"><span className="mk">Trajeto</span><span className="mv" style={{fontSize:12}}>{sel.name}</span></div>
              <div className="mrow"><span className="mk">Extensão</span><span className="mv">{sel.km} km</span></div>
              <div className="mrow"><span className="mk">Veículos alocados</span><span className="mv">{sel.buses}</span></div>
              <div className="mrow"><span className="mk">Atraso médio</span><span className="mv">{sel.delay} min</span></div>
            </div>
            <div className="card">
              <div className="card-title">Indicadores operacionais</div>
              <div style={{marginBottom:12}}>
                <div className="prow"><span style={{fontSize:12}}>Ocupação atual</span><span className="mono" style={{fontSize:11}}>{sel.occ}%</span></div>
                <div className="pbar" style={{height:9}}><div className="pfill" style={{width:`${sel.occ}%`,background:occColor}}/></div>
              </div>
              <div style={{marginBottom:12}}>
                <div className="prow"><span style={{fontSize:12}}>Eficiência de rota</span><span className="mono" style={{fontSize:11}}>{sel.eff}%</span></div>
                <div className="pbar" style={{height:9}}><div className="pfill" style={{width:`${sel.eff}%`,background:effColor}}/></div>
              </div>
              <div style={{padding:'10px 12px',background:'var(--sub-card)',borderRadius:4,fontSize:12,color:effColor,lineHeight:1.5}}>
                {sel.eff<70 ? '⚠ Eficiência crítica — otimização recomendada.' : sel.eff>85 ? '✓ Operando dentro dos parâmetros ideais.' : '○ Eficiência moderada — monitoramento contínuo recomendado.'}
              </div>
            </div>
          </div>
          <div>
            <div className="card mb14">
              <div className="card-title">Traçado da rota</div>
              <LeafletMap highlightId={sel.id} height="350px" mapKey={`linha-${sel.id}`}/>
            </div>
            <div className="card">
              <div className="card-title">Demanda por hora — {sel.id}</div>
              <BarChart data={hData} h={85}/>
            </div>
          </div>
        </div>

        <div className="card" style={{borderLeft:'4px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
            <div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:3}}>Otimização de Rota — Algoritmo I</div>
              <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.55}}>Analisa dados históricos dos últimos 30 dias e sugere reestruturação do trajeto: divisão, fusão com outras linhas ou eliminação de trechos redundantes.</div>
            </div>
            {!done
              ? <button className="btn btn-primary" style={{flexShrink:0}} onClick={()=>setModal(true)}>Executar Otimização</button>
              : <span className="badge bg" style={{flexShrink:0}}>✓ Análise concluída</span>
            }
          </div>
          {done && (
            <div style={{marginTop:16,padding:14,background:'var(--sub-card)',border:'1px solid var(--border)',borderRadius:4}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:4,textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--muted)'}}>{sug.tipo}</div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{sug.titulo}</div>
              <div style={{fontSize:12,color:'var(--text)',lineHeight:1.65,marginBottom:10}}>{sug.desc}</div>
              <div className="mono" style={{fontSize:11,color:'var(--muted)'}}>{sug.impacto}</div>
              <div style={{marginTop:12,display:'flex',gap:9}}>
                <button className="btn btn-primary" style={{fontSize:11,padding:'5px 13px'}}>Aplicar sugestão</button>
                <button className="btn btn-secondary" style={{fontSize:11,padding:'5px 13px'}} onClick={()=>setDone(false)}>Descartar</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="overlay" onClick={()=>setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-title">Executar Otimização — {sel.id}</div>
            <div style={{fontSize:12,color:'var(--muted)',lineHeight:1.6,marginBottom:14}}>
              O algoritmo irá analisar dados de lotação, tempo de percurso, sobreposição com outras linhas e frequência para gerar sugestões de ajuste de trajeto.
            </div>
            <div style={{background:'#EFF6FF',border:'1px solid #BAE6FD',borderRadius:4,padding:12,fontSize:12,color:'#0369A1'}}>
              Linha: <strong>{sel.id} — {sel.name}</strong><br/>
              Eficiência atual: <strong>{sel.eff}%</strong> · Ocupação: <strong>{sel.occ}%</strong> · Atraso médio: <strong>{sel.delay} min</strong>
            </div>
            <div className="modal-foot">
              <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={()=>{setDone(true);setModal(false);}}>Executar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════
   ALOCAÇÃO DE FROTA
════════════════════════════════════════════ */
const Frota = () => {
  const turnos = Object.keys(ALLOC);
  const [turno, setTurno]=useState(turnos[1]);
  const [refreshed, setRefreshed]=useState(false);
  const cur = ALLOC[turno];

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Alocação de Frota</span>
        <div className="frow">
          <span className="flbl">Turno:</span>
          <select className="sel" value={turno} onChange={e=>{setTurno(e.target.value);setRefreshed(false);}}>
            {turnos.map(t=><option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-secondary" style={{fontSize:11,padding:'5px 11px'}} onClick={()=>setRefreshed(true)}>
            {Ic({n:'ref',s:12})} Atualizar
          </button>
        </div>
      </div>
      <div className="content">
        {refreshed && <div style={{marginBottom:12,padding:'7px 13px',background:'var(--sub-card)',border:'1px solid var(--border)',borderRadius:4,fontSize:12,color:'var(--text)'}}>✓ Dados atualizados para o turno {turno}</div>}

        <div style={{marginBottom:14,padding:12,background:'var(--card)',border:'1px solid var(--border)',borderRadius:5,fontSize:12,color:'var(--text)',lineHeight:1.55}}>
          <strong>Turno: {turno}</strong> — Algoritmo II analisa demanda histórica deste período e recomenda redistribuição de veículos entre linhas para reduzir superlotação e ociosidade.
        </div>

        <div className="g2 mb14">
          <div className="card">
            <div className="card-title" style={{color:'var(--blue)'}}>▲ Maior demanda — reforçar frota</div>
            {cur.alta.length===0
              ? <div style={{fontSize:12,color:'var(--muted)',paddingTop:8}}>Nenhuma linha com demanda crítica neste turno.</div>
              : cur.alta.map(l=>(
                <div key={l.id} className="ai">
                  <span className="ai-id bb">{l.id}</span>
                  <div className="ai-info">{l.n}<small>{l.cur} veículos atuais → recomendado {l.rec}</small></div>
                  <span className="ai-delta" style={{color:'var(--blue)'}}>{l.d}</span>
                </div>
              ))
            }
          </div>
          <div className="card">
            <div className="card-title" style={{color:'var(--muted)'}}>▼ Menor demanda — reduzir frota</div>
            {cur.baixa.length===0
              ? <div style={{fontSize:12,color:'var(--muted)',paddingTop:8}}>Nenhuma linha com ociosidade neste turno.</div>
              : cur.baixa.map(l=>(
                <div key={l.id} className="ai">
                  <span className="ai-id bg">{l.id}</span>
                  <div className="ai-info">{l.n}<small>{l.cur} veículos atuais → recomendado {l.rec}</small></div>
                  <span className="ai-delta" style={{color:'var(--muted)'}}>{l.d}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="card mb14">
          <div className="card-title">Mapa — distribuição geográfica das linhas</div>
          <LeafletMap height="360px" mapKey={`frota-${turno}`}/>
        </div>

        <div className="card">
          <div className="card-title">Referência — demanda por hora (todas as linhas)</div>
          <BarChart data={HOURLY}/>
          <div style={{display:'flex',gap:14,marginTop:6,fontSize:10,color:'var(--muted)'}}>
            <span>■ <span style={{color:'#FFDD00'}}>Pico (&gt;80%)</span></span>
            <span>■ <span style={{color:'#6B6B6B'}}>Normal (&lt;80%)</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   SEGURANÇA
════════════════════════════════════════════ */
const Seguranca = () => {
  const [incs, setIncs]=useState(INCIDENTS);
  const [pol, setPol]=useState(null);
  const handle = (id, act) => { if(act==='pol'){setPol(id);return;} setIncs(p=>p.map(i=>i.id===id?{...i,st:act}:i)); };
  const confirmPol = () => { setIncs(p=>p.map(i=>i.id===pol?{...i,st:'pol'}:i)); setPol(null); };
  const active = incs.filter(i=>i.st==='pending');
  const done   = incs.filter(i=>i.st!=='pending');
  const SC = {Alta:'var(--blue)',Média:'var(--border)',Baixa:'var(--border)'};
  const SB = {Alta:'bb',Média:'bm',Baixa:'bm'};
  const stLbl = {pol:'→ Polícia acionada',arch:'Arquivado',ign:'Ignorado'};
  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Segurança — Ocorrências</span>
        <span className="badge br">{active.length} pendente{active.length!==1?'s':''}</span>
      </div>
      <div className="content">
        {active.length>0 && (
          <div className="mb18">
            <div className="stitle">Pendentes</div>
            {active.map(inc=>(
              <div key={inc.id} className="inc-card" style={{borderLeft:`3px solid ${SC[inc.sev]}`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <span className={`badge ${SB[inc.sev]}`}>{inc.sev}</span>
                  <span style={{fontSize:13,fontWeight:600}}>{inc.type}</span>
                  <span className="mono" style={{fontSize:11,color:'var(--muted)',marginLeft:'auto'}}>{inc.time} · {inc.line}</span>
                </div>
                <div style={{fontSize:11,color:'var(--muted)',marginBottom:5}}>{inc.loc}</div>
                <div style={{fontSize:13,color:'var(--text)',marginBottom:10,lineHeight:1.5}}>{inc.desc}</div>
                <div style={{display:'flex',gap:7}}>
                  <button className="btn btn-danger" style={{fontSize:11,padding:'5px 12px'}} onClick={()=>handle(inc.id,'pol')}>Acionar Polícia</button>
                  <button className="btn btn-secondary" style={{fontSize:11,padding:'5px 12px'}} onClick={()=>handle(inc.id,'arch')}>Arquivar</button>
                  <button className="btn btn-secondary" style={{fontSize:11,padding:'5px 12px'}} onClick={()=>handle(inc.id,'ign')}>Ignorar</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {done.length>0 && (
          <div>
            <div className="stitle" style={{color:'var(--muted)'}}>Resolvidas</div>
            {done.map(inc=>(
              <div key={inc.id} className="inc-card" style={{opacity:0.55}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span className={`badge ${SB[inc.sev]}`}>{inc.sev}</span>
                  <span style={{fontSize:13,fontWeight:600}}>{inc.type}</span>
                  <span className="mono" style={{fontSize:11,color:'var(--muted)'}}>{inc.time} · {inc.line}</span>
                  <span style={{fontSize:11,color:'var(--muted)',marginLeft:'auto',fontStyle:'italic'}}>{stLbl[inc.st]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {!active.length && !done.length && <div style={{textAlign:'center',padding:'60px 0',color:'var(--muted)',fontSize:13}}>Nenhuma ocorrência registrada.</div>}
      </div>
      {pol && (
        <div className="overlay" onClick={()=>setPol(null)}>
          <div className="modal" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <div className="modal-title" style={{color:'#CC3333'}}>⚠ Acionar Polícia Militar</div>
            <div style={{fontSize:12,color:'var(--text)',lineHeight:1.6,marginBottom:14}}>Confirma o acionamento da PM para a seguinte ocorrência?</div>
            <div style={{padding:12,background:'rgba(204,51,51,0.08)',border:'1px solid rgba(204,51,51,0.2)',borderRadius:4,fontSize:12,lineHeight:1.5}}>
              <strong>{incs.find(i=>i.id===pol)?.type}</strong> — {incs.find(i=>i.id===pol)?.loc}<br/>
              <span style={{color:'var(--muted)'}}>{incs.find(i=>i.id===pol)?.desc}</span>
            </div>
            <div className="modal-foot">
              <button className="btn btn-secondary" onClick={()=>setPol(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmPol}>Confirmar Acionamento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════
   CHAT
════════════════════════════════════════════ */
const Chat = () => {
  const [msgs, setMsgs]=useState([
    {from:'bot',text:'Olá! Sou o assistente do OptBus. Posso te ajudar a entender as funcionalidades do sistema e resolver dúvidas operacionais. Como posso ajudar?'}
  ]);
  const [inp, setInp]=useState('');
  const botRef = useRef(null);
  const suggs = ['Como filtrar por linha?','Como executar otimização?','Como alocar a frota?','Como tratar uma ocorrência?'];

  const send = () => {
    if(!inp.trim()) return;
    const um = {from:'user',text:inp};
    const bm = {from:'bot',text:getReply(inp)};
    setMsgs(p=>[...p,um,bm]);
    setInp('');
  };

  useEffect(()=>{ botRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs]);

  return (
    <div className="chat-wrap">
      <div className="topbar">
        <span className="topbar-title">Assistente OptBus</span>
        <span style={{fontSize:11,color:'var(--blue)'}}>● Online</span>
      </div>
      <div className="chat-msgs">
        {msgs.map((m,i)=>(
          <div key={i} className={`bubble ${m.from}`}>{m.text}</div>
        ))}
        <div ref={botRef}/>
      </div>
      {msgs.length===1 && (
        <div style={{padding:'0 26px 10px',display:'flex',gap:7,flexWrap:'wrap'}}>
          {suggs.map(s=>(
            <button key={s} className="btn btn-secondary" style={{fontSize:11,padding:'4px 11px'}} onClick={()=>setInp(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="chat-bar">
        <input className="chat-inp" value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Digite sua dúvida sobre o sistema…"/>
        <button className="btn btn-primary" onClick={send}>{Ic({n:'send',s:13,c:'#fff'})}</button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   FAQ
════════════════════════════════════════════ */
const Faq = () => {
  const [open, setOpen]=useState(null);
  return (
    <div>
      <div className="topbar"><span className="topbar-title">Perguntas Frequentes</span></div>
      <div className="content" style={{maxWidth:740}}>
        {FAQ.map((f,i)=>(
          <div key={i} className="faq-item">
            <div className="faq-q" onClick={()=>setOpen(open===i?null:i)}>
              <span>{f.q}</span>
              {Ic({n:open===i?'chvu':'chv',s:13,c:'#9CA3AF'})}
            </div>
            {open===i && <div className="faq-a">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════
   SESSION MODAL
════════════════════════════════════════════ */
const SessionModal = ({ onOk, onNo }) => (
  <div className="overlay" onClick={onNo}>
    <div className="modal" style={{maxWidth:340}} onClick={e=>e.stopPropagation()}>
      <div className="modal-title">Encerrar Sessão</div>
      <div style={{fontSize:13,color:'var(--muted)',lineHeight:1.6}}>Deseja encerrar a sessão atual? Você será redirecionado para a tela de login.</div>
      <div className="modal-foot">
        <button className="btn btn-secondary" onClick={onNo}>Não</button>
        <button className="btn btn-primary" onClick={onOk}>Sim, encerrar</button>
      </div>
    </div>
  </div>
);

// helper for CSS var in JSX
const var_ = n => `var(${n})`;

/* ════════════════════════════════════════════
   APP ROOT
════════════════════════════════════════════ */
const App = () => {
  const [screen, setScreen]=useState('login');
  const [sessModal, setSessModal]=useState(false);
  const [isDark, setIsDark]=useState(true);

  useEffect(()=>{
    if(isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  },[isDark]);

  const SCREENS = {
    dash:  <Dashboard/>,
    linha: <Linha/>,
    frota: <Frota/>,
    sec:   <Seguranca/>,
    chat:  <Chat/>,
    faq:   <Faq/>,
  };

  // Theme toggle button — visible in all screens
  const ThemeBtn = () => (
    <button className="theme-btn" onClick={()=>setIsDark(d=>!d)} title={isDark?'Modo claro':'Modo escuro'}>
      {isDark
        ? <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M11.9 3.4l-.7.7M3.4 11.9l.7-.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
        : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.5 10A6 6 0 016 2.5a6 6 0 000 11A6 6 0 0013.5 10z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      }
      {isDark ? 'Modo claro' : 'Modo escuro'}
    </button>
  );

  if(screen==='login') return (
    <>
      <Login onLogin={()=>setScreen('dash')}/>
      <ThemeBtn/>
    </>
  );

  return (
    <>
      <div className="app">
        <Sidebar cur={screen} nav={setScreen} logout={()=>setSessModal(true)}/>
        <div className="main">{SCREENS[screen]}</div>
        {sessModal && <SessionModal onOk={()=>{setSessModal(false);setScreen('login');}} onNo={()=>setSessModal(false)}/>}
      </div>
      <ThemeBtn/>
      {screen !== 'chat' && (
        <button className="fab-chat" onClick={()=>setScreen('chat')} title="Abrir assistente">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 4a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V4z" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 9h8M8 13h5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
