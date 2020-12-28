import pandas as pd 
from haystack.preprocessor.utils import eval_data_from_file
from haystack.schema import Document, Label

def create_dict(docs):
    # docs is haystack.schema.Document
    # keys needed are text and id
    dicts=[]
    for i in range(len(docs)):
        entry=docs[i].to_dict()
        dicts.append(entry)
    return dicts 


def dict_to_frame(dicts):
    # dicts is a list of dicts
    return pd.DataFrame(dicts)


def prepare_labels(labels_2000):
    labels = []
    for i in range(len(labels_2000)):
        labels.append(Label(**{
            "question": labels_2000["question"].iloc[i],
            "answer": labels_2000["answer"].iloc[i],
            "is_correct_answer": labels_2000["is_correct_answer"].iloc[i],
            "is_correct_document": labels_2000["is_correct_document"].iloc[i],
            "origin": labels_2000["origin"].iloc[i],
            "document_id": labels_2000["document_id"].iloc[i],
            "offset_start_in_doc": labels_2000["offset_start_in_doc"].iloc[i],
            "no_answer": labels_2000["no_answer"].iloc[i],
            "model_id": labels_2000["model_id"].iloc[i],
        }))
    return labels 

def prepare_docs(docs_2000):
    docs = []
    for i in range(len(docs_2000)):
        docs.append(Document(**{
            "text": docs_2000["text"].iloc[i],
            "id": docs_2000["id"].iloc[i],
            "score": docs_2000["score"].iloc[i],
            "probability": docs_2000["probability"].iloc[i],
            "question": docs_2000["question"].iloc[i],
            "meta": docs_2000["meta"].iloc[i],
            "embedding": docs_2000["embedding"].iloc[i],
        }))
    return docs


def load_and_prepare_data(filename):
    do, la = docs, labels = eval_data_from_file(filename)
    # create list of dicts
    docs_dict = create_dict(do)
    labels_dict = create_dict(la)

    # create DataFrames
    docs_frame = dict_to_frame(docs_dict)
    labels_frame = dict_to_frame(labels_dict)

    # only want questions with answers
    labels_frame = labels_frame[labels_frame.no_answer==False]

    # get 3000 document id's from docs
    document_3000=docs_frame.id.unique()[:3000].tolist()
    documents=docs_frame[docs_frame["id"].isin(document_3000)]
    # get labels, i.e. questions for the 2000 document id's
    labels_3000=labels_frame[labels_frame["document_id"].isin(document_3000)]
    # get only 1000 questions 
    que_2000 = labels_3000.question.unique()[:2000].tolist()
    labels_2000 = labels_3000[labels_3000["question"].isin(que_2000)] # 100 questions, 85 document_id's
    
    # get desired output, list of haystack.schema
    labels = prepare_labels(labels_2000)
    docs = prepare_docs(documents)

    return docs, labels
