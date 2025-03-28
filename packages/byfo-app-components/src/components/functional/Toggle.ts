import { html, css, TemplateResult } from 'lit';

export function ByfoToggle(onToggle: (checked: boolean) => void, initial: boolean): TemplateResult {
  const onClick = (e: MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return;
    const toggle = e.target.tagName === 'byfo-toggle' ? e.target : e.target.closest('byfo-toggle');
    if (!toggle) return;
    const willBeChecked = toggle.getAttribute('checked') === null;
    if (willBeChecked) {
      toggle.setAttribute('checked', '');
    } else {
      toggle.removeAttribute('checked');
    }
    onToggle(willBeChecked);
  };
  return html`<byfo-toggle @click=${onClick} ?checked=${initial}><div></div></byfo-toggle>`;
}

export const toggleStyles = css`
  byfo-toggle {
    background-color: rgb(119, 119, 119);
    display: flex;
    align-items: center;
    position: relative;
    cursor: pointer;
    --unit: 1rem;
    height: calc(1.25 * var(--unit));
    width: calc(2.25 * var(--unit));
    padding: calc(0.125 * var(--unit));
    border-radius: calc(0.75 * var(--unit));
    transition: background-color ease-in-out 100ms;
    & > div {
      position: absolute;
      left: calc(0.25 * var(--unit));
      transition: left ease-in-out 100ms;
      background-color: white;
      height: var(--unit);
      width: var(--unit);
      border-radius: calc(0.5 * var(--unit));
    }
  }
  byfo-toggle[checked] {
    background-color: var(--byfo-color-brand);
    & > div {
      left: calc(1.25 * var(--unit));
    }
  }
`;
