# Whiskers & Wishes 🐈✨

Uma aventura 2D de exploração feita com **Phaser 3 + TypeScript + Vite**, criada como um presente interativo. Você joga como **Cristian**, atravessa cinco lugares mágicos, ajuda gatinhos, coleciona estrelinhas e encontra sua namorada no **Lugar Especial**.

O jogo foi feito para ser jogado de verdade: tem mapas conectados, missões em cadeia, segredos, plataforma, progresso salvo, áudio, controles de toque e uma cena final personalizável.

---

## ✨ O que está implementado

- **Cinco áreas conectadas**
  1. **Jardim dos Gatinhos** — área inicial, lago, casinha, flores e os primeiros gatinhos.
  2. **Floresta Encantada** — cogumelos brilhantes, vaga-lumes, clareiras secretas e personagens.
  3. **Vila Aconchegante** — casinhas, praça, poço dos desejos, moradores e festival.
  4. **Trilha das Estrelas** — plataforma com saltos, caminhos altos, cristais, checkpoints e portal.
  5. **Lugar Especial** — cena final com os dois personagens, corações e carta personalizada.

- **Personagens em pixel art gerados por código**
  - Cristian: cabelo escuro cacheado, óculos redondos, pele morena clara e roupa preta.
  - Namorada: cabelo longo com trança lateral, pele morena clara, olhos expressivos e roupa azul.
  - Animações de idle, caminhada e pulo; gatinhos com variações de cor e reações próprias.

- **Jogabilidade**
  - Movimento em 2D com colisões e profundidade (personagem passa por trás/na frente dos objetos).
  - Plataforma com pulo variável, coyote time, buffer de pulo, checkpoints e respawn.
  - Gatinhos e NPCs interativos com nomes, personalidades e diálogos.
  - Estrelinhas colecionáveis, itens de missão, segredos e recompensas.
  - Missões em cadeia que abrem os caminhos entre as áreas.
  - HUD com contadores, rastreador de missão, dicas contextuais e avisos.
  - Pausa com inventário, status das missões e controles.
  - Controles de teclado e de toque (joystick virtual / botões de plataforma).

- **Áudio**
  - Música ambiente e efeitos sonoros gerados em tempo real com **WebAudio**.
  - Nenhum arquivo de áudio externo; temas diferentes por área.
  - Botões de som no menu, HUD e pausa. A preferência fica salva.

- **Progresso**
  - Salvamento automático no `localStorage` (formato v2).
  - Migração automática do protótipo antigo (v1).
  - Guarda estrelas, gatinhos, missões, inventário, flags narrativas, área atual e final visto.

- **Publicação**
  - Responsivo, com suporte a orientação horizontal e área segura de celulares.
  - PWA instalável: manifest, ícones PNG e service worker para funcionar offline.
  - Pronto para **GitHub Pages** com `base: './'` e workflow incluído.

---

## 🎮 Controles

### Computador
| Ação | Tecla |
| --- | --- |
| Andar | `WASD` ou setas |
| Interagir / avançar diálogo | `E`, `Enter` ou `Espaço` |
| Pausar / fechar diálogo | `Esc` |
| Ligar/desligar som | `M` |
| Pular (Trilha) | `Espaço`, `W` ou seta para cima |

### Celular / tablet
- **Áreas de exploração:** joystick à esquerda e botão **E** à direita.
- **Trilha das Estrelas:** botões ◀ ▶ e ↑ na tela, além do botão de voltar à vila.
- Toque na caixa de diálogo para avançar.

---

## 🐾 Como a aventura flui

As missões funcionam como uma corrente que conduz o jogador pelo mundo:

1. **Mochi** perdeu o peixinho de brinquedo perto do lago → abre a passagem para a Floresta Encantada.
2. **Pipoca** perdeu a lanterna entre os cogumelos → abre o caminho para a Vila Aconchegante.
3. **Nuvem** procura a gatinha **Amora**, escondida no sudeste da floresta → Amora passa a morar na vila.
4. **Biscoito** perdeu os 3 sinos do Festival das Estrelas → abre a Trilha das Estrelas.
5. Na trilha, colete **6 das 10 estrelas** para despertar o portal.
6. O portal leva ao **Lugar Especial**, onde acontece a cena final e a carta.

Também existem segredos e interações opcionais: o brilho escondido no jardim, a clareira secreta, o poço dos desejos e placas espalhadas pelo mundo.

---

## 💌 Personalização (o mais importante)

Quase todo o conteúdo afetivo está em **um único arquivo**:

```
src/config/personalization.ts
```

Lá você pode editar:

- `playerName` — seu nome.
- `partnerName` — como você chama sua namorada (padrão: `Meu Amor`).
- `tagline` e `menuNote` — frases do menu.
- `finalDialogue` — cada fala da cena final, com quem fala, texto e retrato.
- `finalLetter.title` — título da carta.
- `finalLetter.paragraphs` — os parágrafos da sua mensagem pessoal.
- `finalLetter.signature` — assinatura.
- `finalLetter.footer` — frase de encerramento.
- `finalNote` — pequena nota abaixo dos botões finais.

Use `{playerName}` e `{partnerName}` dentro dos textos para inserir os nomes automaticamente.

> A carta padrão é apenas um exemplo carinhoso, sem inventar fatos sobre o relacionamento. Escreva a sua mensagem real nesse arquivo.

### Outros dados editáveis

- **Mapas, gatinhos, NPCs, estrelas, itens, saídas, segredos e missões:** `src/data/worldData.ts`
- **Visual dos personagens, gatos, cenário e efeitos:** `src/game/entities/SpriteFactory.ts`
- **Música e efeitos:** `src/game/systems/AudioManager.ts`
- **Cores, fontes e painéis da interface:** `src/game/ui/Theme.ts`

---

## 🚀 Rodando o projeto

Pré-requisitos: **Node.js 20+** e **npm**.

```bash
cd whiskers-and-wishes
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite (normalmente `http://localhost:5173`).

### Build de produção

```bash
npm run build
npm run preview
```

O build sai em `dist/`.

---

## 🌐 Publicar no GitHub Pages

O repositório já inclui um workflow em `.github/workflows/deploy.yml`.

1. Envie o projeto para o GitHub.
2. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**.
3. Faça push para a branch `main`.

O workflow instala as dependências dentro de `whiskers-and-wishes/`, roda `npm run build` e publica `dist/`. Como o Vite usa `base: './'`, o jogo funciona tanto na raiz quanto em um subcaminho de repositório.

### PWA

Depois de publicado via HTTPS:

- O manifest e os ícones permitem **instalar o jogo** no celular ou computador.
- O service worker guarda o app em cache para abrir **offline**.
- Em desenvolvimento o service worker não é registrado; ele só entra em produção (`import.meta.env.PROD`).

---

## 🧱 Estrutura do projeto

```
whiskers-and-wishes/
├─ index.html
├─ public/
│  ├─ manifest.webmanifest
│  ├─ sw.js
│  └─ assets/icons/            # ícone SVG + PNGs 192/512
├─ src/
│  ├─ main.ts                  # configuração do Phaser, áudio e PWA
│  ├─ config/personalization.ts
│  ├─ data/worldData.ts        # mapas, missões, gatinhos, itens
│  ├─ game/
│  │  ├─ entities/SpriteFactory.ts
│  │  ├─ scenes/
│  │  │  ├─ BootScene.ts       # gera texturas/animações
│  │  │  ├─ MenuScene.ts
│  │  │  ├─ AdventureScene.ts  # jardim, floresta e vila
│  │  │  ├─ StarTrailScene.ts  # plataforma
│  │  │  └─ FinaleScene.ts     # cena final + carta
│  │  ├─ systems/
│  │  │  ├─ SaveManager.ts
│  │  │  └─ AudioManager.ts
│  │  └─ ui/
│  │     ├─ Theme.ts
│  │     ├─ DialogueBox.ts
│  │     ├─ Hud.ts
│  │     └─ TouchControls.ts
│  └─ styles/main.css
├─ tsconfig.json
└─ vite.config.ts
```

---

## 🛠️ Decisões técnicas

- **Sem imagens externas:** todos os sprites, cenários, tiles e efeitos são desenhados em texturas via `Phaser.GameObjects.Graphics`. Isso mantém o projeto leve, original e sem preocupação com licenças.
- **Sem arquivos de áudio:** a trilha e os efeitos usam osciladores e filtros do WebAudio.
- **Sem dependências além de Phaser:** Vite e TypeScript ficam em `devDependencies`.
- **Uma cena para três áreas:** `AdventureScene` é orientada por dados (`worldData.ts`), então criar ou editar mapas é só mexer nos arrays.
- **Salvamento tolerante a falhas:** se o `localStorage` estiver indisponível, o jogo continua funcionando sem salvar.

---

## ✅ Estado atual

Concluído e jogável de ponta a ponta:

- Personagens e arte original em pixel art.
- Três áreas exploráveis + trilha de plataforma + final.
- 4 missões encadeadas, 8 gatinhos, NPCs, itens, estrelas e segredos.
- Diálogos com retrato, HUD, inventário, pausa e notificações.
- Controles de teclado e toque.
- Salvamento automático com migração.
- Áudio procedural e opção de mudo.
- Carta final editável.
- Build de produção passando.
- PWA, manifest, ícones, service worker e workflow de GitHub Pages.

Ideias para o futuro (opcional): mais variações de gatinhos, conquistas, modo foto, tradução para outros idiomas e uma tela de créditos dentro do jogo.

---

Feito com carinho, gatinhos e um pouco de poeira de estrela. ✦
