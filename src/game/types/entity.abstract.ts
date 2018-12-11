export abstract class EntityAbstract {
    public abstract render(context: CanvasRenderingContext2D): void;
    public abstract update(deltaTime: number, keysDown: Record<string, string>, gameState: Record<string, string>): void;
}