export abstract class EntityAbstract {
    public abstract render(context: CanvasRenderingContext2D): void;
    public abstract update(deltaTime: number, keysDown: Record<string, string>, click: Record<string, number>, gameState: Record<string, string>): void;
}