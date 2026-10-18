/* Robo-LaEle - dicionário do "lá ele".
 * Formas e stems podem ter acento/caixa alta: o motor normaliza tudo.
 * Cuidado: "dá" e "dê" normalizam para "da"/"de", então ficam de fora. */
var LaEle = globalThis.LaEle = globalThis.LaEle || {};

(function () {
  'use strict';

  var entries = [];

  function tierOf(coef) {
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

  LaEle.dictionary = {
    version: 1,
    entries: entries
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LaEle.dictionary;
