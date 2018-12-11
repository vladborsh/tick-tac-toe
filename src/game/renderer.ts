import { Vector } from "./types/vector.interface";

export class Renderer {
    public static drawPoint(position: Vector, size: number, color: string, context: CanvasRenderingContext2D) {
        context.fillStyle = `#${color}`;
        context.beginPath();
        context.arc(position.x, position.y, size, 0, 2*Math.PI);
        context.stroke();
        context.fill();
    }
}