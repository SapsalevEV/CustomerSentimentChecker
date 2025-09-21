
from typing import List, Optional
from pydantic import Field, BaseModel, ConfigDict


class InputItem(BaseModel):
    id: int = Field(..., description="Уникальный ID отзыва")
    text: str = Field(..., min_length=1, description="Текст отзыва")


class InputData(BaseModel):
    data: List[InputItem] = Field(..., min_length=1)


class Prediction(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=False)

    id: int
    topics: List[str] = Field(default_factory=list)
    sentiments: List[str] = Field(default_factory=list)


class OutputData(BaseModel):
    predictions: List[Prediction] = Field(default_factory=list)
    errors: Optional[str] = None
    timestamp: Optional[str] = None