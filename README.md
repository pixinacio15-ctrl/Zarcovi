# 🎮 Zarcovi WhatsApp Bot

Bot WhatsApp para gerenciar habilidades de personagens do RPG Zarcovi com sistema de cadastro e loja.

## 🚀 Recursos

### 👑 Comandos Admin
- `!cadastrar [nome]` - Cadastra um novo personagem
- `!adicionar_habilidade [nome] | [legenda]` - Adiciona uma habilidade (responda a uma imagem)
- `!listar_cadastrados` - Lista todos os personagens cadastrados

### 👥 Comandos Gerais
- `!loja [nome do personagem]` - Visualiza todas as habilidades do personagem
- `!ajuda` - Mostra os comandos disponíveis

## 📋 Formato de Envio

### Cadastrando um Personagem
```
!cadastrar Hagoromo
```

### Adicionando uma Habilidade
1. Envie uma imagem
2. Responda com:
```
!adicionar_habilidade Técnica da Onda de Ar | Uma poderosa onda de ar que causa dano em área
```

### Consultando Habilidades
```
!loja Hagoromo
```

O bot enviará:
```
🔥 Técnica da Onda de Ar
Uma poderosa onda de ar que causa dano em área

[IMAGEM]
```

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/pixinacio15-ctrl/Zarcovi.git
cd Zarcovi

# Instale as dependências
npm install

# Configure suas variáveis de ambiente
cp .env.example .env
# Edite .env e adicione seu ID do WhatsApp

# Inicie o bot
npm start
```

## 🔑 Como Obter seu ID do WhatsApp

1. Inicie o bot
2. Escaneie o QR Code
3. Envie uma mensagem qualquer
4. Seu ID será exibido no console
5. Copie e cole no arquivo `.env`

## 📁 Estrutura de Arquivos

```
Zarcovi/
├── index.js                 # Bot principal
├── personagens.json         # Banco de dados de personagens
├── package.json             # Dependências
├── .env.example             # Template de variáveis
├── .gitignore              # Arquivos ignorados
├── README.md               # Este arquivo
└── media/                  # Pasta para armazenar imagens
```

## 💾 Estrutura de Dados (personagens.json)

```json
{
  "Hagoromo": {
    "nome": "Hagoromo",
    "habilidades": [
      {
        "nome": "Técnica da Onda de Ar",
        "legenda": "Uma poderosa onda de ar que causa dano em área",
        "imagem": "habilidade_1234567890.png",
        "adicionado_em": "2026-05-16T00:00:00.000Z"
      }
    ],
    "criado_em": "2026-05-16T00:00:00.000Z",
    "criado_por": "admin"
  }
}
```

## 🔐 Segurança

- Apenas IDs de admin podem cadastrar personagens
- Todos podem consultar habilidades via `!loja`
- Dados armazenados localmente em JSON
- Imagens salvas na pasta `media/`

## 📝 Exemplo de Uso Completo

1. **Admin cadastra personagem:**
   ```
   !cadastrar Hagoromo
   ✅ Personagem "Hagoromo" cadastrado com sucesso!
   ```

2. **Admin envia imagem da habilidade e responde:**
   ```
   !adicionar_habilidade Técnica da Onda de Ar | Manipula o ar em forma de onda destrutiva
   ✅ Habilidade "Técnica da Onda de Ar" adicionada a "Hagoromo"!
   ```

3. **Usuário comum consulta:**
   ```
   !loja Hagoromo
   ✅ Habilidades de Hagoromo enviadas com sucesso!
   ```

4. **Bot responde com imagem + legenda:**
   ```
   🔥 Técnica da Onda de Ar
   Manipula o ar em forma de onda destrutiva
   
   [IMAGEM]
   ```

## 🤝 Contribuindo

Sinta-se livre para abrir issues e pull requests!

## 📄 Licença

MIT - Veja o arquivo LICENSE para detalhes.

## 🆘 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

**Desenvolvido para a comunidade Zarcovi RPG** 🎮🇨🇴
