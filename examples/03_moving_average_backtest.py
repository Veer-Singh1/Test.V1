"""A simple moving-average crossover backtest (for learning, not for trading!).

Buy when the 50-day average is above the 200-day average, otherwise hold cash.
Run:  python examples/03_moving_average_backtest.py
"""
import matplotlib.pyplot as plt
import yfinance as yf

SYMBOL = "BTC-USD"  # works for stocks too, e.g. "SPY"

close = yf.download(SYMBOL, period="5y", auto_adjust=True, progress=False)["Close"].squeeze()
if close.dropna().empty:
    raise SystemExit("No data downloaded - check your internet connection.")

fast = close.rolling(50).mean()
slow = close.rolling(200).mean()
position = (fast > slow).astype(int).shift(1)  # trade on the NEXT day to avoid look-ahead bias

daily_ret = close.pct_change()
strategy_ret = (position * daily_ret).dropna()

buy_hold = (1 + daily_ret.loc[strategy_ret.index]).cumprod()
strategy = (1 + strategy_ret).cumprod()

print(f"Buy & hold growth of $1: {buy_hold.iloc[-1]:.2f}")
print(f"Strategy growth of $1:   {strategy.iloc[-1]:.2f}")

ax = buy_hold.plot(label="Buy & hold", figsize=(10, 5))
strategy.plot(ax=ax, label="50/200 MA crossover")
ax.set_title(f"{SYMBOL}: moving-average crossover backtest")
ax.legend()
plt.savefig("backtest.png")
print("Chart saved to backtest.png")
