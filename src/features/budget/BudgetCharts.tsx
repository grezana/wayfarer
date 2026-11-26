import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../trips/tripCovers';

export interface CategoryChartDatum {
  category: string;
  label: string;
  value: number;
  color: string;
}

export interface DailyChartDatum {
  date: string;
  label: string;
  amount: number;
}

interface BudgetChartsProps {
  currency: string;
  totalSpent: number;
  categoryData: CategoryChartDatum[];
  dailyData: DailyChartDatum[];
}

export const BudgetCharts: React.FC<BudgetChartsProps> = ({
  currency,
  totalSpent,
  categoryData,
  dailyData,
}) => {
  const theme = useTheme();

  if (categoryData.length === 0) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Spending by Category
          </Typography>

          <Box sx={{ position: 'relative', width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={3}
                  stroke="none"
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => formatCurrency(val, currency)}
                  contentStyle={{
                    borderRadius: 14,
                    border: 'none',
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL
              </Typography>
              <Typography variant="subtitle2" fontWeight={700}>
                {formatCurrency(totalSpent, currency)}
              </Typography>
            </Box>
          </Box>

          <Stack spacing={1} sx={{ mt: 1 }}>
            {categoryData.map((item) => {
              const pct = totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0;
              return (
                <Box
                  key={item.category}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" fontWeight={500} noWrap>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(item.value, currency)}{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                      ({pct}%)
                    </Typography>
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {dailyData.length > 0 && (
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Daily Spending
            </Typography>

            <Box sx={{ width: '100%', height: 210, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={theme.palette.divider}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: theme.palette.action.hover }}
                    formatter={(val: number) => [formatCurrency(val, currency), 'Spent']}
                    contentStyle={{
                      borderRadius: 14,
                      border: 'none',
                      backgroundColor: theme.palette.background.default,
                      color: theme.palette.text.primary,
                      boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    fill={theme.palette.primary.main}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};
