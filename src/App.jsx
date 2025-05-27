import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Typography, TextField, Button, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Box
} from '@mui/material';

function App() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [minutes, setMinutes] = useState(30);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [averagePrice, setAveragePrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ4MzI1MzQ5LCJpYXQiOjE3NDgzMjUwNDksImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6Ijk1YTNjY2ZmLTdmOTMtNGZlNS04MzM5LTYyODNlNzJkZmM4MSIsInN1YiI6IjIyMzExYTY2NzdAYWltbC5zcmVlbmlkaGkuZWR1LmluIn0sImVtYWlsIjoiMjIzMTFhNjY3N0BhaW1sLnNyZWVuaWRoaS5lZHUuaW4iLCJuYW1lIjoidGVqYXN3aSBhcmVsbGEiLCJyb2xsTm8iOiIyMjMxMWE2Njc3IiwiYWNjZXNzQ29kZSI6IlBDcUFVSyIsImNsaWVudElEIjoiOTVhM2NjZmYtN2Y5My00ZmU1LTgzMzktNjI4M2U3MmRmYzgxIiwiY2xpZW50U2VjcmV0IjoiR0hFUURCZ1FzZ1FSUFRUSCJ9.K98UBxMMwngjAdmAuxh-hGe5QCsv2cv2TjJsf0Qt0gA";

  const api = axios.create({
    baseURL: 'http://20.244.56.144/evaluation-service',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        console.log("Fetching stocks...");
        const response = await api.get('/stocks');

        console.log("Raw /stocks response:", response.data);

        let stockList = [];

        // Handle object format: { stocks: { name: symbol, ... } }
        if (response.data && typeof response.data === 'object') {
          if (response.data.stocks && typeof response.data.stocks === 'object') {
            stockList = Object.entries(response.data.stocks).map(([name, symbol]) => ({
              name,
              symbol
            }));
          } else if (Array.isArray(response.data)) {
            // In case it's an array of stock objects
            stockList = response.data;
          } else {
            console.warn("Unexpected format:", response.data);
          }
        }

        setStocks(stockList);
      } catch (err) {
        setError('Failed to fetch stocks');
        console.error("Error fetching /stocks:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  const fetchCurrentPrice = async () => {
    if (!selectedStock) return;
    try {
      setLoading(true);
      const response = await api.get(`/stocks/${selectedStock}`);
      console.log("Current price response:", response.data);
      setCurrentPrice(response.data.stock || response.data); // Support both wrapped and direct object
    } catch (err) {
      setError('Failed to fetch current price');
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async () => {
    if (!selectedStock || !minutes) return;
    try {
      setLoading(true);
      const response = await api.get(`/stocks/${selectedStock}/minutes=${minutes}`);
      console.log("History response:", response.data);

      const history = Array.isArray(response.data) ? response.data : [response.data];
      setPriceHistory(history);

      if (history.length > 0) {
        const avg = history.reduce((sum, h) => sum + h.price, 0) / history.length;
        setAveragePrice(avg);
      } else {
        setAveragePrice(null);
      }
    } catch (err) {
      setError('Failed to fetch price history');
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    fetchCurrentPrice();
    fetchPriceHistory();
  };

  const handleStockChange = (e) => {
    setSelectedStock(e.target.value);
    setCurrentPrice(null);
    setPriceHistory([]);
    setAveragePrice(null);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Stock Exchange Dashboard
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField
              select
              label="Select Stock"
              value={selectedStock}
              onChange={handleStockChange}
              SelectProps={{ native: true }}
              fullWidth
              variant="outlined"
              sx={{ minWidth: 200 }}
            >
              <option value="">Select a stock</option>
              {stocks.map((stock, idx) => (
                <option key={idx} value={stock.symbol}>
                  {stock.name} ({stock.symbol})
                </option>
              ))}
            </TextField>

            <TextField
              type="number"
              label="Minutes"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              variant="outlined"
              sx={{ width: 120 }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!selectedStock || loading}
            >
              {loading ? 'Loading...' : 'Get Data'}
            </Button>
          </Box>
        </form>
      </Paper>

      {error && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#ffe6e6' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {currentPrice && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Current Price for {selectedStock}
          </Typography>
          <Typography>Price: ${currentPrice.price.toFixed(2)}</Typography>
          <Typography>
            Last Updated: {new Date(currentPrice.lastUpdatedAt).toLocaleString()}
          </Typography>
        </Paper>
      )}

      {averagePrice !== null && (
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Average Price Calculation
          </Typography>
          <Typography>
            Average price over last {minutes} minutes: ${averagePrice.toFixed(2)}
          </Typography>
        </Paper>
      )}

      {priceHistory.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Price History (Last {minutes} minutes)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Price</TableCell>
                  <TableCell>Last Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>{new Date(item.lastUpdatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
}

export default App;