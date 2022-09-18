import {
  LitElement,
  html,
  type TemplateResult,
} from 'lit';
import {
  customElement,
  state,
} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import { v4 as uuidv4 } from 'uuid';
import {produce, Immutable} from "immer";

@customElement('queue-container')
export class QueueContainer extends LitElement {
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

  render(): TemplateResult {
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

declare global {
  interface HTMLElementTagNameMap {
    'queue-container': QueueContainer;
  }
}
