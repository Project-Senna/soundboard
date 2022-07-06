import {
  LitElement, 
  html,
  css,
  TemplateResult,
} from 'lit';
import {
  customElement, 
  property, 
  state,
} from 'lit/decorators.js';
import {
  until,
} from 'lit/directives/until.js';
import {
  wordDatabase,
} from './wordDb';

const initialWords = [
        'I',
        'you',
        'we',
        'he',
        'she',
        'they',
        'it',
        'this',
        'that',
        'the',
        'a',
        'is',
        'can',
        'will',
        'do',
        'don\'t',
        'want',
        'like',
        'need',
        'have',
        'get',
        'stop',
        'go',
        'come',
        'take',
        'give',
        'eat',
        'open',
        'make',
        'put',
        'think',
        'see',
        'look',
        'say',
        'know',
        'play',
        'listen',
        'tell',
        'help',
        'what',
        'when',
        'where',
        'who',
        'why',
        'how',
        'to',
        'with',
        'here',
        'in',
        'on',
        'of',
        'there',
        'out',
        'off',
        'for',
        'about',
        'up',
        'down',
        'if',
        'but',
        'because',
        'and',
        'so',
        'or',
        'now',
        'not',
        'more',
        'too',
        'all done',
        'good',
        'bad',
        'different',
        'all',
        'some',
        'swimming',
    ];

@customElement('app-container')
export class AppContainer extends LitElement {

    static styles = css`
      button {
        min-width: 44px;
        min-height: 20px;
        font-size: 20px;
      }

      .queue {
        border: 1px solid black;
        display: block;
        min-width: 800px;
        min-height: 44px;
      }

      .word-list {
        margin-top: 14px;
        display: flex;
        flex-wrap: wrap;
        align-content: space-between;
        gap: 14px;
      }
    `;

    @state()
    protected queue: string[] = [];

    addWordToQueue(event: MouseEvent) {
      const target = event.target as HTMLButtonElement;
      this.queue = [...this.queue, target.textContent.trim()];
    }

    removeLastWordInQueue() {
      this.queue.pop();
      this.queue = [...this.queue];
    }

    clearQueue() {
      this.queue = [];
    }

    speakQueue() {
      const msg = new SpeechSynthesisUtterance();
      msg.text = this.queue.join(' ');
      window.speechSynthesis.speak(msg);
    }

    async initializeWordDatabase(): Promise<TemplateResult> {
      const db = await wordDatabase;

      const wordsCount = await db.count('words');

      if (wordsCount === 0) {
        const transaction = db.transaction('words', 'readwrite');
        await Promise.all([
            ... initialWords.map((word) => {
                return transaction.store.add({
                    label: word,
                    builtIn: true,
                });
            }),
            transaction.done,
        ]);
      }

      return this.renderApp();
    }

    async renderWords(): Promise<TemplateResult[]> {
      const buttonTemplates = [];
      const db = await wordDatabase;

      const words = await db.getAll('words');

      for (const word of words) {
        if (word.label !== 'swimming') {
          buttonTemplates.push(html`
            <button @click="${this.addWordToQueue}">${word.label}</button>
          `);
          continue;
        }
        
        buttonTemplates.push(html`
        <button
          @click="${this.addWordToQueue}">
          <img 
            src="${new URL('./images/swimmer.svg', import.meta.url)}"
            role="presentation" />
            ${word.label}
          </button>
        `);
      }

      return buttonTemplates;
    }

    renderApp(): TemplateResult {
      return html`
        <header class="app-header">
          <section class="queue">
                ${this.queue.join(' ')}
          </section>
          <button @click="${this.speakQueue}">Speak</button>
          <button @click="${this.removeLastWordInQueue}">Delete</button> <!-- Remove last word -->
          <button @click="${this.clearQueue}">Trash</button> <!-- Remove all words in queue -->
        </header>
        <main class="word-list">
          ${until(this.renderWords(), html`<span>Loading words...</span>`)}
        </main>
      `;
    }

    override render() {
        return html`
        ${until(this.initializeWordDatabase(), html`<span>Initializing...</span>`)}
        `;
    }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-container": AppContainer;
  }
}
