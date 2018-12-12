import { Vector } from "./types/vector.interface";

export class Renderer {
    public static drawPoint(context: CanvasRenderingContext2D, position: Vector, size: number, color: string): void {
        context.fillStyle = `#${color}`;
        context.beginPath();
        context.arc(position.x, position.y, size, 0, 2*Math.PI);
        context.stroke();
        context.fill();
    }

    public static drawLine(context: CanvasRenderingContext2D, p1: Vector, p2: Vector, color: string): void {
        context.beginPath();
        context.strokeStyle = `#${color}`;
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
        context.stroke();
        context.fill();
    }

    public static drawRect(context: CanvasRenderingContext2D, center: Vector, size: Vector, color: string): void {
        context.fillStyle = `#${color}`;
        context.rect(center.x-size.x/2, center.y-size.x/2, size.x, size.y);
        context.fill();
    }
}