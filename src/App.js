import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const App = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('potentialScore');
  const [sortDirection, setSortDirection] = useState('desc');

  const filterCriteria = [
    { name: "Market Cap", value: "< $100M", description: "Focus on small-cap tokens with room for growth" },
    { name: "Volume/Market Cap Ratio", value: "> 0.1", description: "Ensures sufficient trading activity" },
    { name: "Price Momentum", value: "> 8%", description: "Shows growing market interest" },
    { name: "Supply Distribution", value: "< 50%", description: "Room for supply growth" }
  ];

  useEffect(() => {
    fetchCryptoData();
  }, []);

  const fetchCryptoData = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&sparkline=false&price_change_percentage=24h,7d'
      );
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      
      const potentialGems = data.filter(crypto => {
        const marketCapInMillions = crypto.market_cap / 1000000;
        const volumeToMarketCap = crypto.total_volume / crypto.market_cap;
        
        return marketCapInMillions < 100 && 
               volumeToMarketCap > 0.1 && 
               crypto.market_cap > 0;
      });
      
      setCryptoData(potentialGems);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const analyzePotential = (crypto) => {
    const score = {
      value: 0,
      factors: []
    };

    const marketCapInMillions = crypto.market_cap / 1000000;
    if (marketCapInMillions < 10) {
      score.value += 4;
      score.factors.push('Micro market cap with massive growth potential');
    } else if (marketCapInMillions < 50) {
      score.value += 3;
      score.factors.push('Very low market cap with high growth potential');
    }

    const volumeToMarketCap = crypto.total_volume / crypto.market_cap;
    if (volumeToMarketCap > 0.5) {
      score.value += 4;
      score.factors.push('Exceptional trading volume relative to market cap');
    } else if (volumeToMarketCap > 0.3) {
      score.value += 3;
      score.factors.push('Very high trading volume relative to market cap');
    }

    if (crypto.price_change_percentage_24h > 15) {
      score.value += 4;
      score.factors.push('Strong positive price momentum (>15%)');
    } else if (crypto.price_change_percentage_24h > 8) {
      score.value += 2;
      score.factors.push('Good positive price momentum (>8%)');
    }

    if (crypto.total_supply && crypto.circulating_supply) {
      const supplyRatio = crypto.circulating_supply / crypto.total_supply;
      if (supplyRatio < 0.3) {
        score.value += 3;
        score.factors.push('Very large room for supply growth');
      } else if (supplyRatio < 0.5) {
        score.value += 2;
        score.factors.push('Significant room for supply growth');
      }
    }

    if (crypto.total_volume > crypto.market_cap) {
      score.value += 2;
      score.factors.push('Extremely high trading activity');
    }

    return score;
  };

  const generateAnalysis = (crypto) => {
    const marketCapInMillions = crypto.market_cap / 1000000;
    const volumeToMarketCap = crypto.total_volume / crypto.market_cap;
    const supplyRatio = crypto.total_supply ? (crypto.circulating_supply / crypto.total_supply) * 100 : null;

    return `${crypto.name} shows promise with a market cap of only $${marketCapInMillions.toFixed(2)}M. ` +
           `${volumeToMarketCap > 0.3 ? 'It has strong trading volume at ' + (volumeToMarketCap * 100).toFixed(1) + '% of its market cap. ' : ''}` +
           `${crypto.price_change_percentage_24h > 0 ? 'Price is up ' + crypto.price_change_percentage_24h.toFixed(1) + '% in the last 24h. ' : ''}` +
           `${supplyRatio ? 'Only ' + supplyRatio.toFixed(1) + '% of total supply is in circulation. ' : ''}`;
  };

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      if (sortField === 'potentialScore') {
        const scoreA = analyzePotential(a).value;
        const scoreB = analyzePotential(b).value;
        return sortDirection === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      const aValue = a[sortField];
      const bValue = b[sortField];
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-lg text-gray-200">Loading cryptocurrency data...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-lg text-red-400">Error: {error}</div>
    </div>
  );

  const sortedData = sortData(cryptoData);
  const top10Tokens = sortedData.slice(0, 10);
  const chartData = top10Tokens.map(crypto => ({
    name: crypto.symbol.toUpperCase(),
    score: analyzePotential(crypto).value,
    marketCap: crypto.market_cap
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Crypto Gem Finder
          </h1>
          <p className="text-gray-400 mt-2">
            Discover hidden gems with high growth potential
          </p>
        </div>

        {/* Filter Criteria */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-200">Discovery Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filterCriteria.map((filter, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="font-semibold text-blue-400">{filter.name}</div>
                <div className="text-xl font-bold text-gray-200 my-1">{filter.value}</div>
                <div className="text-sm text-gray-400">{filter.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-6 text-gray-200">Top 10 Potential Gems</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  content={({ payload, label }) => {
                    if (payload && payload.length) {
                      return (
                        <div className="bg-gray-800 p-3 border border-gray-700 rounded-lg shadow-lg">
                          <p className="font-bold text-gray-200">{label}</p>
                          <p className="text-blue-400">Score: {payload[0].value}</p>
                          <p className="text-gray-400">Market Cap: ${payload[0].payload.marketCap.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="score" 
                  fill="#4F46E5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-6 text-gray-200">Detailed Gem Analysis</h2>
          <div className="space-y-4">
            {top10Tokens.map((crypto) => {
              const potential = analyzePotential(crypto);
              return (
                <div key={crypto.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 p-1">
                      <img src={crypto.image} alt={crypto.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-gray-200">{crypto.name}</span>
                    <span className="text-gray-400">({crypto.symbol.toUpperCase()})</span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-blue-400 font-bold">Score: {potential.value}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-2">{generateAnalysis(crypto)}</p>
                  <div className="text-sm text-gray-400">
                    Key factors: {potential.factors.join(' • ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;