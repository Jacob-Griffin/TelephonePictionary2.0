import { css } from 'lit';

export const buttonStyle = css`
  button {
    height: 2rem;
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
  }
  button.big {
    padding-inline: 1rem;
    font-size: 1.5rem;
    width: 80vw;
    max-width: 15rem;
    height: fit-content;
  }
`;

export default buttonStyle;
