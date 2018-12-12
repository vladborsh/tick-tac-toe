export function repeat(nTimes: number, func: (i: number) => void) {
    for (let i = 0; i < nTimes; i++) {
        func(i);
    }
}