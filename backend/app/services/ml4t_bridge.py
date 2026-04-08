"""Bridge to ML4T course code. Imports learners and indicators from the original project."""

import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

from app.core.config import ML4T_DATA_DIR

ML4T_ROOT = ML4T_DATA_DIR.parent

# Add ML4T project paths so we can import course modules
_paths_to_add = [
    str(ML4T_ROOT),
    str(ML4T_ROOT / "assess_learners"),
    str(ML4T_ROOT / "indicator_evaluation"),
    str(ML4T_ROOT / "strategy_evaluation"),
    str(ML4T_ROOT / "marketsim"),
]
for p in _paths_to_add:
    if p not in sys.path:
        sys.path.insert(0, p)


def get_learner_class(learner_type: str):
    """Returns (LearnerClass, is_bag_wrapper)."""
    if learner_type == "dt":
        from DTLearner import DTLearner
        return DTLearner, False
    elif learner_type == "rt":
        from RTLearner import RTLearner
        return RTLearner, False
    elif learner_type == "bag":
        from DTLearner import DTLearner
        return DTLearner, True
    elif learner_type == "linreg":
        from LinRegLearner import LinRegLearner
        return LinRegLearner, False
    elif learner_type == "insane":
        from InsaneLearner import InsaneLearner
        return InsaneLearner, False
    else:
        raise ValueError(f"Unknown learner type: {learner_type}")


def get_bag_learner():
    from BagLearner import BagLearner
    return BagLearner


def load_prices(symbol: str, sd: datetime, ed: datetime, source: str = "auto") -> pd.Series:
    """Load price data. source='auto' tries local CSV first, then Yahoo Finance.
    source='csv' forces local only, source='yahoo' forces Yahoo Finance only."""
    if source in ("auto", "csv"):
        csv_path = ML4T_DATA_DIR / f"{symbol}.csv"
        if csv_path.exists():
            df = pd.read_csv(csv_path, index_col="Date", parse_dates=True)
            df = df.sort_index()
            df = df.loc[sd:ed]
            if not df.empty:
                return df["Adj Close"]
        if source == "csv":
            raise FileNotFoundError(f"No local data for symbol: {symbol}")

    # Fallback (or explicit): Yahoo Finance
    import yfinance as yf
    ticker = yf.Ticker(symbol)
    df = ticker.history(start=sd.strftime("%Y-%m-%d"), end=ed.strftime("%Y-%m-%d"))
    if df.empty:
        raise FileNotFoundError(f"No data found for {symbol} from Yahoo Finance")
    return df["Close"]


def create_indicators(prices: pd.Series):
    """Create an Indicators instance from price series."""
    from indicators import Indicators
    return Indicators(prices)


def __getattr__(name):
    if name == "BagLearner":
        return get_bag_learner()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
