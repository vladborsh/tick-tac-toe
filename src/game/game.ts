import { map, tap, filter, distinctUntilChanged } from 'rxjs/operators';
import { Observable, of, fromEvent, BehaviorSubject, Subject } from 'rxjs';
import { Loop } from './loop';
import { Renderer } from './renderer';
import { EntityAbstract } from './types/entity.abstract';
import { repeat } from './util';
import { Vector } from './types/vector.interface';
import { CellType } from './types/cell-type.enum';
import { alertIt } from './ui.util';

export class Game {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gameState$: BehaviorSubject<Record<string,any>> = new BehaviorSubject({});
    private sensitiveAreas = [];
    private board: CellType[][] = Game.INITIAL_BOARD_STATE;
    private currentTurn: CellType = CellType.TAC;
    private winnerDefined = false;
    private objects: EntityAbstract[] = [];
    private shaker: Shaker = new Shaker();

    constructor() {
        this.init();
        this.initLoop(Loop.getMainStream$(this.gameState$));
    }

    public get state$(): Observable<Record<string,any>> {
        return this.gameState$.asObservable();
    }

    private init(): void {
        this.canvas = document.createElement('canvas');
        this.canvas.width = Game.CANVAS_WIDTH;
        this.canvas.height = Game.CANVAS_HEIGHT;
        document.body.style.background = 'rgb(36, 61, 80)';
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        this.context = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        this.clear();
        this.addBoard();
    }

    private initLoop(
        mainStream$: Observable<[
            number,
            Record<string,string>,
            Record<string,number>,
            Record<string,any>
        ]>
    ) {
        mainStream$
            .pipe(
                map((
                    [
                        deltaTime,
                        keysDown,
                        click,
                        gameState
                    ]: [
                        number,
                        Record<string,string>,
                        Record<string, number>,
                        Record<string,any>
                    ]) => this.update(deltaTime, gameState, keysDown, click)
                ),
                tap((gameState) => this.gameState$.next(gameState))
            )
            .subscribe(() => this.render());
            
        this.gameState$
            .pipe(
                filter(state => !!state.winner),
                map(state => state.winner),
                distinctUntilChanged(),
                tap(() => alertIt('We have a winner')),
            ).subscribe();
    }

    private update(
        deltaTime: number,
        keysDown: Record<string, string>,
        gameState: Record<string,any>,
        click: Record<string, number>
    ): Record<string,any> {
        this.objects.forEach((object: EntityAbstract) => object.update(deltaTime, keysDown, gameState));

        const dx = this.canvas.offsetLeft;
        const dy = this.canvas.offsetTop;
        
        if (click && !this.winnerDefined) {
            const foundArea = this.sensitiveAreas
                .find((area) => dx+area.x < click.x 
                    && dx+area.xe > click.x 
                    && dy+area.y < click.y 
                    && dy+area.ye > click.y
                    && !this.board[area.xC][area.yC]
                );
            
            if (foundArea && !this.winnerDefined) {
                this.shaker.activate();
                foundArea.trigger(foundArea.link);
                this.currentTurn = this.currentTurn === CellType.TAC ? CellType.TICK : CellType.TAC;
            }
            
            this.winnerDefined = this.isWinner(this.board);
        }

        return !!gameState.winner 
            ? { winner: undefined }
            : { winner: this.winnerDefined ? this.currentTurn : undefined };
    }

    private render(): void {
        this.clear();

        if(this.shaker.isActive()) {
            this.shaker.shake(this.context);
        }

        this.objects.forEach((object: EntityAbstract) => object.render(this.context));
    }

    private clear(): void {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private addBoard(): void {
        const cellsAuto = (o, s, p) => [o-p-s, o, o+p+s]
        const [
            xCellAutoArr,
            yCellAutoArr
        ] = [Game.CANVAS_CENTER_X, Game.CANVAS_CENTER_Y].map(
            (o: number) => cellsAuto(o, Game.CELL_SIZE, Game.PADDING)
        );

        repeat(9, (i: number) => this.addCell(i, Game.CELL_SIZE, Game.CELL_COLOR, xCellAutoArr, yCellAutoArr));
    }

    private addCell(
        i: number,
        cellSize: number,
        cellColor: string,
        xCellAutoArr: number[],
        yCellAutoArr: number[]
    ): void {
        const xC: number = Math.floor(i%3);
        const yC: number = Math.floor(i/3);

        const cell: EntityAbstract = {
            render: (ctx: CanvasRenderingContext2D) => Renderer.drawRect(
                ctx, 
                {x: xCellAutoArr[xC], y: yCellAutoArr[yC]}, 
                {x: cellSize, y: cellSize}, 
                cellColor,
            ),
            update: _ => null,
        };

        this.objects.push(cell);

        this.sensitiveAreas.push(this.addSensitiveArea(cellSize, xCellAutoArr, yCellAutoArr, xC, yC, cell));
    }

    private addSensitiveArea(
        cellSize: number,
        xCellAutoArr: number[],
        yCellAutoArr: number[],
        xC: number,
        yC: number,
        cell: EntityAbstract
    ) {
        return {
            xC,
            yC,
            x: xCellAutoArr[xC]-cellSize/2,
            y: yCellAutoArr[yC]-cellSize/2,
            xe: xCellAutoArr[xC]+cellSize/2,
            ye: yCellAutoArr[yC]+cellSize/2,
            link: cell,
            trigger: () => {
                if (this.board[xC][yC] === null) {
                    ({
                        [CellType.TAC]: () => this.addTac({x: xCellAutoArr[xC], y: yCellAutoArr[yC]}, cellSize),
                        [CellType.TICK]: () => this.addTick({x: xCellAutoArr[xC], y: yCellAutoArr[yC]}, cellSize),
                    })[this.currentTurn]();

                    this.board[xC][yC] = this.currentTurn;
                }
            }
        };
    }

    private addTac(position: Vector, cellSize: number): void {
        this.objects.push({
            render: (ctx: CanvasRenderingContext2D) => Renderer.drawCircle(
                ctx,
                position, 
                cellSize-20,
                8, 
                Game.TAC_COLOR,
            ),
            update: _ => null,
        })
    }

    private addTick(position: Vector, cellSize: number): void {
        this.objects.push({
            render: (ctx: CanvasRenderingContext2D) => Renderer.drawTick(
                ctx,
                position, 
                cellSize-30,
                Game.TICK_COLOR,
            ),
            update: _ => null,
        })
    }

    private isWinner(board: CellType[][]): boolean {
        for (let i = 0; i < 3; i++) {
            const sumRow = board[i].reduce((acc, curr: number) => acc += curr, 0);
            const sumColl = board.reduce((acc, curr: number[]) => acc += curr[i], 0);
            const isWinner = sumRow === -3 || sumRow === 3 || sumColl === 3 || sumColl === -3;

            if (isWinner) {
                return true;
            }
        }

        return (board[0][0] + board[1][1] + board[2][2] === 3)
            || (board[0][0] + board[1][1] + board[2][2] === -3) 
            || (board[0][2] + board[1][1] + board[2][0] === 3)
            || (board[0][2] + board[1][1] + board[2][0] === -3);
    }

    private static get INITIAL_BOARD_STATE(): CellType[][] {
        return [
            [null, null, null],
            [null, null, null],
            [null, null, null],
        ];
    }

    private static readonly CANVAS_WIDTH = document.documentElement.clientWidth;

    private static readonly CANVAS_HEIGHT = document.documentElement.clientHeight;

    private static readonly CANVAS_CENTER_X = Game.CANVAS_WIDTH / 2;

    private static readonly CANVAS_CENTER_Y = Game.CANVAS_HEIGHT / 2;
    
    private static readonly CELL_SIZE = 50;
    
    private static readonly PADDING = 10;
    
    private static readonly CELL_COLOR = '4078a0';

    private static readonly TICK_COLOR = '6dcea4d4';

    private static readonly TAC_COLOR = 'b19fead4';
}

class Shaker {
    private active = false;
    private currentTurn = 0;
    private topDirection: boolean;
    private iterator: number;

    public isActive(): boolean {
        return this.active;
    }
    
    public shake(context: CanvasRenderingContext2D): void {
        if (this.iterator == 2) {
            this.currentTurn--;
            this.iterator = 0;
        } 

        context.translate(0, (this.topDirection ? -1 : 1) * this.currentTurn);
        this.topDirection = !this.topDirection;
        
        this.iterator++;

        if (this.currentTurn == 0) {
            this.stop();
        }
    }
    
    public activate(): void {
        this.active = true;
        this.topDirection = false;
        this.currentTurn = Shaker.DEFAULT_TURN_NUMBER;
        this.iterator = 0;
    }

    public stop(): void {
        this.active = false;
    }

    private static DEFAULT_TURN_NUMBER = 4;
}