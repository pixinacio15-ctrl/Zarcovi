const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client();
const ADMIN_ID = process.env.ADMIN_ID || 'seu_id_aqui'; // ID do admin para cadastros
const dataPath = path.join(__dirname, 'personagens.json');

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

let personagens = carregarPersonagens();

client.on('ready', () => {
  console.log('✅ Bot conectado com sucesso!');
});

client.on('qr', (qr) => {
  console.log('📱 Escaneie o QR Code abaixo:');
  qrcode.generate(qr, { small: true });
});

client.on('message', async (message) => {
  const texto = message.body.toLowerCase().trim();
  const chat = await message.getChat();
  const isAdmin = message.from === ADMIN_ID || message.author === ADMIN_ID;

  // Comando !ajuda
  if (texto === '!ajuda') {
    let ajuda = `🎮 *Comandos Disponíveis Zarcovi*\n\n`;
    
    if (isAdmin) {
      ajuda += `👑 *COMANDOS ADMIN:*\n`;
      ajuda += `!cadastrar [nome do personagem] - Cadastra um novo personagem\n`;
      ajuda += `!adicionar_habilidade [nome] | [legenda] - Adiciona habilidade (responda a uma imagem)\n`;
      ajuda += `!listar_cadastrados - Lista todos os personagens cadastrados\n\n`;
    }
    
    ajuda += `👥 *COMANDOS GERAIS:*\n`;
    ajuda += `!loja [nome do personagem] - Visualiza as habilidades do personagem\n`;
    ajuda += `!ajuda - Mostra esta mensagem\n`;
    
    return message.reply(ajuda);
  }

  // Comando !cadastrar [nome] - Apenas Admin
  if (texto.startsWith('!cadastrar ')) {
    if (!isAdmin) {
      return message.reply('❌ Apenas admins podem cadastrar personagens!');
    }

    const nomePersonagem = texto.replace('!cadastrar ', '').trim();

    if (!nomePersonagem) {
      return message.reply('❌ Use: !cadastrar [nome do personagem]');
    }

    if (personagens[nomePersonagem]) {
      return message.reply(`⚠️ O personagem "${nomePersonagem}" já existe!`);
    }

    // Cria estrutura do personagem
    personagens[nomePersonagem] = {
      nome: nomePersonagem,
      habilidades: [],
      criado_em: new Date().toISOString(),
      criado_por: message.from
    };

    salvarPersonagens(personagens);
    return message.reply(`✅ Personagem "${nomePersonagem}" cadastrado com sucesso!\n\nAgora envie as imagens com legendas e use !adicionar_habilidade [nome da habilidade] | [legenda]`);
  }

  // Comando !adicionar_habilidade [nome] - Apenas Admin
  if (texto.startsWith('!adicionar_habilidade ')) {
    if (!isAdmin) {
      return message.reply('❌ Apenas admins podem adicionar habilidades!');
    }

    // Verifica se é uma resposta a mensagem anterior
    const quotedMsg = await message.getQuotedMessage();
    if (!quotedMsg || !quotedMsg.hasMedia) {
      return message.reply('❌ Responda a uma mensagem com imagem e use:\n!adicionar_habilidade [nome da habilidade] | [legenda]');
    }

    const args = texto.replace('!adicionar_habilidade ', '').trim().split('|');
    const nomeHabilidade = args[0].trim();
    const legenda = args[1]?.trim() || '';

    if (!nomeHabilidade) {
      return message.reply('❌ Use: !adicionar_habilidade [nome] | [legenda]');
    }

    // Encontra o personagem (último mencionado)
    const personagemAtual = Object.keys(personagens)[Object.keys(personagens).length - 1];

    if (!personagemAtual) {
      return message.reply('❌ Nenhum personagem cadastrado!');
    }

    try {
      const media = await quotedMsg.downloadMedia();
      const nomeArquivo = `habilidade_${Date.now()}.${media.mimType.split('/')[1]}`;
      const caminhoArquivo = path.join(__dirname, 'media', nomeArquivo);

      // Cria pasta media se não existir
      if (!fs.existsSync(path.join(__dirname, 'media'))) {
        fs.mkdirSync(path.join(__dirname, 'media'), { recursive: true });
      }

      fs.writeFileSync(caminhoArquivo, Buffer.from(media.data, 'base64'));

      personagens[personagemAtual].habilidades.push({
        nome: nomeHabilidade,
        legenda: legenda,
        imagem: nomeArquivo,
        adicionado_em: new Date().toISOString()
      });

      salvarPersonagens(personagens);
      return message.reply(`✅ Habilidade "${nomeHabilidade}" adicionada a "${personagemAtual}"!`);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      return message.reply('❌ Erro ao processar a imagem!');
    }
  }

  // Comando !loja [nome do personagem] - Usuários comuns
  if (texto.startsWith('!loja ')) {
    const nomePersonagem = texto.replace('!loja ', '').trim();

    if (!nomePersonagem) {
      return message.reply('❌ Use: !loja [nome do personagem]');
    }

    const personagem = personagens[nomePersonagem];

    if (!personagem) {
      return message.reply(`❌ Personagem "${nomePersonagem}" não encontrado!`);
    }

    if (personagem.habilidades.length === 0) {
      return message.reply(`📋 ${nomePersonagem} não possui habilidades cadastradas ainda.`);
    }

    // Envia cada habilidade com imagem + legenda
    for (const habilidade of personagem.habilidades) {
      const caminhoImagem = path.join(__dirname, 'media', habilidade.imagem);

      if (fs.existsSync(caminhoImagem)) {
        try {
          // Envia a imagem com caption
          await chat.sendMessage(`🔥 *${habilidade.nome}*\n${habilidade.legenda || 'Sem descrição'}`, {
            media: require('whatsapp-web.js').MessageMedia.fromFilePath(caminhoImagem),
            caption: `🔥 *${habilidade.nome}*\n${habilidade.legenda}`
          });
        } catch (err) {
          console.error('Erro ao enviar habilidade:', err);
        }
      }
    }

    message.reply(`✅ Habilidades de ${nomePersonagem} enviadas com sucesso!`);
  }

  // Comando !listar_cadastrados - Apenas Admin
  if (texto === '!listar_cadastrados') {
    if (!isAdmin) {
      return message.reply('❌ Apenas admins podem listar personagens!');
    }

    const lista = Object.keys(personagens);

    if (lista.length === 0) {
      return message.reply('📋 Nenhum personagem cadastrado ainda.');
    }

    let resposta = `📋 *Personagens Cadastrados:*\n\n`;
    for (const nome of lista) {
      resposta += `🎭 ${nome} - ${personagens[nome].habilidades.length} habilidades\n`;
    }

    message.reply(resposta);
  }
});

client.initialize();
