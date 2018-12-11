import { buffer, bufferCount, expand, filter, map,  share, tap, withLatestFrom } from 'rxjs/operators';
import { Observable, of, fromEvent, BehaviorSubject } from 'rxjs';
import { KeyUtil } from './key.util';
import { Loop } from './loop';
import { Renderer } from './renderer';
import { EntityAbstract } from './types/entity.abstract';

export class Game {
    private static readonly CANVAS_WIDTH = 500;
    private static readonly CANVAS_HEIGHT = 500;
    private static readonly CANVAS_CENTER_X = Game.CANVAS_WIDTH / 2;
    private static readonly CANVAS_CENTER_Y = Game.CANVAS_HEIGHT / 2;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gameState$ = new BehaviorSubject({});
    private loop$: Observable<[number, Record<string,string>]>

    private objects: EntityAbstract[] = [];
    
    constructor() {
        this.init();
        this.initLoop(Loop.getMainStream$(this.gameState$));
    }

    private init(): void {
        this.canvas = document.createElement('canvas');
        this.canvas.width = Game.CANVAS_WIDTH;
        this.canvas.height = Game.CANVAS_HEIGHT;
        this.canvas.style.margin = '100px auto';
        this.canvas.style.display = 'block';
        this.canvas.style['box-shadow'] = '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 10px 25px 0 rgba(0, 0, 0, 0.19)';
        document.body.style.background = 'rgb(36, 61, 80)';
        this.context = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        this.clear();
        this.objects.push({
            render: (ctx) => Renderer.drawPoint({x:50, y:50}, 4, 'ffffff', ctx);
            update: () => null,
        })
    }

    private initLoop(mainStream$: Observable<[number, Record<string,string>, Record<string,string>]>) {
        mainStream$
            .pipe(
                map(([deltaTime, keysDown, gameState]: [number, Record<string, string>, Record<string, string>]) => 
                    this.update(deltaTime, gameState, keysDown)
                ),
                tap((gameState) => this.gameState$.next(gameState))
            )
            .subscribe(() => this.render()); 
    }

    private update(deltaTime: number, keysDown: Record<string, string>, gameState: Record<string, string>): Record<string, string> {
        this.objects.forEach((object: EntityAbstract) => object.update(deltaTime, keysDown, gameState));
        return {};
    }

    private render(): void {
        this.clear();
        this.objects.forEach((object: EntityAbstract) => object.render(this.context));
    }

    private clear(): void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
