// =============================================
// ARENA FANTASY - Base de Jogadores
// Brasileirão Série A 2026 — elencos completos
// Atualizado: maio/2026
// =============================================

const PLAYERS_DATABASE = [

    // ================================================ FLAMENGO (FLA)
    // GOL: Rossi, Andrew, Dyogo Alves
    // DEF: Varela, Emerson Royal, Léo Pereira, Léo Ortiz, Vitão, João Victor, Ayrton Lucas, Alex Sandro, Danilo
    // MEI: Pulgar, Arrascaeta, De la Cruz, Saúl Ñíguez, Lucas Paquetá, Carrascal, Jorginho, Evertton Araújo
    // ATA: Pedro, Everton Cebolinha, Luiz Araújo, Samuel Lino, Gonzalo Plata, Bruno Henrique, Wallace Yan
    // ================================================
    { id: 1,   name: "Rossi",            club: "FLA", position: "GOL", cost: 15, projPoints: 6.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 2,   name: "Andrew",           club: "FLA", position: "GOL", cost: 9,  projPoints: 3.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 3,   name: "Dyogo Alves",      club: "FLA", position: "GOL", cost: 7,  projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 4,   name: "Guillermo Varela", club: "FLA", position: "LAT", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 5,   name: "Emerson Royal",    club: "FLA", position: "LAT", cost: 13, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 6,   name: "Léo Pereira",      club: "FLA", position: "ZAG", cost: 13, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 7,   name: "Léo Ortiz",        club: "FLA", position: "ZAG", cost: 14, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 8,   name: "Vitão",            club: "FLA", position: "ZAG", cost: 13, projPoints: 5.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 9,   name: "João Victor",      club: "FLA", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 10,  name: "Ayrton Lucas",     club: "FLA", position: "LAT", cost: 14, projPoints: 6.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 11,  name: "Alex Sandro",      club: "FLA", position: "LAT", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 12,  name: "Danilo",           club: "FLA", position: "ZAG", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 13,  name: "Arrascaeta",       club: "FLA", position: "MEI", cost: 20, projPoints: 8.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 14,  name: "De la Cruz",       club: "FLA", position: "MEI", cost: 16, projPoints: 7.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 15,  name: "Lucas Paquetá",    club: "FLA", position: "MEI", cost: 18, projPoints: 7.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 16,  name: "Carrascal",        club: "FLA", position: "MEI", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 17,  name: "Jorginho",         club: "FLA", position: "MEI", cost: 13, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 18,  name: "Pulgar",           club: "FLA", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 19,  name: "Evertton Araújo",  club: "FLA", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 20,  name: "Saúl Ñíguez",      club: "FLA", position: "MEI", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 21,  name: "Pedro",            club: "FLA", position: "ATA", cost: 22, projPoints: 9.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 22,  name: "Everton Cebolinha",club: "FLA", position: "ATA", cost: 14, projPoints: 6.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 23,  name: "Luiz Araújo",      club: "FLA", position: "ATA", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 24,  name: "Samuel Lino",      club: "FLA", position: "ATA", cost: 14, projPoints: 6.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 25,  name: "Gonzalo Plata",    club: "FLA", position: "ATA", cost: 14, projPoints: 6.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 26,  name: "Bruno Henrique",   club: "FLA", position: "ATA", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 27,  name: "Wallace Yan",      club: "FLA", position: "ATA", cost: 10, projPoints: 4.5, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ PALMEIRAS (PAL)
    // GOL: Carlos Miguel, Marcelo Lomba, Aranha
    // DEF: Giay, Khellven, Gómez, Murilo, Bruno Fuchs, Benedetti, Piquerez, Jefté
    // MEI: Marlon Freitas, Andreas Pereira, Felipe Anderson, Jhon Arias, Mauricio, Allan, Lucas Evangelista, Raphael Veiga, Emiliano Martínez, Larson
    // ATA: Vitor Roque, Flaco López, Ramón Sosa, Paulinho, Luighi, Bruno Rodrigues
    // ================================================
    { id: 28,  name: "Carlos Miguel",    club: "PAL", position: "GOL", cost: 13, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 29,  name: "Marcelo Lomba",    club: "PAL", position: "GOL", cost: 8,  projPoints: 3.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 30,  name: "Aranha",           club: "PAL", position: "GOL", cost: 7,  projPoints: 3.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 31,  name: "Agustín Giay",     club: "PAL", position: "LAT", cost: 12, projPoints: 5.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 32,  name: "Khellven",         club: "PAL", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 33,  name: "Gustavo Gómez",    club: "PAL", position: "ZAG", cost: 15, projPoints: 6.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 34,  name: "Murilo",           club: "PAL", position: "ZAG", cost: 13, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 35,  name: "Bruno Fuchs",      club: "PAL", position: "ZAG", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 36,  name: "Benedetti",        club: "PAL", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 37,  name: "Piquerez",         club: "PAL", position: "LAT", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 38,  name: "Jefté",            club: "PAL", position: "LAT", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 39,  name: "Marlon Freitas",   club: "PAL", position: "MEI", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 40,  name: "Andreas Pereira",  club: "PAL", position: "MEI", cost: 16, projPoints: 7.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 41,  name: "Felipe Anderson",  club: "PAL", position: "MEI", cost: 14, projPoints: 6.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 42,  name: "Jhon Arias",       club: "PAL", position: "MEI", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 43,  name: "Mauricio",         club: "PAL", position: "MEI", cost: 14, projPoints: 6.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 44,  name: "Allan",            club: "PAL", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 45,  name: "Lucas Evangelista",club: "PAL", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 46,  name: "Raphael Veiga",    club: "PAL", position: "MEI", cost: 16, projPoints: 7.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 47,  name: "Emiliano Martínez",club: "PAL", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 48,  name: "Larson",           club: "PAL", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 49,  name: "Vitor Roque",      club: "PAL", position: "ATA", cost: 22, projPoints: 9.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 50,  name: "Flaco López",      club: "PAL", position: "ATA", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 51,  name: "Ramón Sosa",       club: "PAL", position: "ATA", cost: 14, projPoints: 6.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 52,  name: "Paulinho",         club: "PAL", position: "ATA", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 53,  name: "Luighi",           club: "PAL", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 54,  name: "Bruno Rodrigues",  club: "PAL", position: "ATA", cost: 10, projPoints: 4.5, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ BOTAFOGO (BOT)
    // Igor Jesus saiu (Nottingham), Marlon Freitas saiu (Palmeiras), Thiago Almada saiu
    // Chegaram: Arthur Cabral, Lucas Villalba, Cristian Medina, Álvaro Montoro
    // ================================================
    { id: 55,  name: "John",             club: "BOT", position: "GOL", cost: 13, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 56,  name: "Gabriel Brazão",   club: "BOT", position: "GOL", cost: 8,  projPoints: 3.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 57,  name: "Alexander Barboza",club: "BOT", position: "ZAG", cost: 12, projPoints: 5.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 58,  name: "Riquelme",         club: "BOT", position: "ZAG", cost: 9,  projPoints: 4.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 59,  name: "Ythallo",          club: "BOT", position: "ZAG", cost: 9,  projPoints: 3.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 60,  name: "Vitinho",          club: "BOT", position: "LAT", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 61,  name: "Jhoan Hernández",  club: "BOT", position: "LAT", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 62,  name: "Marçal",           club: "BOT", position: "LAT", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 63,  name: "Danilo",           club: "BOT", position: "MEI", cost: 14, projPoints: 6.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 64,  name: "Cristian Medina",  club: "BOT", position: "MEI", cost: 14, projPoints: 6.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 65,  name: "Álvaro Montoro",   club: "BOT", position: "MEI", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 66,  name: "Wallace Davi",     club: "BOT", position: "MEI", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 67,  name: "Nathan Fernandes", club: "BOT", position: "MEI", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 68,  name: "Savarino",         club: "BOT", position: "ATA", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 69,  name: "Arthur Cabral",    club: "BOT", position: "ATA", cost: 16, projPoints: 6.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 70,  name: "Luiz Henrique",    club: "BOT", position: "ATA", cost: 18, projPoints: 7.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 71,  name: "Lucas Villalba",   club: "BOT", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 72,  name: "Artur",            club: "BOT", position: "ATA", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ CRUZEIRO (CRU)
    // ================================================
    { id: 73,  name: "Cássio",           club: "CRU", position: "GOL", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 74,  name: "Anderson",         club: "CRU", position: "GOL", cost: 7,  projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 75,  name: "Fabrício Bruno",   club: "CRU", position: "ZAG", cost: 13, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 76,  name: "Jonathan Jesus",   club: "CRU", position: "ZAG", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 77,  name: "Zé Ivaldo",        club: "CRU", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 78,  name: "William",          club: "CRU", position: "LAT", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 79,  name: "Kaiki",            club: "CRU", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 80,  name: "Marlon",           club: "CRU", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 81,  name: "Lucas Silva",      club: "CRU", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 82,  name: "Lucas Romero",     club: "CRU", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 83,  name: "Gerson",           club: "CRU", position: "MEI", cost: 18, projPoints: 7.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 84,  name: "Matheus Pereira",  club: "CRU", position: "MEI", cost: 17, projPoints: 7.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 85,  name: "Wanderson",        club: "CRU", position: "ATA", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 86,  name: "Kaio Jorge",       club: "CRU", position: "ATA", cost: 19, projPoints: 8.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 87,  name: "Arroyo",           club: "CRU", position: "ATA", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 88,  name: "Gabriel Veron",    club: "CRU", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ BAHIA (BAH)
    // Cauly emprestado ao SP, Everaldo emprestado ao Fluminense
    // Chegaram: Cristian Olivera (Grêmio, emprestado), Román Gómez
    // ================================================
    { id: 89,  name: "Marcos Felipe",    club: "BAH", position: "GOL", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 90,  name: "João Paulo",       club: "BAH", position: "GOL", cost: 8,  projPoints: 3.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 91,  name: "Gabriel Xavier",   club: "BAH", position: "ZAG", cost: 12, projPoints: 5.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 92,  name: "Kanu",             club: "BAH", position: "ZAG", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 93,  name: "Román Gómez",      club: "BAH", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 94,  name: "Luciano Juba",     club: "BAH", position: "LAT", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 95,  name: "Santiago Arias",   club: "BAH", position: "LAT", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 96,  name: "Luiz Gustavo",     club: "BAH", position: "ZAG", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 97,  name: "Acevedo",          club: "BAH", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 98,  name: "Everton Ribeiro",  club: "BAH", position: "MEI", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 99,  name: "Michel Araújo",    club: "BAH", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 100, name: "Cristian Olivera", club: "BAH", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 101, name: "Vitinho",          club: "BAH", position: "MEI", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 102, name: "Willian José",     club: "BAH", position: "ATA", cost: 14, projPoints: 6.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 103, name: "Iago",             club: "BAH", position: "ATA", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 104, name: "Kayky",            club: "BAH", position: "ATA", cost: 10, projPoints: 4.5, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ SÃO PAULO (SPFC)
    // Cauly chegou emprestado do Bahia, Danielzinho chegou do Mirassol
    // ================================================
    { id: 105, name: "Rafael",           club: "SPFC", position: "GOL", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 106, name: "Young",            club: "SPFC", position: "GOL", cost: 7,  projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 107, name: "Arboleda",         club: "SPFC", position: "ZAG", cost: 12, projPoints: 5.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 108, name: "Alan Franco",      club: "SPFC", position: "ZAG", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 109, name: "Sabino",           club: "SPFC", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 110, name: "Diaz",             club: "SPFC", position: "ZAG", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 111, name: "Welington",        club: "SPFC", position: "LAT", cost: 12, projPoints: 5.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 112, name: "Maik",             club: "SPFC", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 113, name: "Igor Vinícius",    club: "SPFC", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 114, name: "Marcos Antonio",   club: "SPFC", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 115, name: "Luciano",          club: "SPFC", position: "MEI", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 116, name: "Danielzinho",      club: "SPFC", position: "MEI", cost: 12, projPoints: 5.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 117, name: "Bobadilla",        club: "SPFC", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 118, name: "Cauly",            club: "SPFC", position: "MEI", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 119, name: "Oscar",            club: "SPFC", position: "MEI", cost: 12, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 120, name: "Calleri",          club: "SPFC", position: "ATA", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 121, name: "André Silva",      club: "SPFC", position: "ATA", cost: 12, projPoints: 5.4, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ ATLÉTICO MINEIRO (CAM)
    // Hulk saiu (Fluminense), Dudu saiu
    // Victor Hugo artilheiro do Galo em 2026
    // ================================================
    { id: 122, name: "Everson",          club: "CAM", position: "GOL", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 123, name: "Matheus Mendes",   club: "CAM", position: "GOL", cost: 7,  projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 124, name: "Ruan",             club: "CAM", position: "ZAG", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 125, name: "Vitor Hugo",       club: "CAM", position: "ZAG", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 126, name: "Guilherme Arana",  club: "CAM", position: "LAT", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 127, name: "Renan Lodi",       club: "CAM", position: "LAT", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 128, name: "Preciado",         club: "CAM", position: "LAT", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 129, name: "Alisson",          club: "CAM", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 130, name: "Maycon",           club: "CAM", position: "MEI", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 131, name: "Bernard",          club: "CAM", position: "MEI", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 132, name: "Cuello",           club: "CAM", position: "MEI", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 133, name: "Alan Kardec",      club: "CAM", position: "ATA", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 134, name: "Victor Hugo",      club: "CAM", position: "ATA", cost: 14, projPoints: 6.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 135, name: "Bruninho",         club: "CAM", position: "ATA", cost: 10, projPoints: 4.5, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ CORINTHIANS (COR)
    // Memphis Depay ainda no clube (contrato até jun/2026)
    // ================================================
    { id: 136, name: "Hugo Souza",       club: "COR", position: "GOL", cost: 12, projPoints: 5.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 137, name: "Matheus Donelli",  club: "COR", position: "GOL", cost: 8,  projPoints: 3.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 138, name: "Félix Torres",     club: "COR", position: "ZAG", cost: 12, projPoints: 5.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 139, name: "André Ramalho",    club: "COR", position: "ZAG", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 140, name: "Gustavo Henrique", club: "COR", position: "ZAG", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 141, name: "Matheuzinho",      club: "COR", position: "LAT", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 142, name: "Matheus Bidu",     club: "COR", position: "LAT", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 143, name: "Rodrigo Garro",    club: "COR", position: "MEI", cost: 17, projPoints: 7.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 144, name: "Charles",          club: "COR", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 145, name: "Raniele",          club: "COR", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 146, name: "Bidon",            club: "COR", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 147, name: "Carrillo",         club: "COR", position: "MEI", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 148, name: "Memphis Depay",    club: "COR", position: "ATA", cost: 16, projPoints: 7.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 149, name: "Yuri Alberto",     club: "COR", position: "ATA", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 150, name: "Talles Magno",     club: "COR", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ GRÊMIO (GRE)
    // Weverton chegou (do Palmeiras), Caio Paulista chegou (emprestado Palmeiras)
    // Tetê, Amuzu confirmados jogando 2026
    // ================================================
    { id: 151, name: "Weverton",         club: "GRE", position: "GOL", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 152, name: "Grando",           club: "GRE", position: "GOL", cost: 8,  projPoints: 3.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 153, name: "Gustavo Martins",  club: "GRE", position: "ZAG", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 154, name: "Wagner Leonardo",  club: "GRE", position: "ZAG", cost: 11, projPoints: 4.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 155, name: "Kannemann",        club: "GRE", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 156, name: "Caio Paulista",    club: "GRE", position: "LAT", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 157, name: "Marcos Rocha",     club: "GRE", position: "LAT", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 158, name: "Reinaldo",         club: "GRE", position: "LAT", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 159, name: "Edenilson",        club: "GRE", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 160, name: "Cristaldo",        club: "GRE", position: "MEI", cost: 14, projPoints: 6.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 161, name: "Monsalve",         club: "GRE", position: "MEI", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 162, name: "Dodi",             club: "GRE", position: "MEI", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 163, name: "Carlos Vinícius",  club: "GRE", position: "ATA", cost: 16, projPoints: 7.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 164, name: "Tetê",             club: "GRE", position: "ATA", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 165, name: "Amuzu",            club: "GRE", position: "ATA", cost: 12, projPoints: 5.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 166, name: "Aravena",          club: "GRE", position: "ATA", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ FLUMINENSE (FLU)
    // Hulk chegou do Atlético-MG, Ganso ainda no elenco
    // Savarino confirmado jogando, Everaldo emprestado do Bahia
    // ================================================
    { id: 167, name: "Fábio",            club: "FLU", position: "GOL", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 168, name: "Vitor Eudes",      club: "FLU", position: "GOL", cost: 7,  projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 169, name: "Freytes",          club: "FLU", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 170, name: "Jemmes",           club: "FLU", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 171, name: "Ignácio",          club: "FLU", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 172, name: "Samuel Xavier",    club: "FLU", position: "LAT", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 173, name: "Diogo Barbosa",    club: "FLU", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 174, name: "Renê",             club: "FLU", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 175, name: "Bernal",           club: "FLU", position: "MEI", cost: 12, projPoints: 5.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 176, name: "Martinelli",       club: "FLU", position: "MEI", cost: 13, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 177, name: "Hércules",         club: "FLU", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 178, name: "Ganso",            club: "FLU", position: "MEI", cost: 13, projPoints: 5.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 179, name: "Savarino",         club: "FLU", position: "MEI", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 180, name: "Lima",             club: "FLU", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 181, name: "Canobbio",         club: "FLU", position: "ATA", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 182, name: "Everaldo",         club: "FLU", position: "ATA", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 183, name: "Germán Cano",      club: "FLU", position: "ATA", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 184, name: "Hulk",             club: "FLU", position: "ATA", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ VASCO (VAS)
    // Vegetti saiu (Cerro Porteño), Coutinho rescindiu, Payet saiu
    // Brenner chegou, Rayan destaque
    // ================================================
    { id: 185, name: "Léo Jardim",       club: "VAS", position: "GOL", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 186, name: "Keiller",          club: "VAS", position: "GOL", cost: 7,  projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 187, name: "João Victor",      club: "VAS", position: "ZAG", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 188, name: "Maicon",           club: "VAS", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 189, name: "Paulo Henrique",   club: "VAS", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 190, name: "Lucas Piton",      club: "VAS", position: "LAT", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 191, name: "Puma Rodríguez",   club: "VAS", position: "LAT", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 192, name: "Victor Luis",      club: "VAS", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 193, name: "Guga",             club: "VAS", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 194, name: "Mateus Cocão",     club: "VAS", position: "MEI", cost: 9,  projPoints: 4.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 195, name: "Hugo Moura",       club: "VAS", position: "MEI", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 196, name: "Cuesta",           club: "VAS", position: "ZAG", cost: 10, projPoints: 4.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 197, name: "Rayan",            club: "VAS", position: "ATA", cost: 15, projPoints: 6.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 198, name: "Brenner",          club: "VAS", position: "ATA", cost: 14, projPoints: 6.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 199, name: "Spinelli",         club: "VAS", position: "ATA", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ INTERNACIONAL (INT)
    // Vitão saiu (Flamengo), Félix Torres chegou
    // ================================================
    { id: 200, name: "Rochet",           club: "INT", position: "GOL", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 201, name: "Kauan Canned",     club: "INT", position: "GOL", cost: 7,  projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 202, name: "Félix Torres",     club: "INT", position: "ZAG", cost: 12, projPoints: 5.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 203, name: "Mercado",          club: "INT", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 204, name: "Clayton Sampaio",  club: "INT", position: "ZAG", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 205, name: "Bernabei",         club: "INT", position: "LAT", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 206, name: "Bruno Gomes",      club: "INT", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 207, name: "Thiago Maia",      club: "INT", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 208, name: "Alan Patrick",     club: "INT", position: "MEI", cost: 16, projPoints: 7.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 209, name: "Rodrigo Villagra", club: "INT", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 210, name: "Bruno Henrique",   club: "INT", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 211, name: "Borré",            club: "INT", position: "ATA", cost: 14, projPoints: 6.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 212, name: "Wesley",           club: "INT", position: "ATA", cost: 14, projPoints: 6.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 213, name: "Vitinho",          club: "INT", position: "ATA", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 214, name: "Carbonero",        club: "INT", position: "ATA", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ RED BULL BRAGANTINO (BRA)
    // ================================================
    { id: 215, name: "Cleiton",          club: "BRA", position: "GOL", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 216, name: "Vinícius Silvestre",club: "BRA", position: "GOL", cost: 7, projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 217, name: "Luan Cândido",     club: "BRA", position: "ZAG", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 218, name: "Eduardo Santos",   club: "BRA", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 219, name: "Pedro Henrique",   club: "BRA", position: "ZAG", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 220, name: "Juninho Capixaba", club: "BRA", position: "LAT", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 221, name: "Andrés Hurtado",   club: "BRA", position: "LAT", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 222, name: "Jhon Jhon",        club: "BRA", position: "MEI", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 223, name: "Eric Ramires",     club: "BRA", position: "MEI", cost: 12, projPoints: 5.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 224, name: "Matheus Fernandes",club: "BRA", position: "MEI", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 225, name: "Lucas Evangelista",club: "BRA", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 226, name: "Eduardo Sasha",    club: "BRA", position: "ATA", cost: 13, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 227, name: "Thiago Borbas",    club: "BRA", position: "ATA", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 228, name: "Vitinho",          club: "BRA", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ MIRASSOL (MIR)
    // Lucas Mugni, Luiz Otávio saíram. Chegaram: Tiquinho Soares (emprestado Santos), Galeano
    // ================================================
    { id: 229, name: "Walter",           club: "MIR", position: "GOL", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 230, name: "Alex Muralha",     club: "MIR", position: "GOL", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 231, name: "João Victor",      club: "MIR", position: "ZAG", cost: 10, projPoints: 4.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 232, name: "Daniel Borges",    club: "MIR", position: "LAT", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 233, name: "Reinaldo",         club: "MIR", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 234, name: "Neto Moura",       club: "MIR", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 235, name: "Yuri Lara",        club: "MIR", position: "MEI", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 236, name: "Shaylon",          club: "MIR", position: "MEI", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 237, name: "Antonio Galeano",  club: "MIR", position: "MEI", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 238, name: "Alesson",          club: "MIR", position: "ATA", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 239, name: "André Luís",       club: "MIR", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 240, name: "Tiquinho Soares",  club: "MIR", position: "ATA", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ ATHLETICO-PR (ATH)
    // Bento confirmado goleiro titular
    // ================================================
    { id: 241, name: "Bento",            club: "ATH", position: "GOL", cost: 14, projPoints: 5.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 242, name: "Santos",           club: "ATH", position: "GOL", cost: 8,  projPoints: 3.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 243, name: "Benavídez",        club: "ATH", position: "ZAG", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 244, name: "Carlos Terán",     club: "ATH", position: "ZAG", cost: 11, projPoints: 4.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 245, name: "Gamarra",          club: "ATH", position: "ZAG", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 246, name: "Arthur Dias",      club: "ATH", position: "LAT", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 247, name: "Lucas Esquivel",   club: "ATH", position: "LAT", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 248, name: "Jadson",           club: "ATH", position: "MEI", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 249, name: "Portilla",         club: "ATH", position: "MEI", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 250, name: "Felipinho",        club: "ATH", position: "MEI", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 251, name: "Bruno Zapelli",    club: "ATH", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 252, name: "Mastriani",        club: "ATH", position: "ATA", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 253, name: "Kevin Viveros",    club: "ATH", position: "ATA", cost: 18, projPoints: 7.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 254, name: "Julimar",          club: "ATH", position: "ATA", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ CORITIBA (COT)
    // ================================================
    { id: 255, name: "Neto",             club: "COT", position: "GOL", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 256, name: "Alex",             club: "COT", position: "GOL", cost: 7,  projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 257, name: "Newton",           club: "COT", position: "ZAG", cost: 10, projPoints: 4.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 258, name: "Bastos",           club: "COT", position: "ZAG", cost: 10, projPoints: 4.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 259, name: "Tinga",            club: "COT", position: "ZAG", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 260, name: "Alex Telles",      club: "COT", position: "LAT", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 261, name: "Vitinho",          club: "COT", position: "LAT", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 262, name: "Allan",            club: "COT", position: "MEI", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 263, name: "Álvaro Montoro",   club: "COT", position: "MEI", cost: 12, projPoints: 5.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 264, name: "Danilo Avelar",    club: "COT", position: "MEI", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 265, name: "Artur",            club: "COT", position: "ATA", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 266, name: "Pedro Rocha",      club: "COT", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 267, name: "Breno Lopes",      club: "COT", position: "ATA", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ CHAPECOENSE (CHE)
    // ================================================
    { id: 268, name: "Gabriel Vasconcellos", club: "CHE", position: "GOL", cost: 9, projPoints: 4.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 269, name: "Camutanga",        club: "CHE", position: "ZAG", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 270, name: "Riccieli",         club: "CHE", position: "ZAG", cost: 9,  projPoints: 3.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 271, name: "Matheuzinho CHA",  club: "CHE", position: "LAT", cost: 9,  projPoints: 3.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 272, name: "Gabriel Baralhas", club: "CHE", position: "MEI", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 273, name: "Aitor Cantalapiedra", club: "CHE", position: "MEI", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 274, name: "Ronald",           club: "CHE", position: "MEI", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 275, name: "Erick",            club: "CHE", position: "MEI", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 276, name: "Renato Kayzer",    club: "CHE", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 277, name: "Carbone",          club: "CHE", position: "ATA", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ REMO (REM)
    // ================================================
    { id: 278, name: "Vinícius",         club: "REM", position: "GOL", cost: 9,  projPoints: 3.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 279, name: "Romário Bispo",    club: "REM", position: "ZAG", cost: 9,  projPoints: 3.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 280, name: "Ligger",           club: "REM", position: "ZAG", cost: 8,  projPoints: 3.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 281, name: "Carlinhos",        club: "REM", position: "LAT", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 282, name: "Jaderson",         club: "REM", position: "MEI", cost: 10, projPoints: 4.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 283, name: "Pavani",           club: "REM", position: "MEI", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 284, name: "Ronald",           club: "REM", position: "ATA", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 285, name: "Edinho",           club: "REM", position: "ATA", cost: 9,  projPoints: 4.0, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ VITÓRIA (VIT)
    // ================================================
    { id: 286, name: "Lucas Arcanjo",    club: "VIT", position: "GOL", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 287, name: "Dalton",           club: "VIT", position: "GOL", cost: 7,  projPoints: 3.0, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 288, name: "Caio Vinícius",    club: "VIT", position: "ZAG", cost: 9,  projPoints: 3.9, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 289, name: "Wagner Leonardo",  club: "VIT", position: "ZAG", cost: 10, projPoints: 4.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 290, name: "Willean Lepo",     club: "VIT", position: "LAT", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 291, name: "Raúl Cáceres",     club: "VIT", position: "LAT", cost: 10, projPoints: 4.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 292, name: "Léo Naldi",        club: "VIT", position: "MEI", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 293, name: "Matheuzinho VIT",  club: "VIT", position: "MEI", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 294, name: "Osvaldo",          club: "VIT", position: "ATA", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 295, name: "Janderson",        club: "VIT", position: "ATA", cost: 10, projPoints: 4.4, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 296, name: "Alerrandro",       club: "VIT", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },

    // ================================================ SANTOS (SAN)
    // Neymar retornou! Confirmado jogando 2026
    // ================================================
    { id: 297, name: "Gabriel Brazão",   club: "SAN", position: "GOL", cost: 10, projPoints: 4.3, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 298, name: "João Paulo",       club: "SAN", position: "GOL", cost: 8,  projPoints: 3.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 299, name: "Jair",             club: "SAN", position: "ZAG", cost: 10, projPoints: 4.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 300, name: "Gil",              club: "SAN", position: "ZAG", cost: 10, projPoints: 4.2, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 301, name: "JP Chermont",      club: "SAN", position: "LAT", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 302, name: "Escobar",          club: "SAN", position: "MEI", cost: 11, projPoints: 4.6, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 303, name: "Giuliano",         club: "SAN", position: "MEI", cost: 11, projPoints: 4.7, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 304, name: "Neymar",           club: "SAN", position: "MEI", cost: 24, projPoints: 9.5, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 305, name: "Wendel Silva",     club: "SAN", position: "ATA", cost: 11, projPoints: 4.8, realPoints: 0, status: "disponivel", draftedBy: null },
    { id: 306, name: "Tiquinho Soares",  club: "SAN", position: "ATA", cost: 13, projPoints: 5.6, realPoints: 0, status: "disponivel", draftedBy: null },
];
