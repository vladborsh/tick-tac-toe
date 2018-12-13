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
    }

    public static drawRect(context: CanvasRenderingContext2D, center: Vector, size: Vector, color: string): void {
        context.fillStyle = `#${color}`;
        context.fillRect(center.x-size.x/2, center.y-size.x/2, size.x, size.y);
    }

    public static drawCircle(context: CanvasRenderingContext2D, position: Vector, diameter: number, width: number, color: string) {
        context.beginPath();
        context.lineWidth = width;
        context.strokeStyle = `#${color}`;
        context.arc(position.x, position.y, diameter/2-width/2, 0, 2 * Math.PI);
        context.stroke();
    }

    public static drawTick(context: CanvasRenderingContext2D, position: Vector, size: number, color: string): void {
        context.beginPath();
        context.strokeStyle = `#${color}`;
        context.moveTo(position.x - size/2, position.y - size/2);
        context.lineTo(position.x + size/2, position.y + size/2);
        context.stroke();
        context.beginPath();
        context.strokeStyle = `#${color}`;
        context.moveTo(position.x - size/2, position.y + size/2);
        context.lineTo(position.x + size/2, position.y - size/2);
        context.stroke();
    }
}