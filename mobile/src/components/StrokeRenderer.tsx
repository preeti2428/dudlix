import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { Stroke } from '../shared/types';

interface StrokeRendererProps {
  strokes: Stroke[];
  width: number;
  height: number;
  backgroundColor?: string;
  style?: any;
}

export const StrokeRenderer: React.FC<StrokeRendererProps> = ({
  strokes,
  width,
  height,
  backgroundColor = '#FAF9FF',
  style,
}) => {
  // Normalize stroke coordinates to match the container dimensions
  // Default coordinate space is 400x400
  const scaleX = width / 400;
  const scaleY = height / 400;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={[{ backgroundColor }, style]}
    >
      {strokes.map((stroke) => {
        if (!stroke.points || stroke.points.length === 0) return null;

        const isEraser = stroke.tool === 'eraser';
        const color = isEraser ? backgroundColor : stroke.color;
        const strokeWidth = (isEraser ? stroke.size * 2 : stroke.size) * Math.min(scaleX, scaleY);
        const opacity = stroke.tool === 'pencil' ? 0.75 : (stroke.opacity ?? 1);

        if (stroke.points.length === 1) {
          const pt = stroke.points[0];
          return (
            <Circle
              key={stroke.id}
              cx={pt.x * scaleX}
              cy={pt.y * scaleY}
              r={strokeWidth / 2}
              fill={color}
              opacity={opacity}
            />
          );
        }

        // Generate smooth quadratic Bézier curve
        let d = `M ${stroke.points[0].x * scaleX} ${stroke.points[0].y * scaleY}`;
        for (let i = 1; i < stroke.points.length; i++) {
          const p0 = stroke.points[i - 1];
          const p1 = stroke.points[i];
          const midX = ((p0.x + p1.x) / 2) * scaleX;
          const midY = ((p0.y + p1.y) / 2) * scaleY;
          d += ` Q ${p0.x * scaleX} ${p0.y * scaleY}, ${midX} ${midY}`;
        }
        const last = stroke.points[stroke.points.length - 1];
        d += ` L ${last.x * scaleX} ${last.y * scaleY}`;

        return (
          <Path
            key={stroke.id}
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          />
        );
      })}
    </Svg>
  );
};

