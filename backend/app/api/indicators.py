from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
import pandas as pd

router = APIRouter()


@router.get("/calculate")
def calculate_indicators(
    symbol: str = Query(default="JPM"),
    start: str = Query(default="2008-01-01"),
    end: str = Query(default="2009-12-31"),
    indicators: list[str] = Query(default=["bbp", "momentum", "macd"]),
):
    try:
        from app.services.ml4t_bridge import load_prices, create_indicators

        sd = datetime.strptime(start, "%Y-%m-%d")
        ed = datetime.strptime(end, "%Y-%m-%d")
        prices = load_prices(symbol, sd, ed)
        ind = create_indicators(prices)

        result = {"dates": prices.index.strftime("%Y-%m-%d").tolist()}

        result["prices"] = prices.values.tolist()

        indicator_map = {
            "bbp": ind.calculate_bbp,
            "momentum": ind.calculate_momentum,
            "macd": ind.calculate_macd,
            "sma": ind.calculate_price_sma_ratio,
            "stochastic": ind.calculate_stochastic,
        }

        for name in indicators:
            if name in indicator_map:
                series = indicator_map[name]()
                result[name] = [
                    None if pd.isna(v) else round(float(v), 6)
                    for v in series.values
                ]

        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/symbols")
def list_symbols():
    from app.core.config import ML4T_DATA_DIR
    symbols = sorted([
        f.stem for f in ML4T_DATA_DIR.glob("*.csv")
        if not f.stem.startswith("$")
    ])
    return {"symbols": symbols}
