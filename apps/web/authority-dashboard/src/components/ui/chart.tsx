import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  AreaChart as RechartsAreaChart,
  PieChart as RechartsPieChart,
  Line,
  Bar,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from 'recharts';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(262, 83%, 58%)',
  'hsl(187, 85%, 39%)',
  'hsl(330, 81%, 60%)',
  'hsl(34, 100%, 50%)',
];

interface ChartBaseProps {
  data: Record<string, any>[];
  categories: string[];
  index: string;
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  height?: number;
  className?: string;
  valueFormatter?: (value: number) => string;
}

function CustomTooltip({
  active,
  payload,
  label,
  valueFormatter = (v: number) => String(v),
}: TooltipProps<any, any> & { valueFormatter?: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl px-4 py-3 shadow-xl"
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">{valueFormatter(entry.value)}</span>
        </div>
      ))}
    </motion.div>
  );
}

function LineChart({
  data,
  categories,
  index,
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  height = 300,
  className,
  valueFormatter = (v) => String(v),
}: ChartBaseProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          )}
          <XAxis
            dataKey={index}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          {showTooltip && (
            <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
          )}
          {showLegend && <Legend />}
          {categories.map((category, idx) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 2 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
              animationDuration={1000}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarChart({
  data,
  categories,
  index,
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  height = 300,
  className,
  valueFormatter = (v) => String(v),
}: ChartBaseProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          )}
          <XAxis
            dataKey={index}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          {showTooltip && (
            <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
          )}
          {showLegend && <Legend />}
          {categories.map((category, idx) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[idx % colors.length]}
              radius={[4, 4, 0, 0]}
              animationDuration={800}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AreaChart({
  data,
  categories,
  index,
  colors = CHART_COLORS,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  height = 300,
  className,
  valueFormatter = (v) => String(v),
}: ChartBaseProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          )}
          <XAxis
            dataKey={index}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          {showTooltip && (
            <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
          )}
          {showLegend && <Legend />}
          {categories.map((category, idx) => (
            <Area
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[idx % colors.length]}
              fill={colors[idx % colors.length]}
              fillOpacity={0.15}
              strokeWidth={2}
              animationDuration={1000}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PieChartProps extends Omit<ChartBaseProps, 'categories' | 'index'> {
  data: { name: string; value: number }[];
  innerRadius?: number;
  outerRadius?: number;
}

function PieChart({
  data,
  colors = CHART_COLORS,
  showTooltip = true,
  showLegend = true,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  className,
  valueFormatter = (v) => String(v),
}: PieChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          {showTooltip && (
            <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
          )}
          {showLegend && <Legend />}
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            animationDuration={800}
            animationBegin={0}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={colors[idx % colors.length]} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

export { LineChart, BarChart, AreaChart, PieChart, CHART_COLORS };
