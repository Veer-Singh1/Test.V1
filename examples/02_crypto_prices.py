"""Fetch live crypto prices and daily candles from an exchange using ccxt.

No API key is needed for public market data.
Run:  python examples/02_crypto_prices.py
"""
import ccxt
import pandas as pd

exchange = ccxt.kraken()  # try ccxt.binance(), ccxt.coinbase(), ... (availability depends on your country)

ticker = exchange.fetch_ticker("BTC/USD")
print(f"BTC/USD last price: {ticker['last']:,.2f}")

candles = exchange.fetch_ohlcv("ETH/USD", timeframe="1d", limit=30)
df = pd.DataFrame(candles, columns=["time", "open", "high", "low", "close", "volume"])
df["time"] = pd.to_datetime(df["time"], unit="ms")
print("\nLast 30 days of ETH/USD:")
print(df.tail(10).to_string(index=False))
