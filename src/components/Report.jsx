'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#EF4444']; // green, blue, red

export default function Report({ analysis }) {
  if (!Array.isArray(analysis) || analysis.length === 0) {
    return <div>No analysis data to display.</div>;
  }

  const { sentimentDistribution, topEngagers, contentThemes } = analysis[0];

  // Prepare Pie Chart Data
  const pieData = Object.entries(sentimentDistribution || {}).map(([key, value]) => ({
    name: key,
    value: value.length, // Just for demo; could be enhanced if needed
  }));

  return (
    <div className="space-y-12">
      {/* Sentiment Distribution */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">Sentiment Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={120}
              innerRadius={60}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        {/* Sentiment Details */}
        <div className="mt-6 space-y-2 text-gray-300 text-sm">
          {Object.entries(sentimentDistribution || {}).map(([sentiment, description]) => (
            <div key={sentiment}>
              <strong className="capitalize text-white">{sentiment}:</strong> {description}
            </div>
          ))}
        </div>
      </section>

      {/* Top Engagers */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">Top Engagers</h2>
        <div className="space-y-4">
          {(topEngagers || []).map((engager, index) => (
            <div key={index} className="p-4 bg-gray-800 rounded-lg">
              <div className="text-lg font-bold">{engager.channelTitle}</div>
              <div className="text-gray-400 text-sm">{engager.reason}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Content Themes */}
      <section className="bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">Content Themes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contentThemes && Object.entries(contentThemes).map(([theme, items]) => (
            <div key={theme} className="p-4 bg-gray-800 rounded-lg">
              <div className="text-lg font-bold capitalize mb-2">{theme.replace(/([A-Z])/g, ' $1')}</div>
              <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                {items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
