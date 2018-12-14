export function alertIt(text: string) {
    showModal(modal);
    modalContent.innerText = text;
}

const modal = getModal();
document.body.appendChild(modal);

const modalContent = getModalContent();
modal.appendChild(modalContent);

function getModal(): HTMLDivElement {
    const div = document.createElement('div');
    div.addEventListener('click', () => hideModal(div));
    const style = {
        'position': 'fixed',
        'left': '0',
        'top': '0',
        'width': '100%',
        'height': '100%',
        'background-color': 'rgba(0, 0, 0, 0.3)',
        'opacity': '0',
        'visibility': 'hidden',
        'transition': 'visibility 0s linear 0.25s, opacity 0.25s 0s, transform 0.25s'
    };
    Object.keys(style).forEach(key => div.style[key] = style[key]);
    return div;
}

function getModalContent(): HTMLDivElement {
    const div = document.createElement('div');
    const style = {
        'position': 'absolute',
        'top': '50%',
        'left': '50%',
        'transform': 'translate(-50%, -50%)',
        'background-color': '#2c95b57a',
        'padding': '1.5rem 2rem',
        'width': '24rem',
        'border-radius': '0.5rem',
        'color': '#ffffff',
        'font-family': 'monospace',
        'font-size': '120%',
        'text-align': 'center',
    };
    Object.keys(style).forEach(key => div.style[key] = style[key]);
    return div;
}

function showModal(element: HTMLDivElement): void {
    const style = {
        'opacity': '1',
        'visibility': 'visible',
        'transform': 'scale(1.0)',
        'transition': 'visibility 0s linear 0s, opacity 0.25s 0s, transform 0.25s',
    };
    Object.keys(style).forEach(key => element.style[key] = style[key]);
}

function hideModal(element: HTMLDivElement): void {
    const style = {
        'opacity': '0',
        'visibility': 'hidden',
        'transform': 'scale(1.1)',
    };
    Object.keys(style).forEach(key => element.style[key] = style[key]);
}