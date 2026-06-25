EXEMPLOS DE USO:

CONSTRUTORES:
const agora = new DateTime(); Data/hora atual
const dataString = new DateTime('25/12/2024 15:30:45'); String formato brasileiro
const dataTimestamp = new DateTime(1703516400000); Timestamp em ms
const dataSemHora = new DateTime('01/01/2025'); Só data, hora zerada
const dataEstaticos = DateTime.agora(); Método estático para data atual
const hoje = DateTime.hoje(); Início do dia atual (00:00:00)
const ontem = DateTime.ontem(); Início de ontem
const amanha = DateTime.amanha(); Início de amanhã
const dataCustom = DateTime.criarData(25, 12, 2024, 15, 30, 45); dia, mês, ano, hora, minuto, segundo
const fromUnix = DateTime.fromTimestampUnix(1703516400); Timestamp Unix (segundos)

FORMATAÇÕES:
agora.formatarData = "25/12/2024"
agora.formatarHora = "15:30:45"
agora.formatarCompleto = "25/12/2024 15:30:45"
agora.horaPorExtenso = "15 horas, 30 minutos e 45 segundos"
agora.dataPorExtenso = "segunda-feira, 25 de dezembro de 2024"
agora.formatarParaSQL = "2024-12-25 15:30:45"
agora.formatarParaInput = "2024-12-25" (para input type="date")
agora.formatarTempo12h = "3:30 PM"
agora.formatarRelativo = "há 2 horas" (relativo ao momento atual)

GETTERS:
agora.dia; 25
agora.mes; 12
agora.ano; 2024
agora.horas; 15
agora.minutos; 30
agora.segundos; 45
agora.diaSemana; "segunda"
agora.nomeMes; "dezembro"
agora.timestamp = 1703516445000 (timestamp em ms)
agora.timestampUnix = 1703516445 (timestamp em segundos)

OPERAÇÕES MATEMÁTICAS:
const futuro = agora.adicionarDias(30); Adiciona 30 dias
const passado = agora.adicionarMeses(-2); Subtrai 2 meses
const maisUmAno = agora.adicionarAnos(1); Adiciona 1 ano
const maisHoras = agora.adicionarHoras(5); Adiciona 5 horas
const maisMinutos = agora.adicionarMinutos(30); Adiciona 30 minutos
const maisSegundos = agora.adicionarSegundos(120); Adiciona 120 segundos

DIFERENÇAS ENTRE DATAS:
const outraData = new DateTime('01/01/2025');
agora.diferencaEmDiasoutraData = Diferença em dias
agora.diferencaEmHorasoutraData = Diferença em horas
agora.diferencaEmMinutosoutraData = Diferença em minutos

COMPARAÇÕES:
agora.ehAnterioroutraData = true/false
agora.ehPosterioroutraData = true/false
agora.ehIgualoutraData = true/false
agora.ehMesmoDiaoutraData = true/false

VERIFICAÇÕES:
agora.ehHoje = true/false
agora.ehOntem = true/false
agora.ehAmanha = true/false
agora.ehFimDeSemana = true/false
agora.ehAnoBissexto = true/false

INÍCIO/FIM DE PERÍODOS:
agora.inicioDoMes).formatarCompleto( = "01/12/2024 00:00:00"
agora.fimDoMes).formatarCompleto( = "31/12/2024 23:59:59"
agora.inicioDoDia).formatarCompleto( = "25/12/2024 00:00:00"
agora.fimDoDia).formatarCompleto( = "25/12/2024 23:59:59"

CONVERSÕES:
agora.toDate = Objeto Date nativo do JavaScript
agora.toString = "25/12/2024 15:30:45"
agora.toJSON = Objeto com todas as informações estruturadas
