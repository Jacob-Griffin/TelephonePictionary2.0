import { css } from 'lit';

export const backdropStyle = css`
  :host(:where(.backdrop)),
  section:where(.backdrop) {
    background-color: var(--byfo-color-backdrop);
    border-radius: 1rem;
    padding: 0.5rem 2rem;
  }
`;

export default backdropStyle;
