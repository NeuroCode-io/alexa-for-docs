from onnx_utils import predict_qa 
from transformers import AutoTokenizer
from pathlib import Path 

example_dict={"contex": "Extractive Question Answering is the task of extracting an answer from a text given a question. An example of a question answering dataset is the SQuAD dataset, which is entirely based on that task. If you would like to fine-tune a model on a SQuAD task, you may leverage the `run_squad.py`.", "question": "What is extractive question answering?"}
onnx_model_name="./onnx_model/roberta-base-squad2.onnx"
model_name="deepset/roberta-base-squad2"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model_path=Path(__file__).parent / "onnx_model/roberta-base-squad2.onnx"

pred=predict_qa(model_path=str(model_path), tokenizer=tokenizer, examples_dict=example_dict)
print(pred)