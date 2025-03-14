import { css } from 'lit';

export const backdropStyle = css`
  :host(.backdrop),
  section.backdrop {
    background-color: var(--byfo-color-backdrop);
    border-radius: 1rem;
    padding: 0.5rem 2rem;
  }
`;

export default backdropStyle;
