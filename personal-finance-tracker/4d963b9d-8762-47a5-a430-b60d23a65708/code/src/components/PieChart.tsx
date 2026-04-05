'use client';

import { PieChartData } from '@/lib/aggregates';

interface PieChartProps {
  data: PieChartData[];
  onSegmentClick?: (segment: PieChartData) => void;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function PieChart({
  data,
  onSegmentClick,
  size = 200,
  strokeWidth = 2,
  className = '',
}: PieChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
          <span className="text-gray-500 text-sm text-center px-4">
            No expense data
          </span>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.amountCents, 0);
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  let cumulativeAngle = 0;

  const segments = data.map((segment) => {
    const angle = (segment.amountCents / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;

    const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = center + radius * Math.cos(((startAngle + angle) * Math.PI) / 180);
    const y2 = center + radius * Math.sin(((startAngle + angle) * Math.PI) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    const segmentCenterAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.7;
    const labelX = center + labelRadius * Math.cos((segmentCenterAngle * Math.PI) / 180);
    const labelY = center + labelRadius * Math.sin((segmentCenterAngle * Math.PI) / 180);

    return {
      ...segment,
      pathData,
      labelX,
      labelY,
      startAngle,
      angle,
    };
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className={`relative ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        {segments.map((segment) => (
          <g
            key={segment.categoryId}
            onClick={() => onSegmentClick?.(segment)}
            className={onSegmentClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}
          >
            <path
              d={segment.pathData}
              fill={segment.categoryColor || '#6b7280'}
              stroke="#ffffff"
              strokeWidth={strokeWidth}
              className="transition-transform hover:scale-105"
            />
            {segment.percentage > 10 && (
              <text
                x={segment.labelX}
                y={segment.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-semibold fill-white pointer-events-none"
              >
                {segment.percentage.toFixed(0)}%
              </text>
            )}
          </g>
        ))}
        <circle cx={center} cy={center} r={radius * 0.3} fill="#ffffff" />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm font-semibold fill-gray-700"
        >
          {formatCurrency(total)}
        </text>
        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs fill-gray-500"
        >
          Total
        </text>
      </svg>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {segments.map((segment) => (
          <div
            key={segment.categoryId}
            className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onSegmentClick?.(segment)}
          >
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: segment.categoryColor || '#6b7280' }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {segment.categoryName}
              </div>
              <div className="text-xs text-gray-500">
                {segment.percentage.toFixed(1)}%
              </div>
            </div>
            <div className="font-semibold text-sm">
              {formatCurrency(segment.amountCents)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}