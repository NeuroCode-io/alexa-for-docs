import logging
import json
from onnxruntime import InferenceSession
from pathlib import Path
from transformers import AutoTokenizer
import azure.functions as func
from .squad_utils import predict_qa

dir = Path(__file__).parent / "../"
model_path_list = [str(x) for x in dir.glob("*") if str(x).endswith("model")]
if len(model_path_list) != 1:
    raise RuntimeError("Could not find model")

model_path = model_path_list[0]

fast_tokenizer = AutoTokenizer.from_pretrained(model_path)
session = InferenceSession(f"{model_path}/roberta-base-squad2-optimized.onnx")


def create_error(error_given: str):
    return func.HttpResponse(
        json.dumps({"error": error_given}),
        mimetype="application/json",
        status_code=400,
    )


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Python HTTP trigger function processed a request.")

    try:
        body = req.get_json()
    except ValueError:
        return create_error("Question and / or context are missing")

    if "context" not in body.keys() or "question" not in body.keys():
        return create_error("Question and / or context are missing")

    question = body["question"]
    context = body["context"]

    if question is None or context is None:
        return create_error("Question and / or context are empty")

    examples_dict = {"context": context, "question": question}
    result = predict_qa(session, fast_tokenizer, examples_dict)

    return func.HttpResponse(json.dumps(result), mimetype="application/json")
