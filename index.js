const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const logger = P({ level: 'silent' });
let ADMIN_ID = process.env.ADMIN_ID || null;
const dataPath = path.join(__dirname, 'personagens.json');

// Gerar código de pareamento aleatório
function gerarCodigoPareavento() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

let codigoPareavento = null;
let botPareado = false;
let personagens = carregarPersonagens();

// Carrega dados dos personagens
function carregarPersonagens() {
  try {
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
  } catch (err) {
    console.log('Erro ao carregar personagens:', err);
  }
  return {};
}

// Salva dados dos personagens
function salvarPersonagens(dados) {
  fs.writeFileSync(dataPath, JSON.stringify(dados, null, 2));
}

async function conectarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    logger: logger,
    printQRInTerminal: true
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'connecting') {
      console.log('📱 Conectando ao WhatsApp...');
    } else if (connection === 'open') {
      console.log('✅ Bot conectado com sucesso!');
      console.log('\n🔐 CÓDIGO DE PAREAMENTO GERADO:\n');
      codigoPareavento = gerarCodigoPareavento();
      console.log(`📱 Código: ${codigoPareavento}`);
      console.log('\n👉 Envie este código no WhatsApp para pareá-lo com o bot!');
      console.log('\n================================================\n');
    } else if (connection === 'close') {
      let shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Desconectado!', shouldReconnect ? 'Reconectando...' : 'Faça login novamente.');
      if (shouldReconnect) {
        conectarBot();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const texto = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').toLowerCase().trim();
    const remetente = msg.key.remoteJid.split('@')[0];
    
    // ============================================
    // SISTEMA DE PAREAMENTO
    // ============================================
    
    if (!botPareado && texto === codigoPareavento) {
      botPareado = true;
      ADMIN_ID = msg.key.remoteJid;
      console.log(`\n✅ Bot pareado com sucesso! ID: ${msg.key.remoteJid}`);
      await sock.sendMessage(msg.key.remoteJid, { text: '✅ *Bot pareado com sucesso!*\n\nVocê agora é o ADMIN. Use !ajuda para ver os comandos.' });
      return;
    }

    if (!botPareado) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ *Bot não pareado!*\n\nAguarde o código de pareamento ser gerado.' });
      return;
    }

    const isAdmin = msg.key.remoteJid === ADMIN_ID;

    // Comando !ajuda
    if (texto === '!ajuda') {
      let ajuda = `🎮 *Comandos Disponíveis Zarcovi*\n\n`;
      
      if (isAdmin) {
        ajuda += `👑 *COMANDOS ADMIN:*\n`;
        ajuda += `!cadastrar [nome do personagem] - Cadastra um novo personagem\n`;
        ajuda += `!adicionar_habilidade [nome] | [legenda] - Adiciona habilidade (responda a uma imagem)\n`;
        ajuda += `!listar_cadastrados - Lista todos os personagens cadastrados\n`;
        ajuda += `!deletar_personagem [nome] - Deleta um personagem\n\n`;
      }
      
      ajuda += `👥 *COMANDOS GERAIS:*\n`;
      ajuda += `!loja [nome do personagem] - Visualiza as habilidades do personagem\n`;
      ajuda += `!personagens - Lista todos os personagens disponíveis\n`;
      ajuda += `!ajuda - Mostra esta mensagem\n`;
      
      if (isAdmin) {
        ajuda += `\n🔐 *INFORMAÇÕES:*\n`;
        ajuda += `ID Admin: ${ADMIN_ID}\n`;
        ajuda += `Bot Pareado: ✅`;
      }
      
      await sock.sendMessage(msg.key.remoteJid, { text: ajuda });
      return;
    }

    // Comando !cadastrar [nome] - Apenas Admin
    if (texto.startsWith('!cadastrar ')) {
      if (!isAdmin) {
        await sock.sendMessage(msg.key.remoteJid, { text: '❌ Apenas admins podem cadastrar personagens!' });
        return;
      }

      const nomePersonagem = texto.replace('!cadastrar ', '').trim();

      if (!nomePersonagem) {
        await sock.sendMessage(msg.key.remoteJid, { text: '❌ Use: !cadastrar [nome do personagem]' });
        return;
      }

      if (personagens[nomePersonagem]) {
        await sock.sendMessage(msg.key.remoteJid, { text: `⚠️ O personagem "${nomePersonagem}" já existe!` });
        return;
      }

      personagens[nomePersonagem] = {
        nome: nomePersonagem,
        habilidades: [],
        criado_em: new Date().toISOString(),
        criado_por: msg.key.remoteJid
      };

      salvarPersonagens(personagens);
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Personagem "${nomePersonagem}" cadastrado com sucesso!\n\nAgora envie as imagens com legendas e use !adicionar_habilidade [nome da habilidade] | [legenda]` });
      return;
    }

    // Comando !listar_cadastrados - Apenas Admin
    if (texto === '!listar_cadastrados') {
      if (!isAdmin) {
        await sock.sendMessage(msg.key.remoteJid, { text: '❌ Apenas admins podem listar personagens!' });
        return;
      }

      const lista = Object.keys(personagens);

      if (lista.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { text: '📋 Nenhum personagem cadastrado ainda.' });
        return;
      }

      let resposta = `📋 *Personagens Cadastrados:*\n\n`;
      for (const nome of lista) {
        resposta += `🎭 ${nome} - ${personagens[nome].habilidades.length} habilidades\n`;
      }

      await sock.sendMessage(msg.key.remoteJid, { text: resposta });
      return;
    }

    // Comando !personagens - Para todos
    if (texto === '!personagens') {
      const lista = Object.keys(personagens);

      if (lista.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { text: '📋 Nenhum personagem cadastrado ainda.' });
        return;
      }

      let resposta = `🎭 *Personagens Disponíveis:*\n\n`;
      for (const nome of lista) {
        resposta += `⭐ ${nome}\n`;
      }
      resposta += `\n💡 Use !loja [nome] para ver as habilidades`;

      await sock.sendMessage(msg.key.remoteJid, { text: resposta });
      return;
    }

    // Comando !loja [nome do personagem] - Usuários comuns
    if (texto.startsWith('!loja ')) {
      const nomePersonagem = texto.replace('!loja ', '').trim();

      if (!nomePersonagem) {
        await sock.sendMessage(msg.key.remoteJid, { text: '❌ Use: !loja [nome do personagem]' });
        return;
      }

      const personagem = personagens[nomePersonagem];

      if (!personagem) {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Personagem "${nomePersonagem}" não encontrado!` });
        return;
      }

      if (personagem.habilidades.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { text: `📋 ${nomePersonagem} não possui habilidades cadastradas ainda.` });
        return;
      }

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Habilidades de ${nomePersonagem} enviadas com sucesso!` });

      for (const habilidade of personagem.habilidades) {
        const caminhoImagem = path.join(__dirname, 'media', habilidade.imagem);

        if (fs.existsSync(caminhoImagem)) {
          try {
            await sock.sendMessage(msg.key.remoteJid, {
              image: fs.readFileSync(caminhoImagem),
              caption: `🔥 *${habilidade.nome}*\n${habilidade.legenda}`
            });
          } catch (err) {
            console.error('Erro ao enviar habilidade:', err);
          }
        }
      }
      return;
    }

    // Comando !deletar_personagem [nome] - Apenas Admin
    if (texto.startsWith('!deletar_personagem ')) {
      if (!isAdmin) {
        await sock.sendMessage(msg.key.remoteJid, { text: '❌ Apenas admins podem deletar personagens!' });
        return;
      }

      const nomePersonagem = texto.replace('!deletar_personagem ', '').trim();

      if (!nomePersonagem) {
        await sock.sendMessage(msg.key.remoteJid, { text: '❌ Use: !deletar_personagem [nome do personagem]' });
        return;
      }

      if (!personagens[nomePersonagem]) {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Personagem "${nomePersonagem}" não encontrado!` });
        return;
      }

      const habilidades = personagens[nomePersonagem].habilidades;
      for (const hab of habilidades) {
        const caminhoImagem = path.join(__dirname, 'media', hab.imagem);
        if (fs.existsSync(caminhoImagem)) {
          fs.unlinkSync(caminhoImagem);
        }
      }

      delete personagens[nomePersonagem];
      salvarPersonagens(personagens);

      await sock.sendMessage(msg.key.remoteJid, { text: `✅ Personagem "${nomePersonagem}" deletado com sucesso!` });
      return;
    }
  });

  return sock;
}

conectarBot().catch(err => {
  console.error('Erro ao conectar:', err);
  process.exit(1);
});
