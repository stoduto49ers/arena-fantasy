// =============================================
// ARENA FANTASY - Jogos do Brasileirão 2026
// Tabela oficial CBF — todas as 38 rodadas
// =============================================

const Jogos = {

    currentRound: 18,
    totalRounds: 38,

    allRounds: {
        1: [
            { home:'Fluminense',   away:'Grêmio',        hs:null,as:null, date:'28-29/01', status:'finished' },
            { home:'Botafogo',     away:'Cruzeiro',       hs:4,   as:0,   date:'28-29/01', status:'finished' },
            { home:'São Paulo',    away:'Flamengo',       hs:null,as:null, date:'28-29/01', status:'finished' },
            { home:'Corinthians',  away:'Bahia',          hs:null,as:null, date:'28-29/01', status:'finished' },
            { home:'Mirassol',     away:'Vasco',          hs:null,as:null, date:'28-29/01', status:'finished' },
            { home:'Atlético-MG',  away:'Palmeiras',      hs:null,as:null, date:'28-29/01', status:'finished' },
            { home:'Internacional',away:'Athletico-PR',   hs:null,as:null, date:'28-29/01', status:'finished' },
            { home:'Coritiba',     away:'Bragantino',     hs:null,as:null, date:'28-29/01', status:'finished' },
            { home:'Vitória',      away:'Remo',           hs:null,as:null, date:'28-29/01', status:'finished' },
            { home:'Chapecoense',  away:'Santos',         hs:null,as:null, date:'28-29/01', status:'finished' },
        ],
        2: [
            { home:'Flamengo',     away:'Internacional',  hs:null,as:null, date:'04-05/02', status:'finished' },
            { home:'Vasco',        away:'Chapecoense',    hs:null,as:null, date:'04-05/02', status:'finished' },
            { home:'Santos',       away:'São Paulo',      hs:null,as:null, date:'04-05/02', status:'finished' },
            { home:'Palmeiras',    away:'Vitória',        hs:5,   as:1,   date:'04-05/02', status:'finished' },
            { home:'Bragantino',   away:'Atlético-MG',    hs:null,as:null, date:'04-05/02', status:'finished' },
            { home:'Cruzeiro',     away:'Coritiba',       hs:null,as:null, date:'04-05/02', status:'finished' },
            { home:'Grêmio',       away:'Botafogo',       hs:5,   as:3,   date:'04-05/02', status:'finished' },
            { home:'Athletico-PR', away:'Corinthians',    hs:null,as:null, date:'04-05/02', status:'finished' },
            { home:'Bahia',        away:'Fluminense',     hs:null,as:null, date:'04-05/02', status:'finished' },
            { home:'Remo',         away:'Mirassol',       hs:null,as:null, date:'04-05/02', status:'finished' },
        ],
        3: [
            { home:'Fluminense',   away:'Botafogo',       hs:null,as:null, date:'11-12/02', status:'finished' },
            { home:'Vasco',        away:'Bahia',          hs:null,as:null, date:'11-12/02', status:'finished' },
            { home:'São Paulo',    away:'Grêmio',         hs:null,as:null, date:'11-12/02', status:'finished' },
            { home:'Corinthians',  away:'Bragantino',     hs:null,as:null, date:'11-12/02', status:'finished' },
            { home:'Mirassol',     away:'Cruzeiro',       hs:null,as:null, date:'11-12/02', status:'finished' },
            { home:'Atlético-MG',  away:'Remo',           hs:null,as:null, date:'11-12/02', status:'finished' },
            { home:'Internacional',away:'Palmeiras',      hs:1,   as:3,   date:'12/02', status:'finished' },
            { home:'Athletico-PR', away:'Santos',         hs:null,as:null, date:'11-12/02', status:'finished' },
            { home:'Vitória',      away:'Flamengo',       hs:null,as:null, date:'11-12/02', status:'finished' },
            { home:'Chapecoense',  away:'Coritiba',       hs:null,as:null, date:'11-12/02', status:'finished' },
        ],
        4: [
            { home:'Flamengo',     away:'Mirassol',       hs:null,as:null, date:'25-26/02', status:'finished' },
            { home:'Botafogo',     away:'Vitória',        hs:null,as:null, date:'25-26/02', status:'finished' },
            { home:'Santos',       away:'Vasco',          hs:null,as:null, date:'25-26/02', status:'finished' },
            { home:'Palmeiras',    away:'Fluminense',     hs:null,as:null, date:'25-26/02', status:'finished' },
            { home:'Bragantino',   away:'Athletico-PR',   hs:null,as:null, date:'25-26/02', status:'finished' },
            { home:'Cruzeiro',     away:'Corinthians',    hs:null,as:null, date:'25-26/02', status:'finished' },
            { home:'Grêmio',       away:'Atlético-MG',    hs:null,as:null, date:'25-26/02', status:'finished' },
            { home:'Coritiba',     away:'São Paulo',      hs:null,as:null, date:'25-26/02', status:'finished' },
            { home:'Bahia',        away:'Chapecoense',    hs:null,as:null, date:'25-26/02', status:'finished' },
            { home:'Remo',         away:'Internacional',  hs:null,as:null, date:'25-26/02', status:'finished' },
        ],
        5: [
            { home:'Flamengo',     away:'Cruzeiro',       hs:null,as:null, date:'14-16/03', status:'finished' },
            { home:'Vasco',        away:'Palmeiras',      hs:null,as:null, date:'14-16/03', status:'finished' },
            { home:'São Paulo',    away:'Chapecoense',    hs:null,as:null, date:'14-16/03', status:'finished' },
            { home:'Corinthians',  away:'Coritiba',       hs:null,as:null, date:'14-16/03', status:'finished' },
            { home:'Mirassol',     away:'Santos',         hs:null,as:null, date:'14-16/03', status:'finished' },
            { home:'Atlético-MG',  away:'Internacional',  hs:null,as:null, date:'14-16/03', status:'finished' },
            { home:'Grêmio',       away:'Bragantino',     hs:null,as:null, date:'14-16/03', status:'finished' },
            { home:'Athletico-PR', away:'Botafogo',       hs:null,as:null, date:'14-16/03', status:'finished' },
            { home:'Bahia',        away:'Vitória',        hs:null,as:null, date:'14-16/03', status:'finished' },
            { home:'Remo',         away:'Fluminense',     hs:null,as:null, date:'14-16/03', status:'finished' },
        ],
        6: [
            { home:'Fluminense',   away:'Athletico-PR',   hs:null,as:null, date:'21-23/03', status:'finished' },
            { home:'Botafogo',     away:'Flamengo',       hs:null,as:null, date:'21-23/03', status:'finished' },
            { home:'Santos',       away:'Corinthians',    hs:null,as:null, date:'21-23/03', status:'finished' },
            { home:'Palmeiras',    away:'Mirassol',       hs:null,as:null, date:'21-23/03', status:'finished' },
            { home:'Bragantino',   away:'São Paulo',      hs:null,as:null, date:'21-23/03', status:'finished' },
            { home:'Cruzeiro',     away:'Vasco',          hs:null,as:null, date:'21-23/03', status:'finished' },
            { home:'Internacional',away:'Bahia',          hs:null,as:null, date:'21-23/03', status:'finished' },
            { home:'Coritiba',     away:'Remo',           hs:null,as:null, date:'21-23/03', status:'finished' },
            { home:'Vitória',      away:'Atlético-MG',    hs:null,as:null, date:'21-23/03', status:'finished' },
            { home:'Chapecoense',  away:'Grêmio',         hs:null,as:null, date:'21-23/03', status:'finished' },
        ],
        7: [
            { home:'Flamengo',     away:'Remo',           hs:null,as:null, date:'01-02/04', status:'finished' },
            { home:'Vasco',        away:'Fluminense',     hs:null,as:null, date:'01-02/04', status:'finished' },
            { home:'Santos',       away:'Internacional',  hs:null,as:null, date:'01-02/04', status:'finished' },
            { home:'Palmeiras',    away:'Botafogo',       hs:null,as:null, date:'01-02/04', status:'finished' },
            { home:'Mirassol',     away:'Coritiba',       hs:null,as:null, date:'01-02/04', status:'finished' },
            { home:'Atlético-MG',  away:'São Paulo',      hs:null,as:null, date:'01-02/04', status:'finished' },
            { home:'Grêmio',       away:'Vitória',        hs:null,as:null, date:'01-02/04', status:'finished' },
            { home:'Athletico-PR', away:'Cruzeiro',       hs:null,as:null, date:'01-02/04', status:'finished' },
            { home:'Bahia',        away:'Bragantino',     hs:null,as:null, date:'01-02/04', status:'finished' },
            { home:'Chapecoense',  away:'Corinthians',    hs:null,as:null, date:'01-02/04', status:'finished' },
        ],
        8: [
            { home:'Fluminense',   away:'Atlético-MG',    hs:null,as:null, date:'04-06/04', status:'finished' },
            { home:'Vasco',        away:'Grêmio',         hs:null,as:null, date:'04-06/04', status:'finished' },
            { home:'São Paulo',    away:'Palmeiras',      hs:null,as:null, date:'04-06/04', status:'finished' },
            { home:'Corinthians',  away:'Flamengo',       hs:null,as:null, date:'04-06/04', status:'finished' },
            { home:'Bragantino',   away:'Botafogo',       hs:null,as:null, date:'04-06/04', status:'finished' },
            { home:'Cruzeiro',     away:'Santos',         hs:null,as:null, date:'04-06/04', status:'finished' },
            { home:'Internacional',away:'Chapecoense',    hs:null,as:null, date:'04-06/04', status:'finished' },
            { home:'Athletico-PR', away:'Coritiba',       hs:null,as:null, date:'04-06/04', status:'finished' },
            { home:'Vitória',      away:'Mirassol',       hs:null,as:null, date:'04-06/04', status:'finished' },
            { home:'Remo',         away:'Bahia',          hs:null,as:null, date:'04-06/04', status:'finished' },
        ],
        9: [
            { home:'Fluminense',   away:'Corinthians',    hs:null,as:null, date:'11-13/04', status:'finished' },
            { home:'Botafogo',     away:'Mirassol',       hs:null,as:null, date:'11-13/04', status:'finished' },
            { home:'Santos',       away:'Remo',           hs:null,as:null, date:'11-13/04', status:'finished' },
            { home:'Palmeiras',    away:'Grêmio',         hs:null,as:null, date:'11-13/04', status:'finished' },
            { home:'Bragantino',   away:'Flamengo',       hs:null,as:null, date:'11-13/04', status:'finished' },
            { home:'Cruzeiro',     away:'Vitória',        hs:null,as:null, date:'11-13/04', status:'finished' },
            { home:'Internacional',away:'São Paulo',      hs:null,as:null, date:'11-13/04', status:'finished' },
            { home:'Coritiba',     away:'Vasco',          hs:null,as:null, date:'11-13/04', status:'finished' },
            { home:'Bahia',        away:'Athletico-PR',   hs:null,as:null, date:'11-13/04', status:'finished' },
            { home:'Chapecoense',  away:'Atlético-MG',    hs:0,   as:4,   date:'02/04', status:'finished' },
        ],
        10: [
            { home:'Flamengo',     away:'Santos',         hs:null,as:null, date:'18-20/04', status:'finished' },
            { home:'Vasco',        away:'Botafogo',       hs:null,as:null, date:'18-20/04', status:'finished' },
            { home:'São Paulo',    away:'Cruzeiro',       hs:null,as:null, date:'18-20/04', status:'finished' },
            { home:'Corinthians',  away:'Internacional',  hs:null,as:null, date:'18-20/04', status:'finished' },
            { home:'Mirassol',     away:'Bragantino',     hs:null,as:null, date:'18-20/04', status:'finished' },
            { home:'Atlético-MG',  away:'Athletico-PR',   hs:null,as:null, date:'18-20/04', status:'finished' },
            { home:'Grêmio',       away:'Remo',           hs:null,as:null, date:'18-20/04', status:'finished' },
            { home:'Coritiba',     away:'Fluminense',     hs:null,as:null, date:'18-20/04', status:'finished' },
            { home:'Bahia',        away:'Palmeiras',      hs:null,as:null, date:'18-20/04', status:'finished' },
            { home:'Chapecoense',  away:'Vitória',        hs:null,as:null, date:'18-20/04', status:'finished' },
        ],
        11: [
            { home:'Fluminense',   away:'Flamengo',       hs:null,as:null, date:'25-27/04', status:'finished' },
            { home:'Botafogo',     away:'Coritiba',       hs:null,as:null, date:'25-27/04', status:'finished' },
            { home:'Santos',       away:'Atlético-MG',    hs:null,as:null, date:'25-27/04', status:'finished' },
            { home:'Corinthians',  away:'Palmeiras',      hs:null,as:null, date:'25-27/04', status:'finished' },
            { home:'Mirassol',     away:'Bahia',          hs:null,as:null, date:'25-27/04', status:'finished' },
            { home:'Cruzeiro',     away:'Bragantino',     hs:null,as:null, date:'25-27/04', status:'finished' },
            { home:'Internacional',away:'Grêmio',         hs:null,as:null, date:'25-27/04', status:'finished' },
            { home:'Athletico-PR', away:'Chapecoense',    hs:null,as:null, date:'25-27/04', status:'finished' },
            { home:'Vitória',      away:'São Paulo',      hs:null,as:null, date:'25-27/04', status:'finished' },
            { home:'Remo',         away:'Vasco',          hs:null,as:null, date:'25-27/04', status:'finished' },
        ],
        12: [
            { home:'Flamengo',     away:'Bahia',          hs:2,   as:0,   date:'26/04', status:'finished' },
            { home:'Vasco',        away:'São Paulo',       hs:null,as:null, date:'02-04/05', status:'finished' },
            { home:'Santos',       away:'Fluminense',     hs:null,as:null, date:'02-04/05', status:'finished' },
            { home:'Palmeiras',    away:'Athletico-PR',   hs:null,as:null, date:'02-04/05', status:'finished' },
            { home:'Bragantino',   away:'Remo',           hs:null,as:null, date:'02-04/05', status:'finished' },
            { home:'Cruzeiro',     away:'Grêmio',         hs:null,as:null, date:'02-04/05', status:'finished' },
            { home:'Internacional',away:'Mirassol',       hs:null,as:null, date:'02-04/05', status:'finished' },
            { home:'Coritiba',     away:'Atlético-MG',    hs:null,as:null, date:'02-04/05', status:'finished' },
            { home:'Vitória',      away:'Corinthians',    hs:null,as:null, date:'02-04/05', status:'finished' },
            { home:'Chapecoense',  away:'Botafogo',       hs:null,as:null, date:'02-04/05', status:'finished' },
        ],
        13: [
            { home:'Fluminense',   away:'Chapecoense',    hs:null,as:null, date:'09-11/05', status:'finished' },
            { home:'Botafogo',     away:'Internacional',  hs:null,as:null, date:'09-11/05', status:'finished' },
            { home:'São Paulo',    away:'Mirassol',       hs:null,as:null, date:'09-11/05', status:'finished' },
            { home:'Corinthians',  away:'Vasco',          hs:null,as:null, date:'09-11/05', status:'finished' },
            { home:'Bragantino',   away:'Palmeiras',      hs:null,as:null, date:'09-11/05', status:'finished' },
            { home:'Atlético-MG',  away:'Flamengo',       hs:0,   as:4,   date:'26/04', status:'finished' },
            { home:'Grêmio',       away:'Coritiba',       hs:null,as:null, date:'09-11/05', status:'finished' },
            { home:'Athletico-PR', away:'Vitória',        hs:null,as:null, date:'09-11/05', status:'finished' },
            { home:'Bahia',        away:'Santos',         hs:null,as:null, date:'09-11/05', status:'finished' },
            { home:'Remo',         away:'Cruzeiro',       hs:null,as:null, date:'09-11/05', status:'finished' },
        ],
        14: [
            { home:'Flamengo',     away:'Vasco',          hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Botafogo',     away:'Remo',           hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'São Paulo',    away:'Bahia',          hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Palmeiras',    away:'Santos',         hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Mirassol',     away:'Corinthians',    hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Cruzeiro',     away:'Atlético-MG',    hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Internacional',away:'Fluminense',     hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Athletico-PR', away:'Grêmio',         hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Vitória',      away:'Coritiba',       hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Chapecoense',  away:'Bragantino',     hs:null,as:null, date:'16-18/05', status:'finished' },
        ],
        15: [
            { home:'Fluminense',   away:'Vitória',        hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Vasco',        away:'Athletico-PR',   hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Santos',       away:'Bragantino',     hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Corinthians',  away:'São Paulo',      hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Mirassol',     away:'Chapecoense',    hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Atlético-MG',  away:'Botafogo',       hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Grêmio',       away:'Flamengo',       hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Coritiba',     away:'Internacional',  hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Bahia',        away:'Cruzeiro',       hs:null,as:null, date:'16-18/05', status:'finished' },
            { home:'Remo',         away:'Palmeiras',      hs:null,as:null, date:'16-18/05', status:'finished' },
        ],
        16: [
            { home:'Fluminense',   away:'São Paulo',      hs:null,as:null, date:'23-25/05', status:'finished' },
            { home:'Botafogo',     away:'Corinthians',    hs:3,   as:3,   date:'17/05', status:'finished' },
            { home:'Santos',       away:'Coritiba',       hs:null,as:null, date:'23-25/05', status:'finished' },
            { home:'Palmeiras',    away:'Cruzeiro',       hs:null,as:null, date:'23-25/05', status:'finished' },
            { home:'Bragantino',   away:'Vitória',        hs:null,as:null, date:'23-25/05', status:'finished' },
            { home:'Atlético-MG',  away:'Mirassol',       hs:null,as:null, date:'23-25/05', status:'finished' },
            { home:'Internacional',away:'Vasco',          hs:null,as:null, date:'23-25/05', status:'finished' },
            { home:'Athletico-PR', away:'Flamengo',       hs:null,as:null, date:'23-25/05', status:'finished' },
            { home:'Bahia',        away:'Grêmio',         hs:null,as:null, date:'23-25/05', status:'finished' },
            { home:'Chapecoense',  away:'Remo',           hs:null,as:null, date:'23-25/05', status:'finished' },
        ],
        17: [
            { home:'Flamengo',     away:'Palmeiras',      hs:0,  as:3,  date:'23/05', status:'finished' },
            { home:'Vasco',        away:'Bragantino',     hs:0,  as:3,  date:'24/05', status:'finished' },
            { home:'São Paulo',    away:'Botafogo',       hs:1,  as:1,  date:'22/05', status:'finished' },
            { home:'Corinthians',  away:'Atlético-MG',   hs:1,  as:0,  date:'24/05', status:'finished' },
            { home:'Mirassol',     away:'Fluminense',    hs:1,  as:0,  date:'22/05', status:'finished' },
            { home:'Cruzeiro',     away:'Chapecoense',   hs:2,  as:1,  date:'24/05', status:'finished' },
            { home:'Grêmio',       away:'Santos',        hs:3,  as:2,  date:'23/05', status:'finished' },
            { home:'Coritiba',     away:'Bahia',         hs:3,  as:2,  date:'25/05', status:'finished' },
            { home:'Vitória',      away:'Internacional', hs:2,  as:0,  date:'22/05', status:'finished' },
            { home:'Remo',         away:'Athletico-PR',  hs:1,  as:2,  date:'24/05', status:'finished' },
        ],
        18: [
            { home:'Flamengo',     away:'Coritiba',      hs:3,  as:0,  date:'30/05', status:'finished' },
            { home:'Vasco',        away:'Atlético-MG',   hs:0,  as:1,  date:'31/05', status:'finished' },
            { home:'Santos',       away:'Vitória',       hs:3,  as:1,  date:'30/05', status:'finished' },
            { home:'Palmeiras',    away:'Chapecoense',   hs:1,  as:0,  date:'31/05', status:'finished' },
            { home:'Bragantino',   away:'Internacional', hs:3,  as:1,  date:'31/05', status:'finished' },
            { home:'Cruzeiro',     away:'Fluminense',    hs:1,  as:1,  date:'31/05', status:'finished' },
            { home:'Grêmio',       away:'Corinthians',   hs:1,  as:3,  date:'30/05', status:'finished' },
            { home:'Athletico-PR', away:'Mirassol',      hs:1,  as:0,  date:'30/05', status:'finished' },
            { home:'Bahia',        away:'Botafogo',      hs:2,  as:1,  date:'30/05', status:'finished' },
            { home:'Remo',         away:'São Paulo',     hs:1,  as:0,  date:'31/05', status:'finished' },
        ],
        // Rodadas futuras — pausa Copa do Mundo (jun-jul), retorno 22-23/07
        19: [
            { home:'Fluminense',   away:'Bragantino',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Internacional',away:'Cruzeiro',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Palmeiras',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Vasco',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Chapecoense',  away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        20: [
            { home:'Flamengo',     away:'São Paulo',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Santos',       away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Atlético-MG',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Coritiba',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Botafogo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Grêmio',       away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Athletico-PR', away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bahia',        away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        21: [
            { home:'Fluminense',   away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Bragantino',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Internacional',away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Cruzeiro',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Palmeiras',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Chapecoense',  away:'Vasco',         hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        22: [
            { home:'Flamengo',     away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Santos',       away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Grêmio',       away:'São Paulo',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bahia',        away:'Vasco',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'Atlético-MG',   hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        23: [
            { home:'Fluminense',   away:'Palmeiras',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Coritiba',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Cruzeiro',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Internacional',away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Athletico-PR', away:'Bragantino',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Botafogo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Chapecoense',  away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        24: [
            { home:'Fluminense',   away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Santos',       away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Vasco',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Internacional',away:'Atlético-MG',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Chapecoense',  away:'São Paulo',     hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        25: [
            { home:'Flamengo',     away:'Botafogo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Cruzeiro',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Bragantino',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'Palmeiras',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Grêmio',       away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Athletico-PR', away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bahia',        away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'Coritiba',      hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        26: [
            { home:'Fluminense',   away:'Vasco',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Palmeiras',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Atlético-MG',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Internacional',away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        27: [
            { home:'Flamengo',     away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Bragantino',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Santos',       away:'Cruzeiro',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'São Paulo',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Grêmio',       away:'Vasco',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bahia',        away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Chapecoense',  away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        28: [
            { home:'Flamengo',     away:'Bragantino',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Coritiba',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'Botafogo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Grêmio',       away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Athletico-PR', away:'Palmeiras',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'Cruzeiro',      hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        29: [
            { home:'Fluminense',   away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'São Paulo',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Santos',       away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Chapecoense',  away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        30: [
            { home:'Flamengo',     away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Santos',       away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Coritiba',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bahia',        away:'Palmeiras',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'Botafogo',      hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        31: [
            { home:'Fluminense',   away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Atlético-MG',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Bragantino',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'São Paulo',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Athletico-PR', away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Chapecoense',  away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        32: [
            { home:'Flamengo',     away:'Atlético-MG',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Vasco',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Santos',       away:'Cruzeiro',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Grêmio',       away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Athletico-PR', away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Chapecoense',  away:'São Paulo',     hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        33: [
            { home:'Fluminense',   away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Palmeiras',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Athletico-PR', away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bahia',        away:'Coritiba',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'Botafogo',      hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        34: [
            { home:'Flamengo',     away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Atlético-MG',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Santos',       away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Vasco',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Internacional',away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Bragantino',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Grêmio',       away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'São Paulo',     hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        35: [
            { home:'Fluminense',   away:'Coritiba',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Cruzeiro',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Athletico-PR', away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'Botafogo',      hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        36: [
            { home:'Flamengo',     away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Cruzeiro',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Corinthians',  away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Grêmio',       away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Internacional',away:'Coritiba',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Atlético-MG',  away:'Vasco',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bahia',        away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Chapecoense',  away:'Palmeiras',     hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Remo',         away:'Bragantino',    hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        37: [
            { home:'Fluminense',   away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Santos',       away:'Grêmio',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Atlético-MG',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Athletico-PR',  hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Internacional',away:'Botafogo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Coritiba',     away:'Bahia',         hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vitória',      away:'Flamengo',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Mirassol',     away:'São Paulo',     hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
        38: [
            { home:'Flamengo',     away:'Internacional', hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Botafogo',     away:'Chapecoense',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'São Paulo',    away:'Corinthians',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Palmeiras',    away:'Vitória',       hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bragantino',   away:'Mirassol',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Cruzeiro',     away:'Remo',          hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Grêmio',       away:'Atlético-MG',   hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Athletico-PR', away:'Coritiba',      hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Bahia',        away:'Santos',        hs:null,as:null, date:'TBD', status:'scheduled' },
            { home:'Vasco',        away:'Fluminense',    hs:null,as:null, date:'TBD', status:'scheduled' },
        ],
    },

    load() { Jogos.render(); },

    render() {
        const list = document.getElementById('jogos-list');
        const loading = document.getElementById('jogos-loading');
        if (loading) loading.style.display = 'none';
        if (!list) return;

        const r = Jogos.currentRound;
        const games = Jogos.allRounds[r] || [];

        const clubMap = {
            'Flamengo':'FLA','Palmeiras':'PAL','Botafogo':'BOT','Cruzeiro':'CRU',
            'Bahia':'BAH','São Paulo':'SPFC','Atlético-MG':'CAM','Corinthians':'COR',
            'Grêmio':'GRE','Fluminense':'FLU','Vasco':'VAS','Internacional':'INT',
            'Bragantino':'BRA','Mirassol':'MIR','Athletico-PR':'ATH','Coritiba':'COT',
            'Chapecoense':'CHE','Remo':'REM','Vitória':'VIT','Santos':'SAN'
        };

        const isFuture = r > 18;
        const pauseRounds = r >= 19 && r <= 21;

        list.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;gap:12px;">
                <button class="action-btn" onclick="Jogos.goRound(-1)" ${r<=1?'disabled':''} style="padding:8px 16px;">
                    <i class="fa-solid fa-chevron-left"></i> Anterior
                </button>
                <div style="text-align:center;">
                    <div style="font-size:18px;font-weight:800;">${r <= 18 ? 'Rodada '+r : 'Rodada '+r}</div>
                    <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
                        ${r<=18 ? '1º Turno — Brasileirão 2026' : '2º Turno — Brasileirão 2026'}
                    </div>
                </div>
                <button class="action-btn" onclick="Jogos.goRound(1)" ${r>=38?'disabled':''} style="padding:8px 16px;">
                    Próxima <i class="fa-solid fa-chevron-right"></i>
                </button>
            </div>

            ${pauseRounds ? `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:14px;
                background:rgba(255,159,67,0.06);border:1px solid rgba(255,159,67,0.2);border-radius:8px;">
                <i class="fa-solid fa-globe" style="color:var(--neon-orange);"></i>
                <span style="font-size:12px;color:var(--text-muted);">Pausa para a Copa do Mundo (junho/julho 2026). Retorno previsto em julho/agosto.</span>
            </div>` : ''}

            ${games.map(g => {
                const hc = clubMap[g.home]||'';
                const ac = clubMap[g.away]||'';
                const done = g.status==='finished' && g.hs!==null;

                const middle = done
                    ? `<div class="jogo-score">${g.hs} - ${g.as}</div>`
                    : `<div class="jogo-score" style="font-size:13px;color:var(--text-muted);">${g.date||'TBD'}</div>`;

                return `<div class="jogo-card">
                    <div class="jogo-team ${hc?'has-players':''}">
                        ${hc?`<span class="jogo-club-badge">${hc}</span>`:''}
                        <span class="jogo-team-name">${g.home}</span>
                    </div>
                    ${middle}
                    <div class="jogo-team away ${ac?'has-players':''}">
                        <span class="jogo-team-name">${g.away}</span>
                        ${ac?`<span class="jogo-club-badge">${ac}</span>`:''}
                    </div>
                </div>`;
            }).join('')}

            <p style="font-size:11px;color:var(--text-muted);margin-top:16px;text-align:center;">
                <i class="fa-solid fa-circle-info"></i> Tabela oficial CBF 2026
            </p>`;
    },

    goRound(dir) {
        const next = Jogos.currentRound + dir;
        if (next<1||next>38) return;
        Jogos.currentRound = next;
        Jogos.render();
    }
};
