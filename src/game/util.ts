export function repeat(nTimes: number, func: (i: number) => void) {
    for (let i = 0; i < nTimes; i++) {
        func(i);
    }
}

export function lerp(start: number, target: number, dta: number) {
    return (1 - dta) * start + dta * target;
}

export function lerpAnimation(start: number, target: number, past, duration: number) {
    return lerp(start, target, past / duration);
}