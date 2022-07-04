import {LitElement, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('app-container')
export class AppContainer extends LitElement {
    override render() {
        return html`
            <p>Hello from the app container</p>
        `;
    }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-container": AppContainer;
  }
}
