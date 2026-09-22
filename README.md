# Quant Finance & Crypto Starter

A beginner-friendly starting point for learning quantitative finance and crypto analysis with Python.

## 1. Set up on your own computer

You need **Python 3.10+** ([python.org/downloads](https://www.python.org/downloads/)) and **Git** ([git-scm.com](https://git-scm.com/downloads)).

```bash
# Download this repository to your computer
git clone https://github.com/veer-singh1/test.v1.git
cd test.v1

# Create a "virtual environment": a private folder of libraries for this project
python -m venv .venv

# Turn it on (do this every time you open a new terminal)
source .venv/bin/activate        # Mac / Linux
.venv\Scripts\activate           # Windows

# Install all the libraries listed in requirements.txt
pip install -r requirements.txt
```

## 2. Run the examples

```bash
python examples/01_stock_returns.py          # returns, volatility, Sharpe ratio, correlations
python examples/02_crypto_prices.py          # live BTC price + ETH candles from an exchange
python examples/03_moving_average_backtest.py  # a simple trading strategy backtest + chart
jupyter lab                                  # interactive notebooks in your browser
```

## 3. What the libraries do

| Library | Used for |
|---|---|
| `numpy`, `pandas` | Maths and tables of time-series data (the foundation of everything) |
| `scipy`, `statsmodels` | Statistics, regressions, hypothesis tests |
| `scikit-learn` | Machine learning |
| `matplotlib` | Charts |
| `yfinance` | Free historical prices for stocks, ETFs, FX and crypto |
| `ccxt` | Market data (and trading) on 100+ crypto exchanges |
| `arch` | Volatility modelling (GARCH) |
| `PyPortfolioOpt` | Portfolio optimisation / efficient frontier |
| `jupyterlab` | Notebooks for experimenting |

## 4. Git basics (the everyday loop)

```bash
git status                  # what changed?
git add <file>              # stage a file for saving
git commit -m "message"     # save a snapshot
git push                    # upload to GitHub
git pull                    # download others' changes
```

Terms: a **repository** is a project folder tracked by Git. A **commit** is a saved snapshot. A **branch** is a parallel line of work. A **pull request** asks to merge a branch into `main`.

## 5. Suggested learning path

1. **Python + pandas**: loading, cleaning and resampling price data.
2. **Returns & risk**: log vs simple returns, volatility, Sharpe ratio, drawdowns.
3. **Statistics**: distributions, correlation, regression (e.g. CAPM beta).
4. **Portfolio theory**: diversification, mean-variance optimisation.
5. **Backtesting**: avoid look-ahead bias, include transaction costs, test out-of-sample.
6. **Time series**: stationarity, autocorrelation, GARCH volatility.
7. **Crypto specifics**: 24/7 markets, exchange differences, funding rates, on-chain data.

Books: *Python for Finance* (Hilpisch), *Advances in Financial Machine Learning* (López de Prado), *Options, Futures and Other Derivatives* (Hull).

> ⚠️ These examples are for learning. Never trade real money on a backtest alone, and never commit API keys to GitHub (put them in a `.env` file, which `.gitignore` already excludes).
