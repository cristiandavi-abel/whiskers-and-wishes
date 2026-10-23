# Whiskers & Wishes 🐈✨

Um protótipo de aventura 2D em pixel art feito com Phaser, TypeScript e Vite.

## Requisitos
- Node.js LTS instalado
- npm

## Executar localmente
Abra esta pasta no VS Code e rode no terminal:

```bash
npm install
npm run dev
```

Abra o endereço local mostrado pelo Vite.

## Controles
### Jardim dos Gatinhos
- WASD ou setas: movimentar
- E: interagir com gatinhos e mensagens
- P ou Espaço: entrar na área de plataforma
- Esc: abrir pausa

### Trilha das Estrelas
- A/D ou setas: movimentar
- Espaço, W ou seta para cima: pular
- Esc: voltar ao jardim

No celular, use o joystick e os botões na tela.

## Build
```bash
npm run build
npm run preview
```

## Publicação no GitHub Pages
O `vite.config.ts` usa `base: './'` para facilitar hospedagem em subcaminhos. Configure GitHub Pages para servir os arquivos da pasta `dist` (por exemplo, com GitHub Actions).

## Estado do projeto
Esta é uma primeira versão jogável: jardim explorável, personagem, gatinhos, estrelinhas, diálogos, controles móveis e uma área de plataforma. Os sprites são protótipos gerados por código; arte final, mais mapas, missões e personalização narrativa ainda podem ser adicionados.

## Privacidade
Não coloque fotografias pessoais em pastas públicas. A pasta de referências deve permanecer local e está incluída no `.gitignore`.
