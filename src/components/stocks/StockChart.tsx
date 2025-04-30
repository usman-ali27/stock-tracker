"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, ChartData, ChartOptions, TooltipItem, Scale, CoreScaleOptions, Tick } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface StockChartProps {
  symbol: string;
  data: {
    labels: string[];
    prices: number[];
  };
}

const StockChart = ({ symbol, data }: StockChartProps) => {
  console.log(data)
  const chartData: ChartData<'line'> = {
    labels: data.labels.map((timestamp) => {
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: symbol,
        data: data.prices,
        borderColor: '#34D399',
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(52, 211, 153, 0.3)');
          gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#34D399',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const prices = data.prices;
  const minPrice = Math.min(...prices) * 0.95;
  const maxPrice = Math.max(...prices) * 1.05;

  const options: ChartOptions<'line'> = {
    animation: {
      duration: 600,
      easing: 'easeInOutQuad',
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          title: (tooltipItems: TooltipItem<'line'>[]) => {
            const index = tooltipItems[0].dataIndex;
            const timestamp = data.labels[index];
            const date = new Date(timestamp);
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          },
          label: (context: TooltipItem<'line'>) => {
            const price = context.parsed.y;
            return `Price: $${price.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#A1A1AA',
          maxTicksLimit: 6,
          callback: function (this: Scale<CoreScaleOptions>, tickValue: string) {
            const labelIndex = typeof tickValue === 'number' ? tickValue : parseInt(tickValue, 10);
            if (data.labels[labelIndex]) {
              const date = new Date(data.labels[labelIndex]);
              return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            }
            return '';
          },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#A1A1AA',
          callback: function (this: Scale<CoreScaleOptions>, tickValue: string) {
            const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
            return `$${value.toFixed(2)}`;
          },
        },
        min: minPrice > 0 ? minPrice : 0,
        max: maxPrice > 0 ? maxPrice : 1,
        beginAtZero: false,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    hover: {
      mode: 'nearest',
      intersect: false,
    },
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 h-[400px]">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default StockChart;