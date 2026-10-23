/**
 * ─────────────────────────────────────────────────────────────
 *  PERSONALIZAÇÃO DO PRESENTE
 * ─────────────────────────────────────────────────────────────
 *  Edite apenas este arquivo para trocar nomes, dedicatórias e
 *  mensagens românticas. Nenhum outro arquivo precisa ser mexido.
 *
 *  Use {playerName} e {partnerName} para inserir automaticamente
 *  os nomes definidos abaixo.
 * ─────────────────────────────────────────────────────────────
 */

export type DialogueLine = {
  speaker: string;
  text: string;
  /** Chave de textura opcional para o retrato (ex.: 'amada-idle-0'). */
  portrait?: string;
};

export const PERSONALIZATION = {
  /** Nome do jogador / protagonista. */
  playerName: 'Cristian',

  /**
   * Como você chama sua namorada.
   * Aparece no HUD final, nos diálogos e na carta.
   */
  partnerName: 'Meu Amor',

  gameTitle: 'Whiskers & Wishes',
  tagline: 'uma aventura feita de carinho, gatinhos e estrelinhas',

  /** Frase exibida no menu inicial. */
  menuNote: 'Feito à mão, com muito amor, para alguém muito especial.',

  /**
   * Diálogo da cena final, antes da carta.
   * O retrato de Cristian é automático. Para a namorada use
   * portrait: 'amada-idle-0'. Para um gatinho, 'cat-cream-0', etc.
   */
  finalDialogue: [
    {
      speaker: '{playerName}',
      text: 'Eu procurei por todo esse mundo mágico... mas a verdade é que meu lugar favorito sempre foi do seu lado.',
      portrait: 'cristian-idle-0',
    },
    {
      speaker: '{partnerName}',
      text: 'Você atravessou florestas, ajudou gatinhos e ainda trouxe estrelinhas? Miau... quer dizer, que fofo!',
      portrait: 'amada-idle-0',
    },
    {
      speaker: '{playerName}',
      text: 'Cada estrela que encontrei me lembrou de um motivo para te querer por perto. E olha que o céu é bem grande.',
      portrait: 'cristian-idle-1',
    },
    {
      speaker: '{partnerName}',
      text: 'Então eu guardo todas elas. E guardo você também. Para sempre, se você deixar.',
      portrait: 'amada-idle-0',
    },
    {
      speaker: 'As estrelas',
      text: 'Um desejo foi feito sob o céu. E, pela primeira vez em muito tempo, o mundo inteiro pareceu concordar. ✦',
    },
  ] as DialogueLine[],

  /**
   * A carta final. Cada item do array vira um parágrafo.
   * Escreva aqui a sua mensagem pessoal. 💌
   */
  finalLetter: {
    title: 'Para você, {partnerName}',
    paragraphs: [
      'Se este mundo fosse realmente meu, eu colocaria todas as estrelas no céu só para iluminar o seu caminho até aqui.',
      'Obrigado por transformar dias comuns em memórias que eu guardo com tanto carinho. Você é a minha pessoa favorita em qualquer aventura.',
      'Este jogo é pequeno, mas cada gatinho, cada flor e cada estrelinha foram feitos pensando em você. Espero que ele consiga dizer, mesmo em pixels, um pouquinho do quanto você é especial para mim.',
    ],
    signature: 'Com todo o meu carinho,\n{playerName}',
    footer: '✦ fim da aventura — mas não da nossa história ✦',
  },

  /** Texto do botão final. */
  finalNote: 'Rejogue quando quiser. O mundo fica aqui esperando por você.',
};

/** Substitui os placeholders de nome em qualquer texto. */
export function personalText(text: string): string {
  return text
    .replaceAll('{playerName}', PERSONALIZATION.playerName)
    .replaceAll('{partnerName}', PERSONALIZATION.partnerName);
}
