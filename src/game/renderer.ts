import { Vector } from "./types/vector.interface";

export class Renderer {
    public static drawPoint(position: Vector, size: number, color: string, context: CanvasRenderingContext2D) {
        context.fillStyle = `#${color}`;
        context.beginPath();
        context.arc(position.x, position.y, size, 0, 2*Math.PI);
        context.stroke();
        context.fill();
    }

    public static drawLine(p1: Vector, p2: Vector, color: string, context: CanvasRenderingContext2D) {
        context.beginPath();
        context.strokeStyle = `#${color}`;
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
        context.stroke();
        context.fill();
    }
}