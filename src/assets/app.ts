import {
  LitElement,
  html,
  css,
  type TemplateResult,
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
  ref,
  createRef,
  type Ref,
} from 'lit/directives/ref.js';
import {repeat} from 'lit/directives/repeat.js';
import { v4 as uuidv4 } from 'uuid';
import {produce, Immutable} from "immer";
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

@customElement('queue-container')
class QueueContainer extends LitElement {
  @state()
  private value: Immutable<string[]> = [];

  get phrase(): string {
    return this.value.join(' ');
  }

  addWord(word: string): void {
    this.value = produce(this.value, (draft) => {
      draft.push(word);
    });
  }

  removeLastWordInQueue() {
    this.value = produce(this.value, (draft) => {
      draft.pop();
    });
  }

  clearQueue() {
    this.value = produce(this.value, () => []);
  }

  render() {
    return html`
      <section class="queue">
        ${repeat(
          this.value ?? [],
          () => uuidv4(),
          (word) => html`${word} `,
        )}
      </section>`;
  }
}

@customElement('app-container')
export class AppContainer extends LitElement {

    static styles = css`
      button {
        min-width: 44px;
        min-height: 20px;
        font-size: 20px;
      }

      button img {
        pointer-events: none;
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

    protected queue: Ref<QueueContainer> = createRef();

    addWordToQueue = (event: MouseEvent) => {
      const target = event.target as HTMLButtonElement;
      this.queue.value.addWord(target.textContent.trim());
    }

    speakQueue() {
      const msg = new SpeechSynthesisUtterance();
      msg.text = this.queue.value.phrase;
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

    removeLastWordInQueue() {
      this.queue.value.removeLastWordInQueue();
    }

    clearQueue() {
      this.queue.value.clearQueue();
    }

    renderApp(): TemplateResult {
      return html`
        <header class="app-header">
          <queue-container
            ${ref(this.queue)}
            .queue="${this.queue}"></queue-container>
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
    'app-container': AppContainer;
    'queue-container': QueueContainer;
  }
}
