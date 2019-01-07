import { map, tap, filter, distinctUntilChanged } from 'rxjs/operators';
import { Observable, of, fromEvent, BehaviorSubject, Subject } from 'rxjs';
import { Loop } from './loop';
import { Renderer } from './renderer';
import { EntityAbstract } from './types/entity.abstract';
import { repeat } from './util';
import { Vector } from './types/vector.interface';
import { CellType } from './types/cell-type.enum';
import { alertIt, getButton } from './ui.util';
import { Shaker } from './shaker';
import { GameContext } from './game-context';

export class Game {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gameState$: BehaviorSubject<Record<string, any>> = new BehaviorSubject({
        winner: undefined,
        board: Game.INITIAL_BOARD_STATE,
        currentTurn: CellType.TAC,
    });
    private sensitiveAreas = [];
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
        this.canvas.width = GameContext.Config.CANVAS_WIDTH;
        this.canvas.height = GameContext.Config.CANVAS_HEIGHT;
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
            Record<string, string>,
            Record<string, number>,
            Record<string, any>
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
                        Record<string, string>,
                        Record<string, number>,
                        Record<string, any>
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
                tap(() => {
                    alertIt('We have a winner', getButton('Reset', () => {
                        this.objects = this.objects.slice(0,9);
                        this.gameState$.next({
                            winner: undefined,
                            board: Game.INITIAL_BOARD_STATE,
                        })
                    }))
                }),
            ).subscribe();
    }

    private update(
        deltaTime: number,
        gameState: Record<string, any>,
        keysDown: Record<string, any>,
        click: Record<string, number>,
    ): Record<string,any> {
        const projectedClick = click && {
            x: click.x - this.canvas.offsetLeft,
            y: click.y - this.canvas.offsetTop,
        };
        
        this.objects.forEach((object: EntityAbstract) => object.update(deltaTime, keysDown, click, gameState));
        
        const dx = this.canvas.offsetLeft;
        const dy = this.canvas.offsetTop;

        let currentTurn = gameState.currentTurn;
        
        if (click && !gameState.winner) {
            const foundArea = this.sensitiveAreas
                .find((area) => dx+area.x < click.x 
                    && dx+area.xe > click.x 
                    && dy+area.y < click.y 
                    && dy+area.ye > click.y
                    && !gameState.board[area.xC][area.yC]
                );
            
            if (foundArea && !gameState.winner) {
                this.shaker.activate();
                foundArea.trigger(gameState);
                currentTurn = gameState.currentTurn === CellType.TAC ? CellType.TICK : CellType.TAC;
            }
        }

        return !!gameState.winner 
            ? { ...gameState, winner: undefined }
            : { 
                ...gameState, 
                winner: this.isWinner(gameState.board) ? gameState.currentTurn : undefined,
                currentTurn,
            };
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
        ] = [GameContext.Config.CANVAS_CENTER_X, GameContext.Config.CANVAS_CENTER_Y].map(
            (o: number) => cellsAuto(o, GameContext.Config.CELL_SIZE, GameContext.Config.PADDING)
        );

        repeat(9, (i: number) => this.addCell(
            i, 
            GameContext.Config.CELL_SIZE, 
            GameContext.Config.CELL_COLOR, 
            xCellAutoArr, 
            yCellAutoArr)
        );
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
            trigger: (gameState: Record<string,any>) => {
                if (gameState.board[xC][yC] === null) {
                    ({
                        [CellType.TAC]: () => this.addTac({x: xCellAutoArr[xC], y: yCellAutoArr[yC]}, cellSize),
                        [CellType.TICK]: () => this.addTick({x: xCellAutoArr[xC], y: yCellAutoArr[yC]}, cellSize),
                    })[gameState.currentTurn]();

                    gameState.board[xC][yC] = gameState.currentTurn;
                }
            }
        };
    }

    private addTac(position: Vector, cellSize: number): void {
        this.objects.push(new GameContext.TacCell(position, cellSize));
    }

    private addTick(position: Vector, cellSize: number): void {
        this.objects.push(new GameContext.TickCell(position, cellSize));
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
}