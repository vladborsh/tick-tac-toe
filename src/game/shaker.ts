export class Shaker {
    private static DEFAULT_TURN_NUMBER = 4;

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
}