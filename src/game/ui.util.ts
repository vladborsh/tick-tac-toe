import { Vector } from "./types/vector.interface";

export function alertIt(text: string, ...elements: HTMLElement[]) {
    showModal(modal);
    modalContent.innerText = text;
    elements.forEach(el => modalContent.appendChild(el));
}

const modal = getModal();
document.body.appendChild(modal);

const modalContent = getModalContent();
modal.appendChild(modalContent);

function getModal(): HTMLDivElement {
    const div = document.createElement('div');
    div.addEventListener('click', () => hideModal(div));

    return applyStyles(div, {
        'position': 'fixed',
        'left': '0',
        'top': '0',
        'width': '100%',
        'height': '100%',
        'background-color': 'rgba(0, 0, 0, 0.3)',
        'opacity': '0',
        'visibility': 'hidden',
        'transition': 'visibility 0s linear 0.25s, opacity 0.25s 0s, transform 0.25s'
    });
}

function getModalContent(): HTMLDivElement {
    return applyStyles(document.createElement('div'), {
        'position': 'absolute',
        'top': '50%',
        'left': '50%',
        'transform': 'translate(-50%, -50%)',
        'background-color': '#2c95b57a',
        'padding': '2rem 3rem',
        'width': '24rem',
        'border-radius': '0.5rem',
        'color': '#ffffff',
        'font-family': 'monospace',
        'font-size': '120%',
        'text-align': 'center',
        'box-shadow': '0 4px 8px 0 #2cc2ef0d, 0 10px 25px 0 #3abde40d',
    });
}

function showModal(element: HTMLDivElement): void {
    applyStyles(element, {
        'opacity': '1',
        'visibility': 'visible',
        'transform': 'scale(1.0)',
        'transition': 'visibility 0s linear 0s, opacity 0.25s 0s, transform 0.25s',
    });
}

function hideModal(element: HTMLDivElement): void {
    applyStyles(element, {
        'opacity': '0',
        'visibility': 'hidden',
        'transform': 'scale(1.1)',
    });
}

export function getButton(text: string, onClick: Function): HTMLElement {
    const button = document.createElement('button');
    button.innerText = text;
    button.addEventListener('click', () => onClick && onClick());
    return applyStyles(button, {
        'background-color': '#2c95b57a',
        'padding': '1rem 2rem',
        'margin-top': '1rem',
        'width': '20rem',
        'border-radius': '0.5rem',
        'color': '#ffffff',
        'font-family': 'monospace',
        'text-align': 'center',
        'box-shadow': '0 4px 8px 0 #2cc2ef0d, 0 10px 25px 0 #3abde40d',
        'outline': 'none',
        'border': 'none',
    });
}

function applyStyles<T extends HTMLElement>(element: T, styles: Record<string,string>): T {
    Object.keys(styles).forEach(key => element.style[key] = styles[key]);

    return element;
}