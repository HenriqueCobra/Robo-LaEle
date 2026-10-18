/* Robo-LaEle - dicionário do "lá ele".
 * Formas e stems podem ter acento/caixa alta: o motor normaliza tudo.
 * Cuidado: "dá" e "dê" normalizam para "da"/"de", então ficam de fora. */
var LaEle = globalThis.LaEle = globalThis.LaEle || {};

(function () {
  'use strict';

  var entries = [];

  // única fonte das faixas de raridade: storage e popup usam esta mesma função
  function tierOf(coef) {
    coef = Number(coef) || 0;
    if (coef < 1.5) return 'leve';
    if (coef < 2.5) return 'comum';
    if (coef < 3.5) return 'pesado';
    return 'lendario';
  }

  function add(id, label, coef, forms, stems) {
    var list = forms || [];
    entries.push({
      id: id,
      label: label,
      coef: coef,
      tier: tierOf(coef),
      forms: list,
      stems: stems || [],
      phrase: list.length > 0 && list.every(function (f) { return /\s/.test(f.trim()); })
    });
  }

  // palavra solta
  function w(id, label, coef, forms, stems) { add(id, label, coef, forms, stems); }
  // expressão de várias palavras
  function p(id, label, coef, forms) { add(id, label, coef, forms); }

  // produto cartesiano: cada início combinado com cada final
  function x(heads, tails) {
    var out = [];
    heads.forEach(function (h) {
      tails.forEach(function (t) { out.push(h + ' ' + t); });
    });
    return out;
  }

  // conjugações usadas nas expressões
  var DAR = ['dar', 'dou', 'deu', 'dei', 'dando', 'dava', 'daria', 'darei', 'dara', 'daram'];
  var COMER = ['comer', 'come', 'comem', 'comeu', 'comi', 'comia', 'comendo', 'comerei', 'comeria', 'comemos', 'comeram'];
  var CHUPAR = ['chupar', 'chupa', 'chupou', 'chupando', 'chupei', 'chupam', 'chupe'];
  var MAMAR = ['mamar', 'mama', 'mamo', 'mamou', 'mamando', 'mamei', 'mamam', 'mame'];
  var LAMBER = ['lamber', 'lambe', 'lambeu', 'lambendo', 'lambi', 'lambem'];
  var SENTAR = ['sentar', 'sento', 'sentou', 'sentando', 'senta', 'sentei', 'sentam'];
  var METER = ['meter', 'meto', 'meteu', 'metendo', 'mete', 'meti', 'metem'];
  var ENFIAR = ['enfiar', 'enfio', 'enfiou', 'enfiando', 'enfia', 'enfiei', 'enfiam'];
  var PEGAR = ['pegar', 'pego', 'pegou', 'pegando', 'pega', 'peguei', 'pegue', 'pegam'];
  var SEGURAR = ['segurar', 'segura', 'segurou', 'segurando', 'segure', 'segurei'];
  var BOTAR = ['botar', 'boto', 'botou', 'botando', 'bota', 'botei'];
  var COLOCAR = ['colocar', 'coloco', 'colocou', 'colocando', 'coloca', 'coloquei'];
  var ABRIR = ['abrir', 'abro', 'abriu', 'abrindo', 'abre', 'abri'];
  var TIRAR = ['tirar', 'tiro', 'tirou', 'tirando', 'tira', 'tirei', 'tiram'];
  var ESFREGAR = ['esfregar', 'esfrega', 'esfregou', 'esfregando', 'esfreguei', 'esfregam'];
  var PASSAR = ['passar', 'passo', 'passou', 'passando', 'passa', 'passei', 'passam'];
  var BATER = ['bater', 'bato', 'bateu', 'batendo', 'bate', 'bati', 'batem'];
  var MANDAR = ['mandar', 'mando', 'mandou', 'mandando', 'manda', 'mandei', 'mandam'];
  var TOCAR = ['tocar', 'toco', 'tocou', 'tocando', 'toca', 'toquei', 'tocam'];
  var FICAR = ['ficar', 'fico', 'ficou', 'ficando', 'fica', 'fique', 'fiquei', 'ficam'];
  var SOLTAR = ['soltar', 'solto', 'soltou', 'soltando', 'solta', 'soltei'];
  var REBOLAR = ['rebolar', 'rebola', 'rebolou', 'rebolando', 'rebolei'];
  var CAVALGAR = ['cavalgar', 'cavalga', 'cavalgou', 'cavalgando', 'cavalgo', 'cavalguei'];
  var PUXAR = ['puxar', 'puxo', 'puxou', 'puxando', 'puxa', 'puxei'];
  var TOMAR = ['tomar', 'tomo', 'tomou', 'tomando', 'toma', 'tomei', 'tome'];
  var ENGOLIR = ['engolir', 'engulo', 'engoliu', 'engolindo', 'engole', 'engoli'];
  var QUEBRAR = ['quebrar', 'quebro', 'quebrou', 'quebrando', 'quebra', 'quebrei'];
  var ARMAR = ['armar', 'armo', 'armou', 'armando', 'arma', 'armei'];
  var MONTAR = ['montar', 'monto', 'montou', 'montando', 'monta', 'montei'];
  var DEITAR = ['deitar', 'deito', 'deitou', 'deitando', 'deita', 'deitei'];
  var ENTRAR = ['entrar', 'entro', 'entrou', 'entrando', 'entra', 'entre'];
  var ENCHER = ['encher', 'encho', 'encheu', 'enchendo', 'enche'];
  var DESCASCAR = ['descascar', 'descasco', 'descascou', 'descascando', 'descasca'];
  var ESTOURAR = ['estourar', 'estouro', 'estourou', 'estourando', 'estoura', 'estourei'];
  var FAZER = ['fazer', 'faco', 'fez', 'fazendo', 'faz', 'fiz', 'fazemos'];
  var IR = ['ir', 'vou', 'vai', 'vamos', 'foi', 'fui', 'levar', 'levo', 'levou', 'leva', 'levando'];
  var CHEGAR = ['chegar', 'chego', 'chegou', 'chegando', 'chega', 'chegue'];
  var LIGAR = ['ligar', 'ligo', 'ligou', 'ligando', 'liga'];
  var ESQUENTAR = ['esquentar', 'esquenta', 'esquentou', 'esquentando'];
  var SOPRAR = ['soprar', 'sopro', 'soprou', 'soprando', 'sopra', 'soprei'];
  var FURAR = ['furar', 'furo', 'furou', 'furando', 'fura', 'furei'];
  var ENFIAR_PE = ENFIAR.concat(['por', 'pos', 'poe', 'meter', 'meteu', 'mete', 'meto', 'botar', 'bota', 'botou', 'boto']);
  var APERTAR = ['apertar', 'aperto', 'apertou', 'apertando', 'aperta', 'apertei', 'apertam'];
  var DEIXAR = ['deixar', 'deixo', 'deixou', 'deixando', 'deixa', 'deixei'];
  var LEVAR = ['levar', 'levo', 'levou', 'levando', 'leva', 'levei', 'levam'];
  var JOGAR = ['jogar', 'jogo', 'jogou', 'jogando', 'joga', 'joguei'];
  var CHUTAR = ['chutar', 'chuto', 'chutou', 'chutando', 'chuta', 'chutei'];
  var PISAR = ['pisar', 'piso', 'pisou', 'pisando', 'pisa', 'pisei'];
  var TROCAR = ['trocar', 'troco', 'trocou', 'trocando', 'troca', 'troquei'];
  var ENGATAR = ['engatar', 'engato', 'engatou', 'engatando', 'engata', 'engatei'];
  var MORDER = ['morder', 'morde', 'mordeu', 'mordendo', 'mordi', 'mordem'];
  var UNTAR = ['untar', 'unto', 'untou', 'untando', 'unta', 'untei'];
  var RASPAR = ['raspar', 'raspo', 'raspou', 'raspando', 'raspa', 'raspei'];
  var ENTRARV = ['entrar', 'entro', 'entrou', 'entrando', 'entra'];
  var ENTERRAR = ['enterrar', 'enterro', 'enterrou', 'enterrando', 'enterra', 'enterrei'];
  var ARREGACAR = ['arregacar', 'arregaco', 'arregacou', 'arregacando', 'arregaca', 'arreguei'];
  var MERGULHAR = ['mergulhar', 'mergulho', 'mergulhou', 'mergulhando', 'mergulha', 'mergulhei'];
  var CAIR = ['cair', 'caio', 'caiu', 'caindo', 'cai'];
  var FECHAR = ['fechar', 'fecho', 'fechou', 'fechando', 'fecha', 'fechei'];
  var LAVAR = ['lavar', 'lavo', 'lavou', 'lavando', 'lava', 'lavei'];

  /* ---------------------------------------------------------------
   * Palavras soltas - leves (< 1.5)
   * ------------------------------------------------------------- */
  w('dar', 'dar', 1.2, ['dar', 'dou', 'deu', 'dando', 'dei', 'dava', 'daria', 'darei']);
  w('ovo', 'ovo', 0.6, ['ovo', 'ovos']);
  w('bater', 'bater', 0.6, BATER);
  w('pegar', 'pegar', 0.6, PEGAR);
  w('mexer', 'mexer', 0.7, ['mexer', 'mexe', 'mexeu', 'mexendo', 'mexida', 'mexidinha', 'mexo']);
  w('cama', 'cama', 0.7, ['cama', 'camas', 'colchao', 'colchoes', 'lencol', 'lencois', 'travesseiro', 'travesseiros']);
  w('banho', 'banho', 0.6, ['banho', 'banhos', 'banhar', 'banhando']);
  w('beijo', 'beijo', 0.7, ['beijo', 'beijos', 'beijar', 'beija', 'beijou', 'beijando', 'beijei', 'beijinho', 'beijoca', 'beijao']);
  w('lingua', 'língua', 0.5, ['lingua', 'linguas', 'linguinha']);
  w('boca', 'boca', 0.9, ['boca', 'bocas', 'boquinha']);
  w('dedo', 'dedo', 0.8, ['dedo', 'dedos', 'dedinho', 'dedinhos']);
  w('peito', 'peito', 1.0, ['peito', 'peitinho', 'peitao', 'peitoral']);
  w('coxa', 'coxa', 1.2, ['coxa', 'coxas', 'coxinha', 'coxinhas', 'coxona', 'coxudo']);
  w('macio', 'macio', 0.8, ['macio', 'macia', 'macios', 'macias', 'macinho', 'macinha']);
  w('duro', 'duro', 0.9, ['duro', 'dura', 'duros', 'duras', 'durinho', 'durinha', 'durao', 'durona']);
  w('rigido', 'rígido', 1.0, ['rigido', 'rigida', 'rigidos', 'rigidez']);
  w('quente', 'quente', 0.8, ['quente', 'quentes', 'quentinho', 'quentinha']);
  w('delicioso', 'delicioso', 0.8, ['delicioso', 'deliciosa', 'deliciosos', 'deliciosas']);
  w('gostoso', 'gostoso', 1.2, ['gostoso', 'gostosa', 'gostosos', 'gostosas'], ['gostos']);
  w('comprido', 'comprido', 1.2, ['comprido', 'comprida', 'compridos', 'compridas', 'comprimento']);
  w('devagarinho', 'devagarinho', 1.2, ['devagarinho', 'devagarzinho']);
  w('esquentar', 'esquentar', 1.0, ESQUENTAR.concat(['esquentada', 'esquentadinha']));
  w('martelo', 'martelo', 0.9, ['martelo', 'martelar', 'martelou', 'martelando', 'martelada']);
  w('parafuso', 'parafuso', 1.2, ['parafuso', 'parafusos', 'parafusar', 'parafusando', 'parafusou']);
  w('tomada', 'tomada', 1.2, ['tomada', 'tomadas', 'plugue', 'plugues', 'plugar', 'plugando', 'plugado']);
  w('tunel', 'túnel', 1.2, ['tunel', 'tuneis']);
  w('chuveiro', 'chuveiro', 1.2, ['chuveiro', 'chuveiros', 'ducha', 'duchas']);
  w('sauna', 'sauna', 1.0, ['sauna', 'saunas']);
  w('sensual', 'sensual', 1.2, ['sensual', 'sensuais', 'sensualidade']);
  w('sedutor', 'sedutor', 1.2, ['sedutor', 'sedutora', 'sedutores', 'seducao', 'seduzir', 'seduz', 'seduziu']);
  w('ousado', 'ousado', 0.9, ['ousado', 'ousada', 'ousadia']);
  w('malicia', 'malícia', 1.0, ['malicia', 'malicioso', 'maliciosa', 'maliciosos', 'maldade', 'maldades']);
  w('proibido', 'proibido', 0.8, ['proibido', 'proibida', 'proibidao']);
  w('sarado', 'sarado', 1.0, ['sarado', 'sarada', 'saradao', 'saradona', 'saradinho', 'saradinha']);
  w('malhar', 'malhar', 0.8, ['malhar', 'malha', 'malhou', 'malhando', 'malhacao']);
  w('voltinha', 'voltinha', 1.2, ['voltinha', 'voltinhas']);
  w('passada', 'passada', 1.2, ['passada', 'passadas', 'passadinha', 'passadinhas']);
  w('cabeludo', 'cabeludo', 1.0, ['cabeludo', 'cabeluda', 'cabeludos', 'cabeludas', 'cabeludinho']);
  w('oral', 'oral', 1.0, ['oral', 'orais']);
  w('arrepio', 'arrepio', 1.2, ['arrepio', 'arrepios', 'arrepiar', 'arrepiado', 'arrepiada', 'arrepiante']);
  w('suado', 'suado', 1.2, ['suado', 'suada', 'suados', 'suadas', 'suadinho', 'suadinha']);
  w('galinha', 'galinha', 1.0, ['galinha', 'galinhas', 'galinhagem']);
  w('puxar', 'puxar', 1.0, PUXAR.concat(['puxada', 'puxao']));
  w('explodir', 'explodir', 1.0, ['explodir', 'explode', 'explodiu', 'explodindo', 'explosao']);
  w('depilar', 'depilar', 1.0, ['depilar', 'depila', 'depilou', 'depilando', 'depilacao', 'depilada', 'depilado']);
  w('babar', 'babar', 1.0, ['babar', 'baba', 'babou', 'babando', 'babado', 'babada']);
  w('chantilly', 'chantilly', 1.2, ['chantilly', 'chantili', 'maionese']);
  w('sacudir', 'sacudir', 1.2, ['sacudir', 'sacode', 'sacudiu', 'sacudindo', 'sacudida']);
  w('picole', 'picolé', 1.4, ['picole', 'picoles']);
  w('melancia', 'melancia', 1.2, ['melancia', 'melancias', 'melao', 'meloes', 'mamao', 'mamoes']);
  w('jaca', 'jaca', 1.4, ['jaca', 'jacas']);
  w('ameixa', 'ameixa', 1.4, ['ameixa', 'ameixas', 'pessego', 'pessegos', 'cereja', 'cerejas']);
  w('biquini', 'biquíni', 1.2, ['biquini', 'biquinis', 'bikini', 'sunga', 'sungas']);
  w('cueca', 'cueca', 1.4, ['cueca', 'cuecas', 'cuecao']);
  w('sutia', 'sutiã', 1.4, ['sutia', 'sutias']);
  w('lingerie', 'lingerie', 1.4, ['lingerie', 'lingeries']);
  w('pistola', 'pistola', 1.4, ['pistola', 'pistolas', 'espingarda', 'espingardas', 'revolver', 'revolveres', 'metralhadora']);
  w('gatilho', 'gatilho', 1.4, ['gatilho', 'gatilhos']);
  w('foguete', 'foguete', 1.4, ['foguete', 'foguetes', 'missil', 'misseis']);
  w('mastro', 'mastro', 1.4, ['mastro', 'mastros', 'obelisco']);
  w('alavanca', 'alavanca', 1.4, ['alavanca', 'alavancas', 'alavancar', 'alavancando']);
  w('furadeira', 'furadeira', 1.4, ['furadeira', 'furadeiras', 'broca', 'brocas', 'parafusadeira']);
  w('recheio', 'recheio', 1.4, ['recheio', 'recheado', 'recheada', 'rechear', 'recheando']);
  w('esticar', 'esticar', 1.4, ['esticar', 'estica', 'esticou', 'esticando', 'esticada', 'esticadinha']);
  w('inchar', 'inchar', 1.4, ['inchar', 'incha', 'inchou', 'inchando', 'inchado', 'inchada']);
  w('morder', 'morder', 1.4, ['morder', 'morde', 'mordeu', 'mordendo', 'mordida', 'mordidinha']);
  w('espremer', 'espremer', 1.4, ['espremer', 'espreme', 'espremeu', 'espremendo']);
  w('vibrar', 'vibrar', 1.4, ['vibrar', 'vibra', 'vibrou', 'vibrando', 'vibracao', 'vibracoes']);
  w('pulsar', 'pulsar', 1.4, ['pulsar', 'pulsa', 'pulsou', 'pulsando', 'pulsante']);
  w('ofegar', 'ofegar', 1.4, ['ofegar', 'ofega', 'ofegou', 'ofegando', 'ofegante', 'arfar', 'arfando']);
  w('traicao', 'traição', 1.2, ['traicao', 'trair', 'traiu', 'traindo', 'traidor', 'traidora']);
  w('paquera', 'paquera', 1.2, ['paquera', 'paqueras', 'paquerar', 'paquerando', 'paquerou']);
  w('atrevido', 'atrevido', 1.0, ['atrevido', 'atrevida', 'atrevidos', 'atrevidas', 'atrevimento']);

  /* ---------------------------------------------------------------
   * Palavras soltas - comuns (1.5 a 2.4)
   * ------------------------------------------------------------- */
  w('comer', 'comer', 1.6, COMER);
  w('sentar', 'sentar', 1.5, SENTAR.concat(['sentada', 'sentadinha']));
  w('apertar', 'apertar', 1.5, ['apertar', 'aperta', 'apertou', 'apertando', 'apertei', 'aperto']);
  w('socar', 'socar', 1.5, ['socar', 'soca', 'socou', 'socando', 'socada', 'socadinha']);
  w('soprar', 'soprar', 1.8, SOPRAR.concat(['soprada', 'sopro']));
  w('meter', 'meter', 2.0, METER.concat(['metida', 'metidinha']));
  w('enfiar', 'enfiar', 2.2, ENFIAR.concat(['enfiada']));
  w('engolir', 'engolir', 2.2, ENGOLIR.concat(['engolida']));
  w('lamber', 'lamber', 2.0, LAMBER.concat(['lambida', 'lambidas', 'lambidinha']));
  w('cavalgar', 'cavalgar', 2.2, CAVALGAR.concat(['cavalgada']));
  w('esfregar', 'esfregar', 2.0, ESFREGAR.concat(['esfregada', 'esfregao']));
  w('apalpar', 'apalpar', 2.0, ['apalpar', 'apalpa', 'apalpou', 'apalpando', 'apalpada', 'apalpadinha']);
  w('mamar', 'mamar', 2.2, MAMAR.concat(['mamada', 'mamadas']));
  w('rebolar', 'rebolar', 2.2, REBOLAR.concat(['rebolada', 'rebolado', 'reboladinha']), ['rebol']);
  w('latejar', 'latejar', 2.0, ['latejar', 'lateja', 'latejou', 'latejando', 'latejante']);
  w('molhar', 'molhar', 1.5, ['molhar', 'molha', 'molhou', 'molhando', 'molhei']);
  w('molhado', 'molhado', 1.6, ['molhado', 'molhada', 'molhados', 'molhadas', 'molhadinho', 'molhadinha', 'encharcado', 'encharcada', 'ensopado', 'ensopada']);
  w('apertado', 'apertado', 1.6, ['apertado', 'apertada', 'apertados', 'apertadas', 'apertadinho', 'apertadinha']);
  w('grosso', 'grosso', 1.5, ['grosso', 'grossa', 'grossos', 'grossas', 'grossao', 'grossura']);
  w('endurecer', 'endurecer', 2.0, ['endurecer', 'endurece', 'endureceu', 'endurecendo', 'enrijecer', 'enrijece', 'enrijeceu', 'enrijecendo']);
  w('ereto', 'ereto', 2.2, ['ereto', 'ereta', 'eretos', 'eretas', 'erecao', 'erecoes']);
  w('safado', 'safado', 2.0, ['safado', 'safada'], ['safad']);
  w('delicia', 'delícia', 1.5, ['delicia', 'delicias']);
  w('pelado', 'pelado', 1.5, ['pelado', 'pelada', 'pelados', 'peladas', 'peladao', 'peladona', 'nu', 'nua', 'nus', 'nuas']);
  w('nudes', 'nudes', 2.0, ['nude', 'nudes', 'nudez']);
  w('virgem', 'virgem', 1.5, ['virgem', 'virgens', 'virgindade', 'cabaco']);
  w('calcinha', 'calcinha', 1.8, ['calcinha', 'calcinhas', 'calcola']);
  w('tanga', 'tanga', 1.8, ['tanga', 'tangas']);
  w('camisinha', 'camisinha', 2.0, ['camisinha', 'camisinhas', 'preservativo', 'preservativos', 'camisa de venus']);
  w('motel', 'motel', 2.0, ['motel', 'moteis']);
  w('algemas', 'algemas', 1.8, ['algema', 'algemas', 'algemar', 'algemado', 'algemada']);
  w('chicote', 'chicote', 1.8, ['chicote', 'chicotes', 'chicotada', 'chibata', 'chibatada']);
  w('tapa', 'tapa', 1.5, ['tapa', 'tapas', 'tapinha', 'tapinhas', 'palmada', 'palmadas']);
  w('massagem', 'massagem', 1.5, ['massagem', 'massagens', 'massagista', 'massagear', 'massageia', 'massageando']);
  w('amassar', 'amassar', 1.8, ['amassar', 'amassa', 'amassou', 'amassando', 'amasso', 'amassos', 'amassada']);
  w('beliscar', 'beliscar', 1.8, ['beliscar', 'belisca', 'beliscou', 'beliscando', 'beliscao', 'beliscada']);
  w('arranhar', 'arranhar', 1.5, ['arranhar', 'arranha', 'arranhou', 'arranhando', 'arranhao', 'arranhoes']);
  w('bunda', 'bunda', 2.0, ['bunda', 'bundas', 'bundao', 'bundinha', 'bundona', 'bumbum', 'bumbuns', 'bumbunzinho']);
  w('tetas', 'tetas', 2.0, ['teta', 'tetas', 'tetinha', 'tetao', 'tetona']);
  w('peitos', 'peitos', 1.8, ['peitos', 'peitoes']);
  w('seios', 'seios', 1.5, ['seio', 'seios', 'mamilo', 'mamilos']);
  w('rabo', 'rabo', 2.0, ['rabo', 'rabos', 'rabao', 'rabinho', 'rabudo', 'rabuda']);
  w('rosca', 'rosca', 2.0, ['rosca', 'roscas', 'rosquinha', 'rosquinhas']);
  w('vara', 'vara', 1.8, ['vara', 'varas', 'varao', 'varinha', 'varinhas']);
  w('mangueira', 'mangueira', 1.8, ['mangueira', 'mangueiras']);
  w('pirulito', 'pirulito', 2.0, ['pirulito', 'pirulitos'], ['pirul']);
  w('saco', 'saco', 1.5, ['saco', 'sacos']);
  w('bagos', 'bagos', 2.0, ['bago', 'bagos', 'testiculo', 'testiculos']);
  w('escroto', 'escroto', 1.8, ['escroto', 'escrota', 'escrotos', 'escrotas']);
  w('virilha', 'virilha', 1.8, ['virilha', 'virilhas']);
  w('rego', 'rego', 2.0, ['rego', 'regos']);
  w('traseiro', 'traseiro', 1.8, ['traseiro', 'traseiros', 'popozuda', 'popozudas', 'popozao']);
  w('perereca', 'perereca', 2.2, ['perereca', 'pererecas', 'pererequinha', 'xereca', 'xerecas', 'prexeca', 'ppk']);
  w('periquita', 'periquita', 2.0, ['periquita', 'periquitas', 'periquitinha']);
  w('racha', 'racha', 1.5, ['racha', 'rachas']);
  w('bilau', 'bilau', 2.0, ['bilau', 'bilaus', 'bilauzinho']);
  w('passarinho', 'passarinho', 1.8, ['passarinho', 'passarinhos', 'passarinha']);
  w('buraco', 'buraco', 1.8, ['buraco', 'buracos', 'buraquinho', 'buraquinhos']);
  w('fenda', 'fenda', 1.5, ['fenda', 'fendas', 'gruta', 'grutas']);
  w('salsicha', 'salsicha', 2.0, ['salsicha', 'salsichas', 'salsichao']);
  w('pepino', 'pepino', 2.0, ['pepino', 'pepinos', 'pepininho']);
  w('banana', 'banana', 1.8, ['banana', 'bananas', 'bananao', 'bananinha']);
  w('mandioca', 'mandioca', 2.0, ['mandioca', 'mandiocas', 'macaxeira', 'aipim']);
  w('linguica', 'linguiça', 2.4, ['linguica', 'linguicas', 'linguicao', 'linguicinha']);
  w('cabecinha', 'cabecinha', 1.8, ['cabecinha', 'cabecinhas']);
  w('ejacular', 'ejacular', 2.4, ['ejacular', 'ejacula', 'ejaculou', 'ejaculando'], ['ejacul']);
  w('orgasmo', 'orgasmo', 2.4, ['orgasmo', 'orgasmos'], ['orgasm']);
  w('masturbar', 'masturbar', 2.2, ['masturbar'], ['masturb']);
  w('sexo', 'sexo', 2.0, ['sexo', 'sexos', 'sexual', 'sexuais', 'sexualidade', 'sexy']);
  w('sacanagem', 'sacanagem', 2.0, ['sacanagem', 'sacanagens', 'sacana', 'sacanas', 'sacanear', 'sacaneando', 'sacaneou']);
  w('indecente', 'indecente', 1.8, ['indecente', 'indecentes', 'indecencia']);
  w('pecado', 'pecado', 1.5, ['pecado', 'pecados', 'pecar', 'pecaminoso', 'pecaminosa']);
  w('fogosa', 'fogosa', 2.0, ['fogoso', 'fogosa', 'fogosos', 'fogosas']);
  w('provocante', 'provocante', 1.5, ['provocante', 'provocantes', 'provocador', 'provocadora']);
  w('erotico', 'erótico', 1.8, ['erotico', 'erotica'], ['eroti']);
  w('tarado', 'tarado', 2.0, ['tarado', 'tarada', 'tarados', 'taradas', 'taradao', 'taradinho']);
  w('pervertido', 'pervertido', 2.0, ['pervertido', 'pervertida', 'pervertidos', 'pervertidas']);
  w('vadia', 'vadia', 2.0, ['vadia', 'vadias', 'vagabunda', 'vagabundas']);
  w('piranha', 'piranha', 1.8, ['piranha', 'piranhas']);
  w('pegador', 'pegador', 1.8, ['pegador', 'pegadora', 'pegadores', 'pegadoras']);
  w('ficante', 'ficante', 1.5, ['ficante', 'ficantes']);
  w('peguete', 'peguete', 2.0, ['peguete', 'peguetes']);
  w('casinho', 'casinho', 2.0, ['casinho', 'casinhos']);
  w('amante', 'amante', 2.0, ['amante', 'amantes']);
  w('corno', 'corno', 2.2, ['corno', 'corna', 'cornos', 'cornas', 'cornudo', 'cornudos', 'cornuda', 'chifrudo', 'chifrudos']);
  w('chifre', 'chifre', 2.0, ['chifre', 'chifres', 'chifrar', 'chifrou', 'chifrando']);
  w('azaracao', 'azaração', 1.5, ['azaracao', 'azarar', 'azara', 'azarou', 'azarando', 'azarador', 'azaradora']);
  w('cantada', 'cantada', 1.5, ['cantada', 'cantadas']);
  w('xaveco', 'xaveco', 1.5, ['xaveco', 'xavecar', 'xavecando', 'xavecou']);
  w('investida', 'investida', 1.5, ['investida', 'investidas']);
  w('lambuzado', 'lambuzado', 2.0, ['lambuzado', 'lambuzada', 'lambuzar', 'lambuzou', 'lambuzando']);
  w('melado', 'melado', 1.5, ['melado', 'melada', 'melar', 'melou', 'melando']);
  w('cremoso', 'cremoso', 1.8, ['cremoso', 'cremosa', 'cremosinha', 'cremosos']);
  w('gemer', 'gemer', 1.8, ['gemer', 'geme', 'gemeu', 'gemendo', 'gemido', 'gemidos', 'gemidao']);
  w('escorrer', 'escorrer', 1.5, ['escorrer', 'escorre', 'escorreu', 'escorrendo']);
  w('escorregar', 'escorregar', 1.5, ['escorregar', 'escorrega', 'escorregou', 'escorregando', 'escorregada']);
  w('esguichar', 'esguichar', 2.4, ['esguichar', 'esguicho'], ['esguich']);
  w('jorrar', 'jorrar', 2.4, ['jorrar', 'jorra', 'jorrou', 'jorrando', 'jorro', 'jorros']);
  w('jato', 'jato', 1.8, ['jato', 'jatos']);
  w('torpedo', 'torpedo', 1.8, ['torpedo', 'torpedos']);
  w('desentupir', 'desentupir', 2.4, ['desentupir', 'desentupo', 'desentupiu', 'desentupindo', 'desentupidor']);
  w('ordenhar', 'ordenhar', 2.0, ['ordenhar', 'ordenha', 'ordenhou', 'ordenhando']);
  w('empinar', 'empinar', 2.0, ['empinar', 'empina', 'empinou', 'empinando', 'empinada', 'empinadinha']);
  w('arrebitar', 'arrebitar', 2.0, ['arrebitar', 'arrebita', 'arrebitou', 'arrebitada', 'arrebitadinha', 'arrebitado']);
  w('remexer', 'remexer', 1.5, ['remexer', 'remexe', 'remexeu', 'remexendo', 'remexida']);
  w('dotado', 'dotado', 2.0, ['dotado', 'dotada', 'dotados', 'dotadas', 'dotadao']);
  w('flauta', 'flauta', 1.8, ['flauta', 'flautas', 'flautim']);
  w('trombone', 'trombone', 1.8, ['trombone', 'trombones']);
  w('gaita', 'gaita', 1.5, ['gaita', 'gaitas']);
  w('corneta', 'corneta', 1.5, ['corneta', 'cornetas']);
  w('eletricista', 'eletricista', 1.5, ['eletricista', 'eletricistas']);
  w('bombeiro', 'bombeiro', 1.5, ['bombeiro', 'bombeiros']);
  w('dedada', 'dedada', 2.0, ['dedada', 'dedadas', 'dedar', 'dedando']);
  w('ajoelhar', 'ajoelhar', 1.5, ['ajoelhar', 'ajoelha', 'ajoelhou', 'ajoelhando']);
  w('pegacao', 'pegação', 2.0, ['pegacao', 'pegacoes']);

  /* ---------------------------------------------------------------
   * Palavras soltas - pesadas (2.5 a 3.4)
   * ------------------------------------------------------------- */
  w('pau', 'pau', 2.5, ['pau', 'paus', 'pauzao', 'pauzinho', 'pauzudo', 'pauzudos']);
  w('rola', 'rola', 2.5, ['rola', 'rolas', 'rolinha', 'rolao', 'rolona']);
  w('pinto', 'pinto', 2.5, ['pinto', 'pintos', 'pintao', 'pintinho', 'pintudo']);
  w('pica', 'pica', 2.5, ['pica', 'picas', 'picao']);
  w('cacete', 'cacete', 2.5, ['cacete', 'cacetes', 'caceta', 'cacetada', 'cacetadas', 'cacetinho']);
  w('caralho', 'caralho', 2.5, ['caralho', 'caralhos'], ['caralh']);
  w('piroca', 'piroca', 3.0, ['piroca', 'pirocas', 'pirocao', 'pirocudo'], ['piroc']);
  w('bimba', 'bimba', 3.0, ['bimba', 'bimbas', 'bimbada', 'bimbadas', 'bimbar', 'bimbando', 'bimbou']);
  w('cu', 'cu', 2.5, ['cu', 'cus', 'cuzinho', 'cuzao']);
  w('buceta', 'buceta', 3.0, ['buceta', 'bucetas', 'bucetinha'], ['bucet']);
  w('xoxota', 'xoxota', 3.0, ['xoxota', 'xoxotas', 'xoxotinha'], ['xoxot']);
  w('porra', 'porra', 2.5, ['porra', 'porras', 'porrada', 'porradas']);
  w('foder', 'foder', 2.8, ['foder', 'fode', 'fodo', 'fodeu', 'fodendo', 'fodemos', 'fodam', 'foda', 'fodas', 'fodido', 'fodida', 'fodi']);
  w('trepar', 'trepar', 2.8, ['trepar', 'trepa', 'trepou', 'trepando', 'trepei', 'trepada', 'trepadinha']);
  w('transar', 'transar', 2.5, ['transar', 'transa', 'transou', 'transando', 'transei', 'transada', 'transamos', 'transam']);
  w('gozar', 'gozar', 3.0, ['gozar', 'gozo', 'gozou', 'gozando', 'gozada', 'gozadinha', 'gozei', 'gozaram', 'gozamos', 'gozado']);
  w('penetrar', 'penetrar', 3.0, ['penetrar', 'penetrou', 'penetrando', 'penetracao'], ['penetr']);
  w('esporrar', 'esporrar', 3.2, ['esporrar', 'esporra', 'esporrou', 'esporrando', 'esporrada']);
  w('punheta', 'punheta', 3.0, ['punheta', 'punhetas', 'punheteiro', 'punhetao', 'punhetar', 'punhetando'], ['punhet']);
  w('siririca', 'siririca', 3.0, ['siririca', 'siriricas', 'siriricar', 'siriricando'], ['siriric']);
  w('bronha', 'bronha', 3.0, ['bronha', 'bronhas']);
  w('boquete', 'boquete', 3.0, ['boquete', 'boquetes', 'boqueteira', 'boquetao']);
  w('chupar', 'chupar', 2.5, ['chupar', 'chupa', 'chupou', 'chupando', 'chupada', 'chupadinha'], ['chup']);
  w('tesao', 'tesão', 2.5, ['tesao', 'tesoes'], ['tesud']);
  w('colhoes', 'colhões', 2.5, ['colhao', 'colhoes']);
  w('glande', 'glande', 2.5, ['glande', 'glandes']);
  w('puta', 'puta', 2.5, ['puta', 'putas', 'putinha', 'putona']);
  w('putaria', 'putaria', 3.0, ['putaria', 'putarias']);
  w('puteiro', 'puteiro', 3.0, ['puteiro', 'puteiros']);
  w('bordel', 'bordel', 2.5, ['bordel', 'bordeis']);
  w('suruba', 'suruba', 3.0, ['suruba', 'surubas', 'surubao']);
  w('orgia', 'orgia', 3.0, ['orgia', 'orgias']);
  w('bacanal', 'bacanal', 2.5, ['bacanal', 'bacanais']);
  w('striptease', 'striptease', 2.5, ['striptease', 'stripper']);
  w('rapidinha', 'rapidinha', 3.0, ['rapidinha', 'rapidinhas']);
  w('encanador', 'encanador', 3.0, ['encanador', 'encanadores']);
  w('porno', 'pornô', 2.5, ['porno', 'pornos', 'porn', 'pornografia', 'pornografico', 'pornografica', 'pornozao', 'pornochanchada', 'xvideos', 'pornhub']);
  w('viagra', 'viagra', 3.0, ['viagra']);
  w('onlyfans', 'onlyfans', 2.5, ['onlyfans']);
  w('vibrador', 'vibrador', 2.5, ['vibrador', 'vibradores', 'consolo', 'consolos']);
  w('lubrificante', 'lubrificante', 2.2, ['lubrificante', 'lubrificantes', 'lubrificar', 'lubrificado']);
  w('fdp', 'fdp', 2.5, ['fdp']);
  w('tesourinha', 'tesourinha', 3.0, ['tesourinha']);
  w('sessenta-e-nove', '69', 3.5, ['69', 'sessenta e nove']);

  /* ---------------------------------------------------------------
   * Expressões com "dar"
   * ------------------------------------------------------------- */
  p('dar-uma', 'dar uma', 3.0, x(DAR, ['uma']));
  p('dar-uma-passada', 'dar uma passada', 4.0, x(DAR, ['uma passada', 'uma passadinha']));
  p('dar-uma-chegada', 'dar uma chegada', 4.0, x(DAR, ['uma chegada', 'uma chegadinha']));
  p('dar-uma-voltinha', 'dar uma voltinha', 3.8, x(DAR, ['uma volta', 'uma voltinha']));
  p('dar-uma-olhada', 'dar uma olhada', 3.5, x(DAR, ['uma olhada', 'uma olhadinha', 'uma espiada', 'uma espiadinha']));
  p('dar-uma-mexida', 'dar uma mexida', 3.8, x(DAR, ['uma mexida', 'uma mexidinha']));
  p('dar-uma-esticada', 'dar uma esticada', 3.8, x(DAR, ['uma esticada', 'uma esticadinha']));
  p('dar-uma-geral', 'dar uma geral', 4.0, x(DAR, ['uma geral']));
  p('dar-uma-ajeitada', 'dar uma ajeitada', 3.8, x(DAR, ['uma ajeitada', 'uma ajeitadinha', 'uma arrumada']));
  p('dar-uma-checada', 'dar uma checada', 3.5, x(DAR, ['uma checada', 'uma conferida', 'uma conferidinha']));
  p('dar-uma-pegada', 'dar uma pegada', 3.8, x(DAR, ['uma pegada', 'uma pegadinha']));
  p('dar-uma-rapidinha', 'dar uma rapidinha', 4.5, x(DAR, ['uma rapidinha']));
  p('dar-uma-transada', 'dar uma transada', 4.5, x(DAR, ['uma transada', 'uma trepada', 'uma bimbada', 'uma gozada', 'uma sentada', 'uma chupada', 'uma chupadinha', 'uma mamada', 'uma lambida']));
  p('dar-um-jeito', 'dar um jeito', 3.5, x(DAR, ['um jeito', 'um jeitinho', 'um trato']));
  p('dar-um-tapa', 'dar um tapa', 3.8, x(DAR, ['um tapa', 'um tapinha', 'uma palmada', 'uma palmadinha', 'um beliscao']));
  p('dar-um-amasso', 'dar um amasso', 4.0, x(DAR, ['um amasso', 'uns amassos']));
  p('dar-um-beijo', 'dar um beijo', 2.8, x(DAR, ['um beijo', 'um beijinho', 'um selinho', 'uma beijoca']));
  p('dar-mole', 'dar mole', 2.5, x(DAR, ['mole', 'moleza']));
  p('dar-bola', 'dar bola', 2.5, x(DAR, ['bola', 'bolas']));
  p('dar-em-cima', 'dar em cima', 3.0, x(DAR, ['em cima']));
  p('dar-pra', 'dar pra', 2.5, x(DAR, ['pra', 'pro', 'para']));
  p('dar-pra-ele', 'dar pra ele', 4.0, x(DAR, ['pra ele', 'pro ele', 'pra ela', 'para ele', 'para ela']));
  p('dar-duro', 'dar duro', 3.5, x(DAR, ['duro', 'um duro']));
  p('dar-o-cu', 'dar o cu', 4.5, x(DAR, ['o cu', 'o rabo', 'a bunda', 'o bumbum', 'a rosca', 'a bundinha', 'o cuzinho']));
  p('dar-a-volta-por-cima', 'dar a volta por cima', 3.5, x(DAR, ['a volta por cima']));

  /* ---------------------------------------------------------------
   * Expressões com "comer", "chupar", "mamar", "lamber", "engolir"
   * ------------------------------------------------------------- */
  p('comer-tudo', 'comer tudo', 3.0, x(COMER, ['tudo']));
  p('comer-calado', 'comer calado', 3.5, x(COMER, ['calado', 'calada', 'quieto', 'quietinho']));
  p('comer-cru', 'comer cru', 3.0, x(COMER, ['cru', 'crua']));
  p('comer-pelas-beiradas', 'comer pelas beiradas', 3.2, x(COMER, ['pelas beiradas', 'pelas bordas']));
  p('comer-na-mao', 'comer na mão', 3.5, x(COMER, ['na mao']));
  p('comer-com-os-olhos', 'comer com os olhos', 3.0, x(COMER, ['com os olhos']));
  p('comer-mosca', 'comer mosca', 2.8, x(COMER, ['mosca']));
  p('comer-ate-fartar', 'comer até fartar', 3.5, x(COMER, ['ate fartar', 'ate cansar', 'ate enjoar']));
  p('comer-a-sobremesa', 'comer a sobremesa', 3.2, x(COMER, ['a sobremesa', 'sobremesa']));
  p('comer-o-pao-que-o-diabo-amassou', 'comer o pão que o diabo amassou', 4.5, x(COMER, ['o pao que o diabo amassou']));
  p('chupa-essa-manga', 'chupa essa manga', 4.5, ['chupa essa manga', 'chupe essa manga', 'chupa essa', 'chupa que e de uva']);
  p('chupar-tudo', 'chupar tudo', 3.8, x(CHUPAR, ['tudo', 'ate o fim', 'ate o final', 'ate o osso']));
  p('chupar-um', 'chupar um', 3.0, x(CHUPAR, ['um', 'uma', 'um picole', 'um pirulito', 'uma manga', 'uma laranja', 'um sorvete']));
  p('mamar-na-teta', 'mamar na teta', 3.5, x(MAMAR, ['na teta', 'no peito', 'na vaca', 'nas tetas']));
  p('mamar-tudo', 'mamar tudo', 3.5, x(MAMAR, ['tudo', 'ate o fim', 'ate a ultima gota']));
  p('lamber-tudo', 'lamber tudo', 3.5, x(LAMBER, ['tudo', 'os labios', 'o beicinho', 'a ponta', 'o sorvete', 'o picole', 'o pirulito']));
  p('engolir-tudo', 'engolir tudo', 3.5, x(ENGOLIR, ['tudo', 'sem mastigar', 'inteiro', 'inteira', 'ate o fim']));
  p('engolir-sapo', 'engolir sapo', 3.0, x(ENGOLIR, ['sapo', 'um sapo']));
  p('soprar-a-flauta', 'soprar a flauta', 3.8, x(SOPRAR, ['a flauta', 'a gaita', 'a corneta', 'o trombone', 'o apito', 'o pirulito']));

  /* ---------------------------------------------------------------
   * Expressões com "pau", "meter", "enfiar", "pegar"
   * ------------------------------------------------------------- */
  p('pegar-no-pau', 'pegar no pau', 4.5, x(PEGAR, ['no pau', 'na rola', 'no pinto', 'no cacete', 'na piroca', 'na pica', 'no pauzao', 'no pauzinho']));
  p('pau-da-barraca', 'pau da barraca', 4.5, ['pau da barraca']);
  p('segurar-no-pau-da-barraca', 'segurar no pau da barraca', 5.0, x(SEGURAR, ['no pau da barraca', 'o pau da barraca', 'a barraca']));
  p('barraca-armada', 'barraca armada', 4.0, x(ARMAR.concat(MONTAR), ['a barraca', 'barraca']).concat(['barraca armada', 'barraca montada']));
  p('pau-duro', 'pau duro', 4.0, ['pau duro', 'pau durinho', 'pau de pedra']);
  p('pau-mole', 'pau mole', 3.5, ['pau mole', 'pau molengo', 'pau murcho']);
  p('pau-grosso', 'pau grosso', 3.8, ['pau grosso', 'rola grossa', 'pica grossa', 'pinto grosso', 'piroca grossa', 'cacete grosso']);
  p('pau-na-mao', 'pau na mão', 4.0, ['pau na mao', 'pau na maozinha']);
  p('pau-pra-toda-obra', 'pau pra toda obra', 4.5, ['pau pra toda obra', 'pau para toda obra']);
  p('cara-de-pau', 'cara de pau', 3.2, ['cara de pau', 'caras de pau']);
  p('pau-mandado', 'pau mandado', 3.5, ['pau mandado']);
  p('pau-de-selfie', 'pau de selfie', 3.0, ['pau de selfie']);
  p('pau-de-sebo', 'pau de sebo', 3.5, ['pau de sebo']);
  p('pau-de-arara', 'pau de arara', 3.5, ['pau de arara']);
  p('pau-brasil', 'pau-brasil', 3.0, ['pau brasil']);
  p('pau-a-pau', 'pau a pau', 3.0, ['pau a pau']);
  p('pica-das-galaxias', 'pica das galáxias', 4.8, ['pica das galaxias']);
  p('quebrar-o-pau', 'quebrar o pau', 3.5, x(QUEBRAR, ['o pau']));
  p('meter-o-pau', 'meter o pau', 4.5, x(METER, ['o pau', 'a vara', 'a rola', 'o pinto', 'o cacete', 'a piroca']));
  p('meter-o-dedo', 'meter o dedo', 3.8, x(METER, ['o dedo', 'os dedos', 'dedo']));
  p('meter-a-mao', 'meter a mão', 3.5, x(METER, ['a mao', 'as maos']));
  p('meter-fundo', 'meter fundo', 4.0, x(METER, ['fundo', 'bem fundo', 'com forca', 'ate o fundo']));
  p('meter-bala', 'meter bala', 3.0, x(METER, ['bala', 'ficha', 'marcha']));
  p('meter-lenha', 'meter lenha', 3.5, x(METER, ['lenha', 'brasa']));
  p('meter-o-bedelho', 'meter o bedelho', 3.0, x(METER, ['o bedelho']));
  p('enfiar-o-dedo', 'enfiar o dedo', 3.8, x(ENFIAR, ['o dedo', 'os dedos', 'dedo']));
  p('enfiar-tudo', 'enfiar tudo', 4.0, x(ENFIAR, ['tudo', 'tudo de uma vez', 'fundo', 'ate o fundo']));
  p('enfiar-o-pe-na-jaca', 'enfiar o pé na jaca', 4.2, ['pe na jaca'].concat(x(ENFIAR_PE, ['o pe na jaca'])));
  p('segurar-vela', 'segurar vela', 3.0, x(SEGURAR, ['vela', 'a vela']));
  p('passar-a-mao', 'passar a mão', 3.5, x(PASSAR, ['a mao', 'as maos']));
  p('passar-a-lingua', 'passar a língua', 4.0, x(PASSAR, ['a lingua', 'a linguinha']));
  p('passar-o-rodo', 'passar o rodo', 4.0, x(PASSAR, ['o rodo']));
  p('passar-pano', 'passar pano', 3.0, x(PASSAR, ['pano', 'um pano']));
  p('passar-a-perna', 'passar a perna', 3.0, x(PASSAR, ['a perna']));
  p('esfregar-na-cara', 'esfregar na cara', 3.5, x(ESFREGAR, ['na cara', 'as maos', 'o corpo']));
  p('puxar-o-cabelo', 'puxar o cabelo', 3.5, x(PUXAR, ['o cabelo', 'os cabelos', 'pelo cabelo', 'pelos cabelos']));
  p('puxar-saco', 'puxar saco', 3.0, x(PUXAR, ['saco', 'o saco']));
  p('encher-o-saco', 'encher o saco', 3.0, x(ENCHER, ['o saco', 'saco']));
  p('saco-cheio', 'saco cheio', 3.0, ['saco cheio', 'saco roxo', 'estourar o saco']);
  p('descascar-o-abacaxi', 'descascar o abacaxi', 4.0, x(DESCASCAR, ['o abacaxi', 'abacaxi', 'o pepino', 'a banana', 'o pau']));
  p('estourar-a-cereja', 'estourar a cereja', 4.0, x(ESTOURAR, ['a cereja', 'o cabaco']));
  p('furar-a-fila', 'furar a fila', 3.0, x(FURAR, ['a fila', 'o bloqueio', 'o sinal']));

  /* ---------------------------------------------------------------
   * Posições, lugares e jeitos
   * ------------------------------------------------------------- */
  p('de-quatro', 'de quatro', 4.0, ['de quatro', 'de quatrinho']);
  p('por-tras', 'por trás', 3.5, ['por tras', 'por traz', 'por detras']);
  p('ate-o-talo', 'até o talo', 4.5, ['ate o talo', 'ate o cabo', 'ate as bolas', 'ate o saco', 'ate a raiz', 'ate a base']);
  p('ate-o-fundo', 'até o fundo', 4.0, ['ate o fundo', 'ate o fundao']);
  p('ate-o-fim', 'até o fim', 3.0, ['ate o fim', 'ate o final', 'ate a ultima gota']);
  p('bem-fundo', 'bem fundo', 3.8, ['bem fundo', 'bem fundinho', 'bem la no fundo']);
  p('la-no-fundo', 'lá no fundo', 3.2, ['la no fundo', 'la no fundao', 'la no final', 'la atras', 'la dentro', 'la embaixo', 'la em baixo', 'la debaixo']);
  p('pra-dentro', 'pra dentro', 3.0, ['pra dentro', 'para dentro', 'bem dentro']);
  p('mais-fundo', 'mais fundo', 3.2, ['mais fundo', 'mais forte', 'mais devagar', 'mais gostoso']);
  p('bem-devagarinho', 'bem devagarinho', 3.2, ['bem devagarinho', 'bem devagar', 'bem de leve', 'bem de levinho', 'bem de mansinho']);
  p('sem-do', 'sem dó', 3.5, ['sem do', 'sem piedade', 'sem pena', 'sem pudor', 'sem vergonha', 'sem parar']);
  p('com-jeitinho', 'com jeitinho', 3.2, ['com jeitinho', 'com jeito', 'com vontade', 'com forca', 'com gosto']);
  p('de-uma-vez', 'de uma vez', 3.0, ['de uma vez', 'de uma vez so', 'de uma so vez']);
  p('vai-com-tudo', 'vai com tudo', 3.5, ['vai com tudo', 'vou com tudo', 'vem com tudo', 'vamos com tudo', 'foi com tudo', 'vai fundo', 'vou fundo']);
  p('pode-entrar', 'pode entrar', 3.8, ['pode entrar', 'pode vir', 'pode ir entrando', 'pode colocar', 'pode enfiar', 'pode meter', 'pode botar', 'pode mandar ver']);
  p('entrar-sem-bater', 'entrar sem bater', 4.0, x(ENTRAR, ['sem bater', 'de uma vez', 'sem pedir licenca', 'sem avisar']));
  p('porta-dos-fundos', 'porta dos fundos', 4.5, ['porta dos fundos', 'porta de tras', 'portinha dos fundos']);
  p('entrada-de-servico', 'entrada de serviço', 4.5, ['entrada de servico', 'entrada dos fundos', 'porta de servico']);
  p('de-pernas-pro-ar', 'de pernas pro ar', 4.0, ['de pernas pro ar', 'de pernas para o ar', 'com as pernas pro ar', 'de perna pro ar', 'pernas pro ar']);
  p('de-ladinho', 'de ladinho', 3.2, ['de ladinho', 'de brucos', 'de bruco']);
  p('de-joelhos', 'de joelhos', 3.5, x(FICAR.concat(['cair', 'caiu', 'cai']), ['de joelhos']).concat(['de joelhos']));
  p('papai-e-mamae', 'papai e mamãe', 3.2, ['papai e mamae', 'papai mamae', 'papai com mamae', 'mamae e papai']);
  p('frango-assado', 'frango assado', 3.5, ['frango assado']);
  p('ponto-g', 'ponto G', 4.0, ['ponto g', 'pontinho g']);
  p('ponto-certo', 'ponto certo', 3.0, ['ponto certo', 'no ponto certo', 'bem no ponto', 'ao ponto']);
  p('so-a-pontinha', 'só a pontinha', 4.2, ['so a pontinha', 'so a ponta', 'so a cabecinha', 'so a cabeca'].concat(x(BOTAR.concat(COLOCAR, ENFIAR, METER), ['so a pontinha', 'so a ponta', 'so a cabecinha'])));
  p('botar-tudo-pra-dentro', 'botar tudo pra dentro', 4.5, x(BOTAR.concat(COLOCAR), ['tudo pra dentro', 'tudo para dentro', 'tudo la dentro', 'tudo dentro', 'pra dentro', 'para dentro']));
  p('botar-pra-quebrar', 'botar pra quebrar', 3.5, x(BOTAR, ['pra quebrar', 'para quebrar', 'pra ferver', 'para ferver', 'pra torar', 'pra moer']));
  p('lenha-na-fogueira', 'lenha na fogueira', 3.8, ['lenha na fogueira'].concat(x(BOTAR.concat(['por', 'pos', 'poe', 'jogar', 'joga', 'jogou', 'jogando']), ['lenha na fogueira'])));
  p('fogo-no-rabo', 'fogo no rabo', 4.0, ['fogo no rabo', 'fogo no cu', 'fogo na periquita', 'fogo no pavio', 'fogo na bunda']);
  p('apagar-o-fogo', 'apagar o fogo', 3.5, x(['apagar', 'apago', 'apagou', 'apagando', 'apaga'], ['o fogo', 'o fogareu', 'o incendio']));
  p('pegar-fogo', 'pegar fogo', 3.0, x(PEGAR, ['fogo']));
  p('esquentar-os-motores', 'esquentar os motores', 3.0, x(ESQUENTAR, ['os motores', 'o motor', 'as coisas', 'o clima', 'o ambiente']));
  p('ligar-na-tomada', 'ligar na tomada', 3.0, x(LIGAR, ['na tomada', 'o motor', 'a maquina', 'o vibrador']));
  p('chegar-junto', 'chegar junto', 2.8, x(CHEGAR, ['junto', 'juntinho', 'pertinho', 'perto', 'de mansinho', 'de fininho', 'de leve']));
  p('subir-e-descer', 'sobe e desce', 3.8, ['subir e descer', 'sobe e desce', 'subindo e descendo', 'vai e vem', 'vem e vai', 'entra e sai', 'entrando e saindo', 'entrar e sair']);
  p('tira-e-bota', 'tira e bota', 3.8, ['tira e bota', 'tira e poe', 'tira e coloca', 'tira e mete', 'bota e tira', 'poe e tira', 'mete e tira']);
  p('quatro-maos', 'a quatro mãos', 3.5, ['a quatro maos', 'quatro maos']);
  p('cabeca-de-baixo', 'cabeça de baixo', 4.0, ['cabeca de baixo', 'cabecinha de baixo', 'a outra cabeca', 'pensar com a cabeca de baixo']);

  /* ---------------------------------------------------------------
   * Sentar, rebolar, cavalgar, abrir, ficar, tirar, soltar...
   * ------------------------------------------------------------- */
  p('sentar-no-pau', 'sentar no pau', 4.5, x(SENTAR, ['no pau', 'na vara', 'na rola', 'no cacete', 'na piroca', 'na pica']));
  p('sentar-em-cima', 'sentar em cima', 3.5, x(SENTAR, ['em cima']));
  p('sentar-no-colo', 'sentar no colo', 3.2, x(SENTAR, ['no colo', 'no colinho']));
  p('sentar-com-vontade', 'sentar com vontade', 3.8, x(SENTAR, ['com vontade', 'devagar', 'devagarinho', 'gostoso', 'ate o fim', 'ate o fundo']));
  p('rebolar-ate-o-chao', 'rebolar até o chão', 4.0, x(REBOLAR, ['ate o chao', 'ate o fim']));
  p('rebolar-gostoso', 'rebolar gostoso', 3.5, x(REBOLAR, ['gostoso', 'gostosinho', 'devagar', 'devagarinho', 'na vara', 'no pau']));
  p('cavalgar-gostoso', 'cavalgar gostoso', 3.5, x(CAVALGAR, ['gostoso', 'ate o fim', 'ate o amanhecer', 'com vontade', 'a noite toda']));
  p('abrir-as-pernas', 'abrir as pernas', 3.8, x(ABRIR, ['as pernas', 'as perninhas', 'a perna']));
  p('abrir-a-boca', 'abrir a boca', 2.8, x(ABRIR, ['a boca', 'a boquinha']));
  p('abrir-o-jogo', 'abrir o jogo', 2.5, x(ABRIR, ['o jogo']));
  p('ficar-duro', 'ficar duro', 3.5, x(FICAR, ['duro', 'dura', 'durinho', 'durao', 'de pau duro', 'em pe']));
  p('ficar-molhada', 'ficar molhada', 3.5, x(FICAR, ['molhada', 'molhado', 'molhadinha', 'molhadinho', 'encharcada', 'encharcado', 'melada', 'melado']));
  p('ficar-excitado', 'ficar excitado', 3.0, x(FICAR, ['excitado', 'excitada', 'assanhado', 'assanhada', 'com tesao', 'arrepiado', 'arrepiada']));
  p('ficar-de-molho', 'ficar de molho', 2.5, x(FICAR, ['de molho', 'na seca']));
  p('esta-duro', 'tá duro', 2.8, ['ta duro', 'ta dura', 'to duro', 'to dura', 'estou duro', 'estou dura', 'esta duro', 'esta dura', 'estamos duros']);
  p('tirar-a-roupa', 'tirar a roupa', 3.0, x(TIRAR, ['a roupa', 'as roupas', 'a camisa', 'a blusa', 'tudo']));
  p('tirar-a-calcinha', 'tirar a calcinha', 3.8, x(TIRAR, ['a calcinha', 'a cueca', 'o sutia', 'a tanga', 'a sunga', 'a calca', 'a bermuda']));
  p('tirar-o-atraso', 'tirar o atraso', 3.8, x(TIRAR, ['o atraso', 'o atrasado']));
  p('tirar-a-virgindade', 'tirar a virgindade', 4.2, x(TIRAR, ['o cabaco', 'a virgindade']));
  p('soltar-a-franga', 'soltar a franga', 3.5, x(SOLTAR, ['a franga', 'o bicho', 'a fera', 'o leao', 'a tarada']));
  p('deitar-e-rolar', 'deitar e rolar', 3.8, x(DEITAR, ['e rolar']));
  p('na-cama', 'na cama', 3.0, ['na cama', 'na caminha', 'pra cama', 'pro quarto']);
  p('ir-pra-cama', 'ir pra cama', 3.2, x(IR, ['pra cama', 'pro motel', 'pro quarto', 'para a cama', 'para o motel', 'para o quarto']));
  p('bater-punheta', 'bater punheta', 4.5, x(BATER, ['punheta', 'uma punheta', 'siririca', 'uma siririca', 'bronha', 'uma bronha']));
  p('bater-uma', 'bater uma', 3.0, x(BATER, ['uma']));
  p('bater-o-martelo', 'bater o martelo', 3.5, x(BATER, ['o martelo']));
  p('bater-papo', 'bater papo', 3.0, x(BATER, ['papo', 'um papo']));
  p('bater-uma-bola', 'bater uma bola', 3.2, x(BATER, ['uma bola', 'bola']));
  p('mandar-ver', 'mandar ver', 3.0, x(MANDAR, ['ver']));
  p('mandar-bala', 'mandar bala', 3.5, x(MANDAR, ['bala', 'brasa', 'lenha', 'ficha']));
  p('mandar-nudes', 'mandar nudes', 3.5, x(MANDAR, ['nudes', 'nude', 'um nude', 'foto pelada']));
  p('tocar-flauta', 'tocar flauta', 4.0, x(TOCAR, ['flauta', 'uma flauta', 'flautinha', 'gaita', 'trombone', 'corneta', 'clarinete', 'trompete']));
  p('tocar-uma', 'tocar uma', 3.0, x(TOCAR, ['uma', 'um']));
  p('tocar-o-terror', 'tocar o terror', 3.0, x(TOCAR, ['o terror', 'fogo', 'o barco']));
  p('tomar-no-cu', 'tomar no cu', 4.5, x(TOMAR, ['no cu', 'no rabo', 'na bunda', 'no toba', 'no olho do cu']));
  p('fazer-amor', 'fazer amor', 3.2, x(FAZER, ['amor', 'sexo', 'uma sacanagem', 'uma safadeza', 'uma putaria', 'um bem bom', 'o amor']));
  p('bom-de-cama', 'bom de cama', 3.5, ['bom de cama', 'boa de cama', 'bom de pegada', 'boa de pegada', 'bom de garfo', 'boa de garfo']);

  /* ---------------------------------------------------------------
   * Roupas, objetos e contextos
   * ------------------------------------------------------------- */
  p('sem-roupa', 'sem roupa', 3.5, ['sem roupa', 'sem calcinha', 'sem cueca', 'sem sutia', 'sem calca', 'sem nada por baixo']);
  p('sem-camisinha', 'sem camisinha', 4.0, ['sem camisinha', 'sem preservativo', 'sem capa']);
  p('com-camisinha', 'com camisinha', 3.0, ['com camisinha', 'de camisinha', 'com preservativo']);
  p('de-calcinha', 'de calcinha', 3.2, ['de calcinha', 'de cueca', 'de biquini', 'de sunga', 'de tanga', 'de fio dental', 'de camisola', 'de lingerie', 'de toalha']);
  p('fio-dental', 'fio dental', 3.0, ['fio dental']);
  p('por-baixo-dos-panos', 'por baixo dos panos', 4.0, ['por baixo dos panos', 'por baixo do pano', 'por baixo da saia', 'por baixo da mesa', 'por baixo dos lencois', 'por baixo das cobertas', 'debaixo dos lencois', 'debaixo das cobertas', 'embaixo das cobertas', 'debaixo da saia']);
  p('mao-boba', 'mão boba', 3.0, ['mao boba', 'maos bobas']);
  p('molho-branco', 'molho branco', 3.0, ['molho branco', 'leite condensado', 'leite moca', 'leitinho quente', 'leite quente', 'leitinho']);
  p('pilula-azul', 'pílula azul', 3.2, ['pilula azul', 'remedio azul', 'azulzinha', 'comprimido azul']);
  p('oleo-de-peroba', 'óleo de peroba', 3.5, ['oleo de peroba']);
  p('sex-shop', 'sex shop', 3.2, ['sex shop', 'sexshop', 'sexy shop', 'loja de sexo', 'casa de swing', 'casa de massagem']);
  p('garota-de-programa', 'garota de programa', 3.5, ['garota de programa', 'garotas de programa', 'moca de programa', 'dama da noite', 'mulher da vida', 'mulher da noite', 'profissional do sexo']);
  p('conteudo-adulto', 'conteúdo adulto', 3.0, ['conteudo adulto', 'conteudo erotico', 'proibido para menores', 'proibido pra menores', 'maiores de 18', 'somente maiores']);
  p('relacao-aberta', 'relação aberta', 3.0, ['relacao aberta', 'casal liberal', 'casamento aberto', 'casais liberais']);
  p('amigos-com-beneficios', 'amigos com benefícios', 3.5, ['amigos com beneficios', 'amigo com beneficios', 'amiga com beneficios', 'amizade colorida']);
  p('noite-de-nupcias', 'noite de núpcias', 3.5, ['noite de nupcias', 'lua de mel', 'primeira noite']);
  p('primeira-vez', 'primeira vez', 2.5, ['primeira vez', 'minha primeira vez']);
  p('pega-pega', 'pega-pega', 3.0, ['pega pega']);
  p('rabo-de-saia', 'rabo de saia', 3.5, ['rabo de saia', 'rabos de saia', 'rabo entre as pernas', 'rabo preso']);
  p('rabo-de-cavalo', 'rabo de cavalo', 3.0, ['rabo de cavalo']);
  p('cu-de-ferro', 'cu de ferro', 4.0, ['cu de ferro', 'cu doce', 'cu de bebado']);
  p('dedo-na-ferida', 'dedo na ferida', 3.0, ['dedo na ferida']);
  p('com-a-boca-na-botija', 'com a boca na botija', 4.5, ['com a boca na botija']);
  p('o-bicho-vai-pegar', 'o bicho vai pegar', 3.5, ['o bicho vai pegar', 'o bicho pegou', 'o bicho ta pegando']);
  p('toma-que-o-filho-e-teu', 'toma que o filho é teu', 4.5, ['toma que o filho e teu', 'toma que o filho e seu']);

  /* ---------------------------------------------------------------
   * Exclamações e xingamentos
   * ------------------------------------------------------------- */
  p('que-delicia', 'que delícia', 3.2, ['que delicia', 'ai que delicia', 'hum que delicia', 'que gostoso', 'que gostosa', 'que gostosura']);
  p('que-tesao', 'que tesão', 3.5, ['que tesao', 'que tesudo', 'que tesuda']);
  p('vem-pro-papai', 'vem pro papai', 3.8, ['vem ni mim', 'vem pro papai', 'vem pra mim', 'vem pra cima', 'vem pra mamae']);
  p('vai-se-foder', 'vai se foder', 3.2, ['vai se foder', 'vai se fuder', 'vai se ferrar', 'vai se lascar']);
  p('puta-que-pariu', 'puta que pariu', 3.8, ['puta que pariu', 'puta que o pariu', 'puta merda']);
  p('filho-da-puta', 'filho da puta', 3.5, ['filho da puta', 'filha da puta', 'filhos da puta', 'fi da puta', 'fi de uma egua', 'filho de uma egua']);
  p('vai-pra-puta-que-pariu', 'vai pra puta que pariu', 4.5, ['vai pra puta que pariu', 'vai para a puta que pariu', 'vai pra puta que o pariu']);
  p('duplo-sentido', 'duplo sentido', 3.5, ['duplo sentido', 'duplos sentidos', 'dupla intencao', 'segundas intencoes', 'segunda intencao', 'com maldade', 'mente suja']);
  p('la-ele', 'lá ele', 5.0, ['la ele', 'la ela']);
  p('garganta-profunda', 'garganta profunda', 4.5, ['garganta profunda', 'gargantas profundas']);
  p('beijo-grego', 'beijo grego', 4.5, ['beijo grego']);
  p('beijo-de-lingua', 'beijo de língua', 3.0, ['beijo de lingua', 'beijo na boca', 'beijar na boca', 'beijo molhado', 'beijo roubado', 'beijo ardente']);

  /* ---------------------------------------------------------------
   * Comida e feira
   * ------------------------------------------------------------- */
  w('cenoura', 'cenoura', 2.0, ['cenoura', 'cenouras', 'cenourinha', 'cenourinhas']);
  w('abobrinha', 'abobrinha', 1.8, ['abobrinha', 'abobrinhas']);
  w('berinjela', 'berinjela', 2.0, ['berinjela', 'berinjelas']);
  w('quiabo', 'quiabo', 1.6, ['quiabo', 'quiabos']);
  w('nabo', 'nabo', 1.6, ['nabo', 'nabos']);
  w('abacaxi', 'abacaxi', 1.2, ['abacaxi', 'abacaxis']);
  w('salame', 'salame', 1.6, ['salame', 'salames', 'salaminho']);
  w('chourico', 'chouriço', 2.0, ['chourico', 'chouricos']);
  w('calabresa', 'calabresa', 1.8, ['calabresa', 'calabresas']);
  w('paio', 'paio', 2.0, ['paio', 'paios']);
  w('espeto', 'espeto', 1.8, ['espeto', 'espetos', 'espetinho', 'espetinhos', 'espetar', 'espeta', 'espetou', 'espetando']);
  w('maminha', 'maminha', 2.0, ['maminha', 'maminhas']);
  w('marisco', 'marisco', 1.8, ['marisco', 'mariscos', 'mexilhao', 'mexilhoes', 'ostra', 'ostras']);
  w('casquinha', 'casquinha', 1.8, ['casquinha', 'casquinhas']);
  w('brigadeiro', 'brigadeiro', 1.8, ['brigadeiro', 'brigadeiros', 'brigadeirao']);
  w('churros', 'churros', 2.0, ['churros', 'churro']);
  w('pamonha', 'pamonha', 1.8, ['pamonha', 'pamonhas']);
  w('bisnaga', 'bisnaga', 2.0, ['bisnaga', 'bisnagas', 'bisnaguinha', 'bisnaguinhas']);
  w('colarinho', 'colarinho', 1.8, ['colarinho', 'colarinhos']);
  w('espuma', 'espuma', 1.4, ['espuma', 'espumas', 'espumar', 'espumou', 'espumando', 'espumante', 'espumantes']);
  p('cachorro-quente', 'cachorro-quente', 3.0, ['cachorro quente', 'cachorros quentes', 'hot dog', 'hot dogs']);
  p('cacho-de-banana', 'cacho de banana', 3.5, ['cacho de banana', 'cachos de banana', 'penca de banana', 'penca de bananas']);
  p('bolo-no-forno', 'bolo no forno', 4.0, ['bolo no forno', 'pao no forno', 'paozinho no forno', 'bolinho no forno']);
  p('olho-de-sogra', 'olho de sogra', 3.0, ['olho de sogra']);

  /* ---------------------------------------------------------------
   * Cozinha e receitas
   * ------------------------------------------------------------- */
  w('untar', 'untar', 1.8, UNTAR.concat(['untada', 'untado']));
  w('sovar', 'sovar', 2.0, ['sovar', 'sova', 'sovou', 'sovando', 'sovada', 'sovado']);
  w('descascar', 'descascar', 1.4, DESCASCAR.concat(['descascada', 'descascado']));
  w('rolo', 'rolo', 1.2, ['rolo', 'rolos', 'rolinho', 'rolinhos', 'rolete', 'roletes']);
  w('forno', 'forno', 1.2, ['forno', 'fornos', 'fornada', 'fornadas', 'fornalha']);
  w('batedeira', 'batedeira', 1.6, ['batedeira', 'batedeiras']);
  w('pilao', 'pilão', 1.8, ['pilao', 'piloes']);
  p('untar-a-forma', 'untar a forma', 3.2, x(UNTAR, ['a forma', 'a assadeira', 'a travessa', 'a tigela']));
  p('bater-as-claras', 'bater as claras', 3.0, x(BATER, ['as claras', 'claras em neve', 'a massa', 'a gema', 'as gemas', 'o creme']));
  p('raspar-o-tacho', 'raspar o tacho', 3.5, x(RASPAR, ['o tacho', 'a panela', 'o fundo do tacho', 'o fundo da panela']));
  p('abrir-a-massa', 'abrir a massa', 3.2, x(ABRIR, ['a massa', 'massa', 'a massinha']));
  p('fogo-baixo', 'fogo baixo', 3.0, ['fogo baixo', 'fogo brando', 'fogo alto', 'fogo medio', 'fogo lento', 'fogo forte']);
  p('mal-passado', 'mal passado', 3.0, ['mal passado', 'mal passada', 'bem passado', 'bem passada']);
  p('deixar-de-molho', 'deixar de molho', 3.0, x(DEIXAR, ['de molho', 'descansar', 'esfriar', 'na geladeira']));
  p('colher-de-pau', 'colher de pau', 3.5, ['colher de pau', 'colheres de pau', 'colher de sopa', 'colher de cha', 'colher de sobremesa']);
  p('panela-de-pressao', 'panela de pressão', 3.0, ['panela de pressao', 'panelas de pressao', 'panela velha', 'panela de barro']);
  p('banho-maria', 'banho-maria', 3.2, ['banho maria', 'em banho maria']);
  p('rolo-de-macarrao', 'rolo de macarrão', 3.0, ['rolo de macarrao', 'rolo de massa', 'rolo compressor']);

  /* ---------------------------------------------------------------
   * Esporte e futebol
   * ------------------------------------------------------------- */
  w('bola', 'bola', 0.8, ['bola', 'bolas', 'bolinha', 'bolinhas', 'bolao']);
  w('gol', 'gol', 0.8, ['gol', 'gols', 'golzinho', 'golzao']);
  w('golaco', 'golaço', 1.8, ['golaco', 'golacos']);
  w('goleada', 'goleada', 1.6, ['goleada', 'goleadas', 'golear', 'goleou', 'goleando']);
  w('goleiro', 'goleiro', 1.2, ['goleiro', 'goleiros', 'goleira', 'goleirao', 'goleirinho']);
  w('artilheiro', 'artilheiro', 1.8, ['artilheiro', 'artilheiros', 'artilheira']);
  w('centroavante', 'centroavante', 1.6, ['centroavante', 'centroavantes']);
  w('trave', 'trave', 1.4, ['trave', 'traves', 'travessao', 'travessoes']);
  w('penalti', 'pênalti', 1.8, ['penalti', 'penaltis', 'penalty']);
  w('bandeirinha', 'bandeirinha', 1.6, ['bandeirinha', 'bandeirinhas']);
  w('apito', 'apito', 1.4, ['apito', 'apitos', 'apitar', 'apita', 'apitou', 'apitando', 'apitinho']);
  w('chute', 'chute', 1.4, ['chute', 'chutes', 'chutar', 'chuta', 'chutou', 'chutando', 'chutinho', 'chutao', 'chutaco']);
  w('drible', 'drible', 1.4, ['drible', 'dribles', 'driblar', 'dribla', 'driblou', 'driblando', 'driblei', 'driblada']);
  w('tabelinha', 'tabelinha', 1.6, ['tabelinha', 'tabelinhas']);
  w('bicuda', 'bicuda', 1.8, ['bicuda', 'bicudas', 'bicudinha', 'bicudao']);
  w('chuveirinho', 'chuveirinho', 1.6, ['chuveirinho', 'chuveirinhos']);
  p('entrar-rasgando', 'entrar rasgando', 4.0, x(ENTRARV, ['rasgando', 'rasgando a defesa', 'de sola', 'com tudo', 'com vontade', 'duro', 'firme', 'forte']));
  p('bola-na-trave', 'bola na trave', 3.5, ['bola na trave', 'bateu na trave', 'bate na trave', 'beijou a trave', 'beijar a trave', 'acertou a trave', 'acerta a trave', 'na trave']);
  p('meter-de-cabeca', 'meter de cabeça', 3.8, x(METER, ['de cabeca', 'de cabecada', 'de peito', 'de bico', 'de ponta', 'de canhota', 'de esquerda', 'de direita', 'de primeira', 'de letra', 'de sola']));
  p('balancar-a-rede', 'balançar a rede', 3.8, x(['balancar', 'balanca', 'balancou', 'balancando', 'estufar', 'estufa', 'estufou', 'estufando'], ['a rede', 'as redes']).concat(['bola na rede'], x(CAIR, ['na rede'])));
  p('dar-um-chapeu', 'dar um chapéu', 3.8, x(DAR, ['um chapeu', 'uma caneta', 'um drible', 'uma bicuda', 'uma bicudinha', 'um carrinho', 'uma lambreta', 'uma cavadinha', 'um toquinho', 'um corte']));
  p('bater-penalti', 'bater pênalti', 3.5, x(BATER, ['penalti', 'um penalti', 'o penalti', 'falta', 'uma falta', 'a falta', 'escanteio', 'um escanteio', 'o escanteio', 'lateral', 'tiro de meta']));
  p('furar-a-defesa', 'furar a defesa', 3.5, x(FURAR, ['a defesa', 'a zaga', 'o goleiro', 'a marcacao', 'a barreira']));
  p('chutar-o-balde', 'chutar o balde', 3.0, x(CHUTAR, ['o balde', 'o pau da barraca', 'pra fora', 'para fora', 'pra longe', 'para longe', 'a porta', 'forte', 'de longe', 'de fora', 'de bico', 'de sola', 'de esquerda', 'de direita', 'pro gol', 'a gol']));
  p('jogar-duro', 'jogar duro', 3.0, x(JOGAR, ['duro', 'sujo', 'pesado', 'bruto']));
  p('bola-parada', 'bola parada', 3.0, ['bola parada', 'bola murcha', 'bola furada', 'bola alta', 'bola rasteira', 'bola cheia', 'bola quadrada']);
  p('nos-acrescimos', 'nos acréscimos', 3.2, ['nos acrescimos', 'no apagar das luzes', 'aos 45 do segundo tempo', 'nos descontos', 'no ultimo minuto', 'no finalzinho', 'no fim do jogo', 'no final do jogo']);
  p('gol-de-placa', 'gol de placa', 3.0, ['gol de placa', 'gol de letra', 'gol contra', 'gol de bicicleta', 'gol olimpico', 'gol de falta', 'gol de cabeca']);
  p('pegar-de-jeito', 'pegar de jeito', 3.5, x(PEGAR, ['de jeito', 'de frente', 'de costas', 'de surpresa', 'de calcanhar']));
  p('segurar-a-onda', 'segurar a onda', 3.0, x(SEGURAR, ['a onda', 'o jogo', 'o resultado', 'a bronca', 'a barra', 'a pressao']));
  p('segurar-o-tesao', 'segurar o tesão', 3.8, x(SEGURAR, ['o tesao', 'o rojao', 'o gozo', 'a vontade', 'as pontas', 'o fogo']));

  /* ---------------------------------------------------------------
   * Ferramentas e obra
   * ------------------------------------------------------------- */
  w('serrote', 'serrote', 1.6, ['serrote', 'serrotes', 'serrotinho']);
  w('alicate', 'alicate', 1.6, ['alicate', 'alicates']);
  w('marreta', 'marreta', 2.0, ['marreta', 'marretas', 'marretada', 'marretadas', 'marretar', 'marretou']);
  w('prego', 'prego', 1.8, ['prego', 'pregos', 'pregar', 'prega', 'pregou', 'pregando', 'pregado', 'pregada', 'preguinho']);
  w('rejunte', 'rejunte', 2.0, ['rejunte', 'rejuntes', 'rejuntar', 'rejuntou', 'rejuntando', 'rejuntado']);
  w('trena', 'trena', 1.8, ['trena', 'trenas']);
  w('lixa', 'lixa', 1.6, ['lixa', 'lixas', 'lixar', 'lixou', 'lixando', 'lixado', 'lixada', 'lixadeira', 'lixadeiras']);
  w('porca', 'porca', 1.6, ['porca', 'porcas']);
  w('arruela', 'arruela', 1.8, ['arruela', 'arruelas']);
  w('ventosa', 'ventosa', 1.8, ['ventosa', 'ventosas']);
  w('cano', 'cano', 1.6, ['cano', 'canos', 'canudo', 'canudos', 'canudinho', 'canudinhos']);
  w('torneira', 'torneira', 1.6, ['torneira', 'torneiras']);
  w('ralo', 'ralo', 1.6, ['ralo', 'ralos']);
  w('frouxo', 'frouxo', 1.6, ['frouxo', 'frouxa', 'frouxos', 'frouxas', 'frouxidao', 'afrouxar', 'afrouxa', 'afrouxou', 'afrouxando']);
  w('estilete', 'estilete', 1.6, ['estilete', 'estiletes']);
  w('canivete', 'canivete', 1.8, ['canivete', 'canivetes', 'canivetinho']);
  w('vergalhao', 'vergalhão', 2.0, ['vergalhao', 'vergalhoes']);
  p('chave-de-fenda', 'chave de fenda', 3.0, ['chave de fenda', 'chaves de fenda', 'chave philips', 'chave allen', 'chave inglesa', 'chave de grifo', 'chave de boca', 'chave de roda']);
  p('porca-e-parafuso', 'porca e parafuso', 3.5, ['porca e parafuso', 'parafuso e porca', 'porca com parafuso', 'porca e rosca']);
  p('apertar-o-parafuso', 'apertar o parafuso', 3.5, x(APERTAR, ['o parafuso', 'a porca', 'a rosca', 'os parafusos', 'a tampa']));
  p('bater-prego', 'bater prego', 3.8, x(BATER, ['prego', 'o prego', 'um prego', 'pregos', 'estaca', 'estacas', 'a estaca']));
  p('furar-a-parede', 'furar a parede', 3.2, x(FURAR, ['a parede', 'o muro', 'a laje', 'o concreto', 'o piso', 'o azulejo']));
  p('massa-corrida', 'massa corrida', 3.0, ['massa corrida', 'massa fina', 'massa grossa', 'massa pronta']);
  p('cabo-de-vassoura', 'cabo de vassoura', 3.5, ['cabo de vassoura', 'cabo de enxada', 'cabo de aco', 'cabo de guerra', 'cabo de panela']);
  p('fita-isolante', 'fita isolante', 3.0, ['fita isolante', 'fita veda rosca', 'veda rosca', 'fita crepe']);
  p('tomada-de-tres-pinos', 'tomada de três pinos', 3.5, ['tomada de tres pinos', 'tomada de dois pinos', 'macho e femea', 'plugue macho', 'plugue femea']);
  p('entrar-pelo-cano', 'entrar pelo cano', 3.5, x(ENTRARV, ['pelo cano']));
  p('descer-pelo-ralo', 'descer pelo ralo', 3.2, ['descer pelo ralo', 'desceu pelo ralo', 'descendo pelo ralo', 'desce pelo ralo', 'descem pelo ralo']);

  /* ---------------------------------------------------------------
   * Animais
   * ------------------------------------------------------------- */
  w('serpente', 'serpente', 1.8, ['serpente', 'serpentes', 'jiboia', 'jiboias', 'sucuri', 'sucuris', 'anaconda', 'anacondas', 'cobrinha', 'cobrinhas']);
  w('coelho', 'coelho', 1.4, ['coelho', 'coelhos', 'coelhinho', 'coelhinha', 'coelhinhos', 'coelhinhas']);
  w('cachorra', 'cachorra', 1.8, ['cachorra', 'cachorras', 'cachorrinha', 'cadela', 'cadelas', 'cadelinha']);
  w('vaca', 'vaca', 1.5, ['vaca', 'vacas', 'vaquinha']);
  w('touro', 'touro', 1.8, ['touro', 'touros', 'tourao']);
  w('garanhao', 'garanhão', 2.0, ['garanhao', 'garanhoes']);
  w('egua', 'égua', 1.8, ['egua', 'eguas', 'eguinha']);
  w('jumento', 'jumento', 2.0, ['jumento', 'jumentos', 'jumenta', 'jegue', 'jegues']);
  w('pomba', 'pomba', 1.5, ['pomba', 'pombas', 'pombinha', 'pombo', 'pombos', 'pombinho']);
  w('minhoca', 'minhoca', 1.8, ['minhoca', 'minhocas', 'minhocao']);
  w('tigresa', 'tigresa', 1.8, ['tigresa', 'tigresas', 'tigrao', 'leoa', 'leoas', 'pantera', 'panteras']);
  w('zangao', 'zangão', 1.8, ['zangao', 'zangoes']);
  w('ferrao', 'ferrão', 2.0, ['ferrao', 'ferroes', 'ferroar', 'ferroou', 'ferroada', 'ferroadas']);
  w('siri', 'siri', 1.6, ['siri', 'siris', 'caranguejo', 'caranguejos']);
  w('tentaculo', 'tentáculo', 2.0, ['tentaculo', 'tentaculos']);
  w('cegonha', 'cegonha', 1.4, ['cegonha', 'cegonhas']);
  p('pica-pau', 'pica-pau', 4.0, ['pica pau', 'pica paus']);
  p('cavalo-de-pau', 'cavalo de pau', 4.0, ['cavalo de pau', 'cavalos de pau']);
  p('como-coelhos', 'como coelhos', 3.5, ['como coelho', 'como coelhos', 'feito coelho', 'feito coelhos']);
  p('a-cegonha-chegou', 'a cegonha chegou', 3.2, ['a cegonha chegou', 'a cegonha vai chegar', 'a cegonha trouxe', 'esperando a cegonha', 'chamar a cegonha']);

  /* ---------------------------------------------------------------
   * Música e instrumentos
   * ------------------------------------------------------------- */
  w('bumbo', 'bumbo', 1.6, ['bumbo', 'bumbos']);
  w('baqueta', 'baqueta', 1.8, ['baqueta', 'baquetas']);
  w('batuque', 'batuque', 1.6, ['batuque', 'batuques', 'batucada', 'batucadas', 'batucar', 'batuca', 'batucou', 'batucando']);
  w('chocalho', 'chocalho', 1.8, ['chocalho', 'chocalhos', 'chacoalhar', 'chacoalha', 'chacoalhou', 'chacoalhando', 'chacoalhada']);
  w('maraca', 'maraca', 1.8, ['maraca', 'maracas']);
  w('cavaquinho', 'cavaquinho', 1.8, ['cavaquinho', 'cavaquinhos']);
  w('saxofone', 'saxofone', 1.8, ['saxofone', 'saxofones', 'sax', 'saxofonista', 'saxofonistas']);
  w('sanfona', 'sanfona', 1.6, ['sanfona', 'sanfonas', 'acordeao', 'acordeom', 'acordeon', 'acordeoes', 'fole', 'foles']);
  w('cuica', 'cuíca', 2.0, ['cuica', 'cuicas']);
  w('berimbau', 'berimbau', 1.8, ['berimbau', 'berimbaus']);
  w('afinar', 'afinar', 1.4, ['afinar', 'afina', 'afinou', 'afinando', 'afinado', 'afinada', 'afinadinho']);
  w('dedilhar', 'dedilhar', 2.0, ['dedilhar', 'dedilha', 'dedilhou', 'dedilhando', 'dedilhado', 'dedilhada']);
  w('pancadao', 'pancadão', 2.0, ['pancadao', 'pancadoes']);
  w('creu', 'créu', 2.0, ['creu', 'creus']);
  p('tocar-instrumento', 'tocar instrumento', 3.0, x(TOCAR, ['sanfona', 'acordeao', 'fole', 'tambor', 'bumbo', 'pandeiro', 'violao', 'cavaquinho', 'guitarra', 'saxofone', 'sax', 'tuba', 'berimbau', 'cuica', 'baixo', 'bateria', 'teclado', 'violino', 'viola']));
  p('afinar-o-instrumento', 'afinar o instrumento', 3.5, x(['afinar', 'afino', 'afinou', 'afinando', 'afina', 'afinei'], ['o instrumento', 'o violao', 'a guitarra', 'o pandeiro', 'a corda', 'o cavaquinho', 'o baixo']));
  p('quadradinho-de-oito', 'quadradinho de oito', 3.8, ['quadradinho de oito', 'quadradinhos de oito']);
  p('segura-o-tchan', 'segura o tchan', 3.5, x(SEGURAR, ['o tchan']));
  p('danca-do-creu', 'dança do créu', 3.8, ['danca do creu', 'danca da garrafa', 'danca do quadrado', 'danca da manivela', 'danca do tchan']);

  /* ---------------------------------------------------------------
   * Trabalho e escritório
   * ------------------------------------------------------------- */
  w('tesoura', 'tesoura', 1.6, ['tesoura', 'tesouras']);
  w('furador', 'furador', 1.8, ['furador', 'furadores']);
  w('carimbo', 'carimbo', 1.8, ['carimbo', 'carimbos', 'carimbar', 'carimba', 'carimbou', 'carimbando', 'carimbado']);
  w('estagiario', 'estagiário', 1.6, ['estagiario', 'estagiaria', 'estagiarios', 'estagiarias']);
  w('gaveta', 'gaveta', 1.4, ['gaveta', 'gavetas', 'gavetinha', 'gavetao']);
  p('hora-extra', 'hora extra', 3.0, ['hora extra', 'horas extras']);
  p('dar-um-aumento', 'dar um aumento', 3.5, x(DAR, ['um aumento', 'um aumentinho', 'uma promocao', 'um bonus', 'um adiantamento']));
  p('bater-o-ponto', 'bater o ponto', 3.2, x(BATER, ['o ponto', 'ponto', 'cartao de ponto']));
  p('abrir-o-bico', 'abrir o bico', 3.0, x(ABRIR, ['o bico', 'a torneira', 'a guarda', 'a gaveta', 'as gavetas', 'a gavetinha']));
  p('encher-linguica', 'encher linguiça', 3.8, x(ENCHER, ['linguica', 'a linguica', 'linguicas']));
  p('tirar-o-corpo-fora', 'tirar o corpo fora', 3.2, x(TIRAR, ['o corpo fora', 'o time de campo', 'o time']));
  p('fazer-corpo-mole', 'fazer corpo mole', 3.5, x(FAZER, ['corpo mole', 'um corpo mole', 'cera', 'hora']));
  p('meter-a-colher', 'meter a colher', 3.2, x(METER, ['a colher', 'colher']));

  /* ---------------------------------------------------------------
   * Carro e mecânica
   * ------------------------------------------------------------- */
  w('embreagem', 'embreagem', 1.8, ['embreagem', 'embreagens']);
  w('pistao', 'pistão', 2.0, ['pistao', 'pistoes']);
  w('cilindro', 'cilindro', 1.8, ['cilindro', 'cilindros', 'cilindrada', 'cilindradas']);
  w('biela', 'biela', 2.0, ['biela', 'bielas']);
  w('bujao', 'bujão', 1.8, ['bujao', 'bujoes']);
  w('estepe', 'estepe', 1.8, ['estepe', 'estepes']);
  w('carburador', 'carburador', 1.6, ['carburador', 'carburadores']);
  w('guincho', 'guincho', 1.6, ['guincho', 'guinchos', 'guinchar', 'guincha', 'guinchou']);
  w('reboque', 'reboque', 1.6, ['reboque', 'reboques']);
  w('borracheiro', 'borracheiro', 1.8, ['borracheiro', 'borracheiros']);
  w('frentista', 'frentista', 1.8, ['frentista', 'frentistas']);
  w('engatar', 'engatar', 1.8, ENGATAR.concat(['engate', 'engates', 'engatada', 'engatado']));
  w('funilaria', 'funilaria', 1.6, ['funilaria', 'funilarias', 'funileiro', 'lataria', 'latarias']);
  w('vareta', 'vareta', 1.8, ['vareta', 'varetas']);
  p('engatar-a-marcha', 'engatar a marcha', 3.5, x(ENGATAR, ['a marcha', 'a re', 'a primeira', 'a segunda', 'a terceira', 'a quarta', 'a quinta', 'um namoro', 'um romance', 'um caso']));
  p('pisar-fundo', 'pisar fundo', 3.8, x(PISAR, ['fundo', 'no acelerador', 'na embreagem', 'no freio', 'no pedal', 'com tudo', 'com forca']));
  p('trocar-o-oleo', 'trocar o óleo', 3.2, x(TROCAR, ['o oleo', 'o filtro', 'o pneu', 'a vela', 'a correia']));
  p('vareta-do-oleo', 'vareta do óleo', 3.5, ['vareta do oleo', 'vareta de oleo', 'medir o oleo', 'olhar o oleo']);
  p('abrir-o-capo', 'abrir o capô', 3.0, x(ABRIR, ['o capo', 'o porta malas']));
  p('porta-malas', 'porta-malas', 3.2, ['porta malas', 'porta mala']);
  p('furar-o-pneu', 'furar o pneu', 3.5, x(FURAR, ['o pneu', 'o estepe']));
  p('bico-injetor', 'bico injetor', 3.2, ['bico injetor', 'bicos injetores']);
  p('pegar-no-tranco', 'pegar no tranco', 3.8, x(PEGAR, ['no tranco']).concat(x(DAR, ['um tranco', 'uns trancos'])));
  p('encher-o-tanque', 'encher o tanque', 3.8, x(ENCHER, ['o tanque', 'o tanque de gasolina']).concat(['completar o tanque', 'completa o tanque', 'completou o tanque', 'completo o tanque']));
  p('dar-carona', 'dar carona', 3.8, x(DAR, ['carona', 'caronas', 'uma carona']));
  p('pegar-carona', 'pegar carona', 3.5, x(PEGAR, ['carona', 'caronas', 'uma carona']));
  p('banco-de-tras', 'banco de trás', 3.5, ['banco de tras', 'banco traseiro', 'bancos de tras']);
  p('dar-re', 'dar ré', 3.8, x(DAR, ['re', 'uma re']).concat(['marcha a re', 'marcha re']));

  /* ---------------------------------------------------------------
   * Verbos de ação, banho e pescaria
   * ------------------------------------------------------------- */
  w('cutucar', 'cutucar', 1.6, ['cutucar', 'cutuca', 'cutucou', 'cutucando', 'cutucada', 'cutucadinha']);
  w('futucar', 'futucar', 1.8, ['futucar', 'futuca', 'futucou', 'futucando', 'futucada']);
  w('bolinar', 'bolinar', 2.2, ['bolinar', 'bolina', 'bolinou', 'bolinando', 'bolinagem']);
  w('alisar', 'alisar', 1.6, ['alisar', 'alisa', 'alisou', 'alisando', 'alisada', 'alisadinha', 'afagar', 'afaga', 'afagou', 'afagando', 'afago']);
  w('acariciar', 'acariciar', 1.6, ['acariciar', 'acaricia', 'acariciou', 'acariciando', 'caricia', 'caricias']);
  w('rocar', 'roçar', 1.6, ['rocar', 'rocou', 'rocando', 'rocada', 'rocadinha', 'rocadas']);
  w('raspar', 'raspar', 1.4, RASPAR.concat(['raspada', 'raspadas']));
  w('arrombar', 'arrombar', 2.6, ['arrombar', 'arromba', 'arrombou', 'arrombando', 'arrombado', 'arrombada'], ['arromb']);
  w('estocar', 'estocar', 1.8, ['estocar', 'estoca', 'estocou', 'estocando', 'estocada', 'estocadas']);
  w('sugar', 'sugar', 1.8, ['sugar', 'suga', 'sugou', 'sugando', 'sugada', 'sugado', 'sugadinha']);
  w('encoxar', 'encoxar', 2.4, ['encoxar', 'encoxa', 'encoxou', 'encoxando', 'encoxada', 'encoxador'], ['encox']);
  w('encurralar', 'encurralar', 2.0, ['encurralar', 'encurrala', 'encurralou', 'encurralando', 'encurralada', 'encurralado']);
  w('surra', 'surra', 1.8, ['surra', 'surras', 'surrar', 'surrou', 'surrando', 'surrada', 'surrado']);
  w('arrebentar', 'arrebentar', 1.8, ['arrebentar', 'arrebenta', 'arrebentou', 'arrebentando', 'arrebentada', 'arrebentado']);
  w('arregacar', 'arregaçar', 2.0, ARREGACAR.concat(['arregacada', 'arregacado']));
  w('escancarar', 'escancarar', 2.0, ['escancarar', 'escancara', 'escancarou', 'escancarando', 'escancarada', 'escancarado']);
  w('entupir', 'entupir', 1.8, ['entupir', 'entope', 'entupiu', 'entupindo', 'entupida', 'entupido']);
  w('transbordar', 'transbordar', 1.8, ['transbordar', 'transborda', 'transbordou', 'transbordando', 'transbordante']);
  w('ensaboar', 'ensaboar', 1.6, ['ensaboar', 'ensaboa', 'ensaboou', 'ensaboando', 'ensaboada', 'ensaboado', 'ensaboadinha']);
  w('sabonete', 'sabonete', 1.4, ['sabonete', 'sabonetes', 'saboneteira']);
  w('isca', 'isca', 1.6, ['isca', 'iscas']);
  w('anzol', 'anzol', 1.8, ['anzol', 'anzois']);
  w('molinete', 'molinete', 1.8, ['molinete', 'molinetes']);
  w('carretilha', 'carretilha', 1.8, ['carretilha', 'carretilhas']);
  w('gandaia', 'gandaia', 1.8, ['gandaia', 'gandaias', 'gandaiar']);
  w('engravidar', 'engravidar', 2.0, ['engravidar', 'engravida', 'engravidou', 'engravidando', 'engravidada']);
  w('prenha', 'prenha', 1.8, ['prenha', 'prenhas', 'prenhe', 'prenhes']);
  p('dar-uma-surra', 'dar uma surra', 3.8, x(DAR.concat(LEVAR), ['uma surra', 'uma sova', 'uma pisa', 'uma tunda', 'uma lavada', 'uma goleada', 'uma cacetada', 'uma porrada', 'uma paulada']));
  p('enterrar-o-osso', 'enterrar o osso', 3.5, x(ENTERRAR, ['o osso', 'o ossinho']));
  p('osso-duro-de-roer', 'osso duro de roer', 3.2, ['osso duro de roer', 'ossos duros de roer', 'duro de roer']);
  p('deixar-o-sabonete-cair', 'deixar o sabonete cair', 4.0, x(DEIXAR, ['cair o sabonete', 'o sabonete cair', 'o sabonete']).concat(x(PEGAR, ['o sabonete', 'sabonete'])));
  p('morder-a-isca', 'morder a isca', 3.5, x(MORDER.concat(ENGOLIR), ['a isca', 'o anzol']));
  p('jogar-a-isca', 'jogar a isca', 3.2, x(JOGAR, ['a isca', 'o anzol', 'a rede', 'a linha']));
  p('vara-de-pescar', 'vara de pescar', 3.5, ['vara de pescar', 'varas de pescar', 'vara de pesca']);
  p('cair-de-boca', 'cair de boca', 3.8, x(CAIR, ['de boca']));
  p('mergulhar-de-cabeca', 'mergulhar de cabeça', 3.5, x(MERGULHAR, ['de cabeca', 'fundo', 'sem medo']));
  p('arregacar-as-mangas', 'arregaçar as mangas', 3.5, x(ARREGACAR, ['as mangas', 'as pernas']));
  p('barriga-de-aluguel', 'barriga de aluguel', 3.0, ['barriga de aluguel', 'barriga de chope', 'barriga de cerveja']);

  /* ---------------------------------------------------------------
   * Adjetivos e estados
   * ------------------------------------------------------------- */
  w('rijo', 'rijo', 1.8, ['rijo', 'rija', 'rijos', 'rijas']);
  w('turgido', 'túrgido', 2.2, ['turgido', 'turgida', 'turgidos', 'turgidas']);
  w('avantajado', 'avantajado', 2.2, ['avantajado', 'avantajada', 'avantajados', 'avantajadas']);
  w('pegajoso', 'pegajoso', 1.8, ['pegajoso', 'pegajosa', 'pegajosos', 'pegajosas', 'grudento', 'grudenta', 'grudentos', 'grudentas']);
  w('escorregadio', 'escorregadio', 1.6, ['escorregadio', 'escorregadia', 'escorregadios', 'escorregadias']);
  w('folgado', 'folgado', 1.8, ['folgado', 'folgada', 'folgados', 'folgadas', 'folgadao', 'folgadinho']);
  w('estreito', 'estreito', 1.8, ['estreito', 'estreita', 'estreitos', 'estreitas', 'estreitinho', 'estreitinha']);
  w('excitado', 'excitado', 2.0, ['excitado', 'excitada', 'excitados', 'excitadas', 'excitante', 'excitantes', 'excitacao', 'excitar', 'excita', 'excitou']);
  w('assanhado', 'assanhado', 2.0, ['assanhado', 'assanhada', 'assanhados', 'assanhadas', 'assanhadinho', 'assanhadinha', 'assanhar', 'assanhou']);
  w('aticado', 'atiçado', 2.0, ['aticado', 'aticada', 'aticados', 'aticadas', 'aticar', 'atica', 'aticou']);
  w('devasso', 'devasso', 2.2, ['devasso', 'devassa', 'devassos', 'devassas', 'devassidao']);
  w('libertino', 'libertino', 2.0, ['libertino', 'libertina', 'libertinos', 'libertinas', 'libertinagem']);
  w('depravado', 'depravado', 2.4, ['depravado', 'depravada', 'depravados', 'depravadas', 'depravacao']);
  w('lascivo', 'lascivo', 2.2, ['lascivo', 'lasciva', 'lascivos', 'lascivas', 'lascivia']);
  w('luxurioso', 'luxurioso', 2.2, ['luxuria', 'luxurias', 'luxurioso', 'luxuriosa', 'luxuriosos', 'luxuriosas', 'luxuriante']);
  w('libidinoso', 'libidinoso', 2.4, ['libidinoso', 'libidinosa', 'libido'], ['libidin']);
  w('lubrico', 'lúbrico', 2.2, ['lubrico', 'lubrica', 'lubricos', 'lubricas']);
  w('promiscuo', 'promíscuo', 2.2, ['promiscuo', 'promiscua', 'promiscuos', 'promiscuas', 'promiscuidade']);
  w('castidade', 'castidade', 1.4, ['castidade', 'celibato', 'celibatario', 'abstinencia', 'abstinente']);
  p('bem-servido', 'bem servido', 3.0, ['bem servido', 'bem servida', 'bem servidos', 'bem servidas', 'bem dotado', 'bem dotada']);
  p('tamanho-importa', 'o tamanho importa', 3.5, ['o tamanho importa', 'tamanho importa', 'tamanho nao importa', 'tamanho nao e documento', 'tamanho e documento']);
  p('no-cio', 'no cio', 3.2, ['no cio', 'em cio']);

  /* ---------------------------------------------------------------
   * Expressões populares e ditados
   * ------------------------------------------------------------- */
  w('galho', 'galho', 1.6, ['galho', 'galhos', 'galhinho']);
  w('match', 'match', 1.0, ['match', 'matches']);
  p('quebrar-o-galho', 'quebrar o galho', 3.2, x(QUEBRAR, ['o galho', 'um galho', 'galho']));
  p('em-casa-de-ferreiro', 'em casa de ferreiro', 4.2, ['em casa de ferreiro espeto de pau', 'casa de ferreiro espeto de pau']);
  p('pau-que-nasce-torto', 'pau que nasce torto', 4.5, ['pau que nasce torto', 'pau que nasce torto nunca se endireita']);
  p('agua-mole-em-pedra-dura', 'água mole em pedra dura', 4.0, ['agua mole em pedra dura', 'tanto bate ate que fura']);
  p('passaro-na-mao', 'pássaro na mão', 3.8, ['passaro na mao', 'passarinho na mao', 'mais vale um passaro na mao']);
  p('pimenta-no-cu', 'pimenta no cu', 4.0, ['pimenta nos olhos dos outros', 'pimenta no cu dos outros', 'pimenta no cu', 'pimenta no rabo']);
  p('devagar-com-o-andor', 'devagar com o andor', 3.8, ['devagar com o andor', 'devagar com o andor que o santo e de barro']);
  p('de-grao-em-grao', 'de grão em grão', 3.5, ['de grao em grao', 'de grao em grao a galinha enche o papo']);
  p('botar-a-boca-no-trombone', 'botar a boca no trombone', 4.5, x(BOTAR.concat(COLOCAR), ['a boca no trombone']));
  p('tirar-o-cavalinho', 'tirar o cavalinho da chuva', 3.2, x(TIRAR, ['o cavalinho da chuva', 'o cavalo da chuva']));
  p('pegar-o-bonde', 'pegar o bonde', 3.2, x(PEGAR, ['o bonde', 'o bonde andando']));
  p('fazer-a-festa', 'fazer a festa', 3.2, x(FAZER, ['a festa', 'uma festa', 'uma festinha', 'a festinha']));
  p('fazer-charme', 'fazer charme', 3.0, x(FAZER, ['charme', 'manha', 'fita', 'birra', 'doce', 'cu doce']));
  p('fazer-a-barba', 'fazer a barba', 3.0, x(FAZER, ['a barba', 'o cabelo', 'o pe', 'as unhas', 'a mao', 'a depilacao', 'a sobrancelha', 'as sobrancelhas', 'o bigode']));
  p('pegar-leve', 'pegar leve', 3.0, x(PEGAR, ['leve', 'pesado', 'forte', 'firme', 'duro']));
  p('dar-um-perdido', 'dar um perdido', 3.2, x(DAR, ['um perdido', 'um branco', 'um sumico', 'um tempo', 'um tempinho', 'um role', 'um salto', 'um pulo', 'um pulinho', 'um grau']));
  p('dar-uma-de', 'dar uma de', 3.8, x(DAR, ['uma de louco', 'uma de louca', 'uma de doido', 'uma de doida', 'uma de besta', 'uma de otario', 'uma de otaria', 'uma de esperto', 'uma de esperta', 'uma de santo', 'uma de santa', 'uma de macho', 'uma de joao sem braco']));
  p('vai-que-cola', 'vai que cola', 3.2, ['vai que cola', 'vai que da', 'vai que rola']);
  p('rolou-um-clima', 'rolou um clima', 3.5, ['rolou um clima', 'rola um clima', 'rolando um clima', 'rolou uma quimica', 'rolou um lance', 'rola um lance', 'rolou um beijo']);
  p('dar-a-luz', 'dar à luz', 3.5, x(DAR, ['a luz', 'luz', 'luz verde']));
  p('ficar-de-castigo', 'ficar de castigo', 3.0, x(FICAR, ['de castigo']));
  p('agua-na-boca', 'água na boca', 3.2, ['agua na boca', 'aguinha na boca']);
  p('dar-match', 'dar match', 2.8, x(DAR, ['match']));
  p('pensa-que-e-mole', 'pensa que é mole', 3.2, ['pensando que e mole', 'pensa que e mole', 'acha que e mole']);
  p('maria-chuteira', 'maria chuteira', 3.0, ['maria chuteira', 'marias chuteiras']);

  /* ---------------------------------------------------------------
   * Gírias
   * ------------------------------------------------------------- */
  w('tcheca', 'tcheca', 2.2, ['tcheca', 'tchecas']);
  w('xana', 'xana', 2.4, ['xana', 'xanas', 'xaninha', 'xaninhas']);
  w('xibiu', 'xibiu', 2.4, ['xibiu', 'xibius']);
  w('bilola', 'bilola', 2.2, ['bilola', 'bilolas']);
  w('jeba', 'jeba', 2.4, ['jeba', 'jebas']);
  w('brinquedinho', 'brinquedinho', 1.8, ['brinquedinho', 'brinquedinhos']);
  w('rapariga', 'rapariga', 2.0, ['rapariga', 'raparigas']);
  w('quenga', 'quenga', 2.4, ['quenga', 'quengas']);
  w('biscate', 'biscate', 2.4, ['biscate', 'biscates']);
  w('periguete', 'periguete', 2.2, ['periguete', 'periguetes']);
  w('bofe', 'bofe', 2.0, ['bofe', 'bofes']);
  w('mulherengo', 'mulherengo', 2.0, ['mulherengo', 'mulherengos', 'mulherenga', 'mulherengas']);

  LaEle.dictionary = {
    version: 1,
    entries: entries,
    tierOf: tierOf
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LaEle.dictionary;
