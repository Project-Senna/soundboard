import {
  LitElement,
  html,
  css,
  svg,
  type TemplateResult,
} from 'lit';
import {
  customElement,
} from 'lit/decorators.js';
import {
  until,
} from 'lit/directives/until.js';
import {
  ref,
  createRef,
  type Ref,
} from 'lit/directives/ref.js';
import {
  wordDatabase,
} from '../wordDb';
import { initialWords } from '../words';
import { QueueContainer } from './queue';

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

      .app-header {
        display: flex;
        justify-content: space-between;
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
      const phrase = this.queue.value.phrase;
      if (phrase === undefined) {
        return;
      }
      const msg = new SpeechSynthesisUtterance();
      msg.text = phrase;
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
            src="${new URL('../images/swimmer.svg', import.meta.url)}"
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
            ${ref(this.queue)}></queue-container>
          <div>
            <button @click="${this.speakQueue}">Speak</button>
            <button @click="${this.removeLastWordInQueue}">Delete</button>
            <button @click="${this.clearQueue}">Trash</button>
          </div>
        </header>
        <main class="word-list">
          ${until(
            this.renderWords(),
            html`<span>Loading words...</span>`,
          )}
        </main>
      `;
    }

    renderLoadingSpinner() {
      return svg`
      <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 45 45" stroke="#fff">
    <g fill="none" fill-rule="evenodd" transform="translate(1 1)" stroke-width="2">
        <circle cx="22" cy="22" r="6" stroke-opacity="0">
            <animate attributeName="r" begin="1.5s" dur="3s" values="6;22" calcMode="linear" repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity" begin="1.5s" dur="3s" values="1;0" calcMode="linear" repeatCount="indefinite"/>
            <animate attributeName="stroke-width" begin="1.5s" dur="3s" values="2;0" calcMode="linear" repeatCount="indefinite"/>
        </circle>
        <circle cx="22" cy="22" r="6" stroke-opacity="0">
            <animate attributeName="r" begin="3s" dur="3s" values="6;22" calcMode="linear" repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity" begin="3s" dur="3s" values="1;0" calcMode="linear" repeatCount="indefinite"/>
            <animate attributeName="stroke-width" begin="3s" dur="3s" values="2;0" calcMode="linear" repeatCount="indefinite"/>
        </circle>
        <circle cx="22" cy="22" r="8">
            <animate attributeName="r" begin="0s" dur="1.5s" values="6;1;2;3;4;5;6" calcMode="linear" repeatCount="indefinite"/>
        </circle>
    </g>
</svg>
      `;
    }

    override render() {
        return html`
        ${until(
          this.initializeWordDatabase(),
          this.renderLoadingSpinner(),
        )}
        `;
    }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-container': AppContainer;
  }
}
