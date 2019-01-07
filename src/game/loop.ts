import { withLatestFrom, map, tap, buffer, filter, expand, share } from "rxjs/operators";
import { Observable, fromEvent, of, BehaviorSubject } from "rxjs";
import { KeyUtil } from "./key.util";
import { IFrameData } from "./types/frame-data.interface";

export class Loop {
     /**
     * We subscribe to our frames$ stream, and make sure to
     * combine in the latest emission from our inputs stream to get the data
     * we need do perform our gameState updates.
     */
    public static getMainStream$(
        gameState$: BehaviorSubject<Record<string,string>>
    ): Observable<[number, Record<string,string>, Record<string, number>, Record<string,string>]> {
        return this.frames$()
            .pipe(
                withLatestFrom(
                    this.keysDownPerFrame$(),
                    this.mouseClickPerFrame$(),
                    gameState$,
                ),
            );
    }

    /**
     * Here we buffer our keyDown stream until we get a new frame emission. This
     * gives us a set of all the keyDown events that have triggered since the previous
     * frame. We reduce these all down to a single dictionary of keys that were pressed.
     */
    private static keysDownPerFrame$(): Observable<Record<string, string>> {
        return this.keysDown$()
            .pipe(
                buffer(this.frames$()),
                map((frames: Array<any>) => 
                    frames.reduce((acc, curr) => ({ ...acc, curr }), []),
                ),
            );
    }

    private static mouseClickPerFrame$(): Observable<Record<string, number>> {
        return fromEvent(document, 'click')
            .pipe(
                filter((event) => !!event),
                buffer(this.frames$()),
                map((frames: Array<Event>) => {
                    if (!frames.length) return undefined;
                    
                    const { clientX, clientY } = frames.pop() as MouseEvent;

                    return {
                        x: clientX,
                        y: clientY,
                    };
                }),
            );
    }

    /** 
     * This is our core stream of keyDown input events. It emits an object like `{"spacebar": 32}`
     * each time a key is pressed down.
     */
    private static keysDown$(): Observable<Record<string, string>> {
        return fromEvent(document, 'keydown')
            .pipe(
                map((event: KeyboardEvent) => {
                    const name = KeyUtil.codeToKey(''+event.keyCode);
                    if (name !== '') {
                        let keyMap = {};
                        keyMap[name] = event.code;
                        return keyMap;
                    } else {
                        return undefined;
                    }
                }),
                filter((keyMap) => keyMap !== undefined)
            );
    }

    /**
     * This is our core stream of frames. We use expand to recursively call the
     * `calculateStep` function above that will give us each new Frame based on the
     * window.requestAnimationFrame calls. Expand emits the value of the called functions
     * returned observable, as well as recursively calling the function with that same
     * emitted value. This works perfectly for calculating our frame steps because each step
     * needs to know the lastStepFrameTime to calculate the next. We also only want to request
     * a new frame once the currently requested frame has returned.
     */
    private static frames$(): Observable<number> {
        return of(undefined)
            .pipe(
                expand((val) => this.calculateStep(val)),
                // Expand emits the first value provided to it, we just want to ignore the undefined input frame
                filter(frame => frame !== undefined),
                map((frame: IFrameData) => frame.deltaTime),
                share()
            )
    }

    /**
     * This function returns an observable that will emit the next frame once the
     * browser has returned an animation frame step. Given the previous frame it calculates
     * the delta time, and we also clamp it to 30FPS in case we get long frames.
     */
    private static calculateStep(prevFrame: IFrameData): Observable<IFrameData> {
        return Observable.create((observer) => {
            requestAnimationFrame((frameStartTime) => {
                const deltaTime = prevFrame ? (frameStartTime - prevFrame.frameStartTime)/1000 : 0;
                observer.next({
                    frameStartTime,
                    deltaTime
                });
            })
        })
        .pipe(
            map(Loop.clampTo30FPS)
        )
    };

    /**
     * clampTo30FPS(frame)
     * @param frame - {IFrameData} the frame data to check if we need to clamp to max of 30fps time.
     * If we get sporadic LONG frames (browser was navigated away or some other reason the frame takes a while) we want to throttle that so we don't JUMP ahead in any deltaTime calculations too far.
     */
    private static clampTo30FPS = (frame: IFrameData) => {
        if(frame.deltaTime > (1/30)) {
            frame.deltaTime = 1/30;
        }

        return frame;
    }
}