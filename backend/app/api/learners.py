from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np

router = APIRouter()


class TrainRequest(BaseModel):
    learner_type: str  # "dt", "rt", "bag"
    leaf_size: int = 1
    bags: int = 20
    data_x: list[list[float]]
    data_y: list[float]
    test_x: list[list[float]]


class LearningCurveRequest(BaseModel):
    learner_type: str
    leaf_sizes: list[int]
    bags: int = 20
    data_x: list[list[float]]
    data_y: list[float]
    test_x: list[list[float]]
    test_y: list[float]


def _create_learner(learner_type: str, leaf_size: int, bags: int):
    from app.services.ml4t_bridge import get_learner_class
    learner_cls, is_bag = get_learner_class(learner_type)
    if is_bag:
        from app.services.ml4t_bridge import BagLearner
        return BagLearner(learner=learner_cls, kwargs={"leaf_size": leaf_size}, bags=bags)
    return learner_cls(leaf_size=leaf_size)


@router.post("/predict")
def predict(req: TrainRequest):
    try:
        learner = _create_learner(req.learner_type, req.leaf_size, req.bags)
        x_train = np.array(req.data_x)
        y_train = np.array(req.data_y)
        x_test = np.array(req.test_x)

        learner.add_evidence(x_train, y_train)
        predictions = learner.query(x_test)
        return {"predictions": predictions.tolist()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/learning-curve")
def learning_curve(req: LearningCurveRequest):
    try:
        x_train = np.array(req.data_x)
        y_train = np.array(req.data_y)
        x_test = np.array(req.test_x)
        y_test = np.array(req.test_y)

        results = []
        for ls in req.leaf_sizes:
            learner = _create_learner(req.learner_type, ls, req.bags)
            learner.add_evidence(x_train, y_train)

            train_pred = learner.query(x_train)
            test_pred = learner.query(x_test)

            train_rmse = float(np.sqrt(np.mean((y_train - train_pred) ** 2)))
            test_rmse = float(np.sqrt(np.mean((y_test - test_pred) ** 2)))

            results.append({
                "leaf_size": ls,
                "train_rmse": train_rmse,
                "test_rmse": test_rmse,
            })

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
