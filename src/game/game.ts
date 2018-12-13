import { map, tap } from 'rxjs/operators';
import { Observable, of, fromEvent, BehaviorSubject } from 'rxjs';
import { Loop } from './loop';
import { Renderer } from './renderer';
import { EntityAbstract } from './types/entity.abstract';
import { repeat } from './util';

export class Game {
    private static readonly CANVAS_WIDTH = 500;
    private static readonly CANVAS_HEIGHT = 500;
    private static readonly CANVAS_CENTER_X = Game.CANVAS_WIDTH / 2;
    private static readonly CANVAS_CENTER_Y = Game.CANVAS_HEIGHT / 2;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gameState$ = new BehaviorSubject({});
    private sensitiveAreas = [];

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
        this.addBoard();
    }

    private initLoop(mainStream$: Observable<[number, Record<string,string>, Record<string, number>, Record<string,string>]>) {
        mainStream$
            .pipe(
                map(([deltaTime, keysDown, click, gameState]: [number, Record<string,string>, Record<string, number>, Record<string,string>]) => 
                    this.update(deltaTime, gameState, keysDown, click)
                ),
                tap((gameState) => this.gameState$.next(gameState))
            )
            .subscribe(() => this.render()); 
    }

    private update(
        deltaTime: number,
        keysDown: Record<string, string>,
        gameState: Record<string, string>,
        click: Record<string, number>
    ): Record<string, string> {
        this.objects.forEach((object: EntityAbstract) => object.update(deltaTime, keysDown, gameState));

        const dx = this.canvas.offsetLeft;
        const dy = this.canvas.offsetTop;
        
        if (click) {
            this.sensitiveAreas
                .filter((area) => 
                    dx+area.x < click.x 
                    && dx+area.xe > click.x 
                    && dy+area.y < click.y 
                    && dy+area.ye > click.y
                )
                .forEach(({trigger, link}) => trigger(link));
        }

        return {};
    }

    private render(): void {
        this.clear();
        this.objects.forEach((object: EntityAbstract) => object.render(this.context));
    }

    private clear(): void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private addBoard(): void {
        const CELL_SIZE = 50;
        const PADDING = 10;
        const CELL_COLOR = '4078a0';

        const cellsAuto = (o, s, p) => [o-p-s, o, o+p+s]
        const [xCellAutoArr, yCellAutoArr] = [Game.CANVAS_CENTER_X, Game.CANVAS_CENTER_Y].map(o => cellsAuto(o, CELL_SIZE, PADDING));

        repeat(9, (i: number) => this.addCell(i, CELL_SIZE, CELL_COLOR, xCellAutoArr, yCellAutoArr));
    }

    private addCell(i: number, cellSize: number, cellColor: string, xCellAutoArr: number[], yCellAutoArr: number[]): void {
        const cell = {
            render: (ctx: CanvasRenderingContext2D) => Renderer.drawRect(
                ctx, 
                {x: xCellAutoArr[Math.floor(i%3)], y: yCellAutoArr[Math.floor(i/3)]}, 
                {x: cellSize, y: cellSize}, 
                cellColor,
            ),
            update: _ => null,
        };

        this.objects.push(cell);

        this.sensitiveAreas.push({
            x: xCellAutoArr[Math.floor(i%3)]-cellSize/2,
            y: yCellAutoArr[Math.floor(i/3)]-cellSize/2,
            xe: xCellAutoArr[Math.floor(i%3)]+cellSize/2,
            ye: yCellAutoArr[Math.floor(i/3)]+cellSize/2,
            link: cell,
            trigger: () =>  
                this.objects.push({
                    render: (ctx: CanvasRenderingContext2D) => Renderer.drawRect(
                        ctx, 
                        {x: xCellAutoArr[Math.floor(i%3)], y: yCellAutoArr[Math.floor(i/3)]}, 
                        {x: cellSize, y: cellSize}, 
                        '3bb5e5',
                    ),
                    update: _ => null,
                })
        })
    }
}
