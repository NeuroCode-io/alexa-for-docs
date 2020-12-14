from onnxruntime import InferenceSession
from transformers import AutoTokenizer, AutoModelForQuestionAnswering
from pathlib import Path
from transformers import pipeline

model_name="deepset/roberta-base-squad2"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForQuestionAnswering.from_pretrained(model_name)

nlp=pipeline(task="question-answering", model=model, tokenizer=tokenizer)

context = r"""
Extractive Question Answering is the task of extracting an answer from a text given a question. An example of a
question answering dataset is the SQuAD dataset, which is entirely based on that task. If you would like to fine-tune
a model on a SQuAD task, you may leverage the `run_squad.py`.
"""

print(nlp(question="What is extractive question answering?", context=context))