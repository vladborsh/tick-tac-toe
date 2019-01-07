import { EntityAbstract } from "./types/entity.abstract";
import { Vector } from "./types/vector.interface";
import { Renderer } from "./renderer";
import { lerp, lerpAnimation } from "./util";
import { CellType } from "./types/cell-type.enum";

export namespace GameContext {
    abstract class CellEntity extends EntityAbstract {
        protected spawnTimePast = 0;
        protected startCellSize;
        protected targetCellSize;
        protected currentCellSize;

        constructor(protected position: Vector, protected cellSize: number) {
            super();
        }

        public update(
            deltaTime: number,
            keysDown: Record<string, string>,
            click: Record<string, number>,
            gameState: Record<string, string>
        ): void {
            if (this.spawnTimePast < GameContext.Config.CELL_SPAWN_ANIMATION_DURATION) {
                this.currentCellSize = lerpAnimation(
                    this.startCellSize, 
                    this.targetCellSize, 
                    this.spawnTimePast,
                    GameContext.Config.CELL_SPAWN_ANIMATION_DURATION
                );

                this.spawnTimePast += deltaTime;
            }
        }
    }

    export class TickCell extends CellEntity {
        protected startCellSize = this.cellSize+20;
        protected targetCellSize = this.cellSize-30;
        protected currentCellSize;

        constructor(protected position: Vector, protected cellSize: number) {
            super(position, cellSize);
        }

        public render(context: CanvasRenderingContext2D): void {
            Renderer.drawTick(
                context,
                this.position, 
                this.currentCellSize,
                GameContext.Config.TICK_COLOR,
            )
        }
    }

    export class TacCell extends CellEntity {
        protected startCellSize = this.cellSize+20;
        protected targetCellSize = this.cellSize-20;
        protected currentCellSize;

        constructor(protected position: Vector, protected cellSize: number) {
            super(position, cellSize);
        }

        public render(context: CanvasRenderingContext2D): void {
            Renderer.drawCircle(
                context,
                this.position, 
                this.currentCellSize,
                8, 
                GameContext.Config.TAC_COLOR,
            )
        }
    }

    export class EmptyCell extends EntityAbstract {
        private area: [Vector, Vector] = [
            {
                x: this.position.x - this.cellSize/2,
                y: this.position.y - this.cellSize/2,
            },
            {
                x: this.position.x + this.cellSize/2,
                y: this.position.y + this.cellSize/2,
            }
        ];

        constructor(
            private position: Vector,
            private cellSize: number,
            private objectsRef: EntityAbstract[],
            private cellCoordinate: Vector
        ) {
            super();
        }

        public render(context: CanvasRenderingContext2D): void {
            Renderer.drawRect(
                context, 
                this.position, 
                { x: this.cellSize, y: this.cellSize }, 
                GameContext.Config.CELL_COLOR,
            )
        }

        public update(
            deltaTime: number,
            keysDown: Record<string, string>,
            click: Record<string, number>,
            gameState: Record<string, any>
        ): void {
            if (click
                && this.area[0].x < click.x 
                && this.area[1].x > click.x 
                && this.area[0].y < click.y 
                && this.area[1].y > click.y
                && !gameState.board[this.cellCoordinate.x][this.cellCoordinate.y]
                && !gameState.winner
            ) {
                this.objectsRef.push(
                    ({
                        [CellType.TAC]: () => new GameContext.TacCell(this.position, this.cellSize),
                        [CellType.TICK]: () => new GameContext.TickCell(this.position, this.cellSize),
                    })[gameState.currentTurn]()
                );

                gameState.currentTurn = gameState.currentTurn === CellType.TAC ? CellType.TICK : CellType.TAC;
                gameState.winner = GameContext.isWinner(gameState.board) ? gameState.currentTurn : undefined
            }
        }
    }

    export function isWinner(board: CellType[][]): boolean {
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

    export class Config {
        public static readonly CANVAS_WIDTH = document.documentElement.clientWidth;
        public static readonly CANVAS_HEIGHT = document.documentElement.clientHeight;
        public static readonly CANVAS_CENTER_X = Config.CANVAS_WIDTH / 2;
        public static readonly CANVAS_CENTER_Y = Config.CANVAS_HEIGHT / 2;
        public static readonly CELL_SIZE = 50;
        public static readonly PADDING = 10;
        public static readonly CELL_COLOR = '4078a0';
        public static readonly TICK_COLOR = '6dcea4d4';
        public static readonly TAC_COLOR = 'b19fead4';
        public static readonly CELL_SPAWN_ANIMATION_DURATION = 0.5;
    }
}