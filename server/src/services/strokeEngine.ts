import { Stroke, Point } from '../shared/types.js';

interface RoomCanvasState {
  roomId: string;
  strokes: Stroke[];
  undoneStrokes: Stroke[];
  lastModified: number;
}

class StrokeEngineService {
  private roomStates: Map<string, RoomCanvasState> = new Map();

  private getOrCreateRoom(roomId: string): RoomCanvasState {
    if (!this.roomStates.has(roomId)) {
      this.roomStates.set(roomId, {
        roomId,
        strokes: [],
        undoneStrokes: [],
        lastModified: Date.now()
      });
    }
    return this.roomStates.get(roomId)!;
  }

  loadRoomStrokes(roomId: string, strokes: Stroke[]): void {
    const state = this.getOrCreateRoom(roomId);
    state.strokes = [...strokes];
    state.undoneStrokes = [];
    state.lastModified = Date.now();
  }

  getRoomStrokes(roomId: string): Stroke[] {
    const state = this.getOrCreateRoom(roomId);
    return state.strokes;
  }

  addStroke(roomId: string, stroke: Stroke): Stroke {
    const state = this.getOrCreateRoom(roomId);
    state.strokes.push(stroke);
    state.undoneStrokes = []; // reset redo stack on new stroke
    state.lastModified = Date.now();
    return stroke;
  }

  undoStroke(roomId: string, userId: string): Stroke | null {
    const state = this.getOrCreateRoom(roomId);
    // Find last stroke by this user or overall
    for (let i = state.strokes.length - 1; i >= 0; i--) {
      if (state.strokes[i].userId === userId || !userId) {
        const [removed] = state.strokes.splice(i, 1);
        state.undoneStrokes.push(removed);
        state.lastModified = Date.now();
        return removed;
      }
    }
    return null;
  }

  redoStroke(roomId: string, userId: string): Stroke | null {
    const state = this.getOrCreateRoom(roomId);
    for (let i = state.undoneStrokes.length - 1; i >= 0; i--) {
      if (state.undoneStrokes[i].userId === userId || !userId) {
        const [recovered] = state.undoneStrokes.splice(i, 1);
        state.strokes.push(recovered);
        state.lastModified = Date.now();
        return recovered;
      }
    }
    return null;
  }

  clearCanvas(roomId: string): void {
    const state = this.getOrCreateRoom(roomId);
    state.strokes = [];
    state.undoneStrokes = [];
    state.lastModified = Date.now();
  }

  /**
   * Generates a scalable vector SVG snapshot from the strokes.
   * This SVG can be rendered directly by web, converted to base64,
   * or cached for iOS WidgetKit and Android RemoteViews widgets.
   */
  generateSvgSnapshot(strokes: Stroke[], width = 400, height = 400, background = '#FAF9FF'): string {
    const pathElements: string[] = [];

    for (const stroke of strokes) {
      if (!stroke.points || stroke.points.length === 0) continue;

      if (stroke.points.length === 1) {
        const pt = stroke.points[0];
        const r = stroke.size / 2;
        const color = stroke.tool === 'eraser' ? background : stroke.color;
        pathElements.push(
          `<circle cx="${pt.x}" cy="${pt.y}" r="${r}" fill="${color}" opacity="${stroke.opacity ?? 1}" />`
        );
        continue;
      }

      let d = `M ${stroke.points[0].x} ${stroke.points[0].y}`;
      for (let i = 1; i < stroke.points.length; i++) {
        const p0 = stroke.points[i - 1];
        const p1 = stroke.points[i];
        const midX = (p0.x + p1.x) / 2;
        const midY = (p0.y + p1.y) / 2;
        d += ` Q ${p0.x} ${p0.y}, ${midX} ${midY}`;
      }
      const last = stroke.points[stroke.points.length - 1];
      d += ` L ${last.x} ${last.y}`;

      const color = stroke.tool === 'eraser' ? background : stroke.color;
      const strokeWidth = stroke.tool === 'eraser' ? stroke.size * 2 : stroke.size;
      const opacity = stroke.tool === 'pencil' ? 0.75 : (stroke.opacity ?? 1);

      pathElements.push(
        `<path d="${d}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" />`
      );
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="${background}" rx="24" />
  ${pathElements.join('\n  ')}
</svg>`;
  }

  generateDataUrl(svg: string): string {
    const base64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }
}

export const strokeEngine = new StrokeEngineService();
