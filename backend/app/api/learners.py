from fastapi import APIRouter, HTTPException, Query
import numpy as np

from app.services.ml4t_bridge import get_learner_class, get_bag_learner

router = APIRouter()

# Load dataset once at module level
_dataset_cache: dict[str, np.ndarray] = {}


def _load_dataset(name: str) -> np.ndarray:
    if name in _dataset_cache:
        return _dataset_cache[name]

    from app.core.config import ML4T_DATA_DIR
    csv_path = ML4T_DATA_DIR.parent / "assess_learners" / f"{name}.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found: {name}")

    data = np.genfromtxt(csv_path, delimiter=",", skip_header=1)
    data = data[~np.isnan(data).any(axis=1)]
    _dataset_cache[name] = data
    return data


# Learner types that don't accept leaf_size (no tree structure)
_NO_LEAF_SIZE = {"linreg", "insane"}


def _create_learner(learner_type: str, leaf_size: int, bags: int):
    learner_cls, is_bag = get_learner_class(learner_type)
    if is_bag:
        BagLearner = get_bag_learner()
        return BagLearner(learner=learner_cls, kwargs={"leaf_size": leaf_size}, bags=bags)
    if learner_type in _NO_LEAF_SIZE:
        return learner_cls()
    return learner_cls(leaf_size=leaf_size)


@router.get("/experiment")
def run_experiment(
    learner_type: str = Query(default="dt"),
    max_leaf_size: int = Query(default=50),
    bags: int = Query(default=20),
    dataset: str = Query(default="test"),
    train_ratio: float = Query(default=0.6),
):
    """Run a learning curve experiment with a built-in dataset.

    Returns train/test RMSE for leaf_size 1..max_leaf_size.
    """
    try:
        data = _load_dataset(dataset)

        split = int(len(data) * train_ratio)
        x_train, y_train = data[:split, :-1], data[:split, -1]
        x_test, y_test = data[split:, :-1], data[split:, -1]

        results = []

        if learner_type in _NO_LEAF_SIZE:
            # Non-tree learners: train once, show as flat baseline
            learner = _create_learner(learner_type, 0, bags)
            learner.add_evidence(x_train, y_train)
            train_pred = learner.query(x_train)
            test_pred = learner.query(x_test)
            train_rmse = float(np.sqrt(np.mean((y_train - train_pred) ** 2)))
            test_rmse = float(np.sqrt(np.mean((y_test - test_pred) ** 2)))
            for ls in range(1, max_leaf_size + 1):
                results.append({
                    "leaf_size": ls,
                    "train_rmse": round(train_rmse, 6),
                    "test_rmse": round(test_rmse, 6),
                })
        else:
            for ls in range(1, max_leaf_size + 1):
                learner = _create_learner(learner_type, ls, bags)
                learner.add_evidence(x_train, y_train)
                train_pred = learner.query(x_train)
                test_pred = learner.query(x_test)
                train_rmse = float(np.sqrt(np.mean((y_train - train_pred) ** 2)))
                test_rmse = float(np.sqrt(np.mean((y_test - test_pred) ** 2)))
                results.append({
                    "leaf_size": ls,
                    "train_rmse": round(train_rmse, 6),
                    "test_rmse": round(test_rmse, 6),
                })

        best = min(results, key=lambda r: r["test_rmse"])

        return {
            "results": results,
            "best_leaf_size": best["leaf_size"],
            "best_rmse": best["test_rmse"],
            "train_samples": split,
            "test_samples": len(data) - split,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
