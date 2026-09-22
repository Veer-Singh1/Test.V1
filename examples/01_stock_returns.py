"""Download stock prices and compute basic risk/return statistics.

Run:  python examples/01_stock_returns.py
"""
import numpy as np
import yfinance as yf

TICKERS = ["AAPL", "MSFT", "SPY"]

prices = yf.download(TICKERS, period="2y", auto_adjust=True, progress=False)["Close"]
if prices.dropna(how="all").empty:
    raise SystemExit("No data downloaded - check your internet connection.")
returns = prices.pct_change().dropna()

TRADING_DAYS = 252
summary = {
    "annual_return": returns.mean() * TRADING_DAYS,
    "annual_volatility": returns.std() * np.sqrt(TRADING_DAYS),
}
summary["sharpe (rf=0)"] = summary["annual_return"] / summary["annual_volatility"]

for name, values in summary.items():
    print(f"\n{name}:\n{values.round(3)}")

print("\nCorrelation matrix:\n", returns.corr().round(2))
