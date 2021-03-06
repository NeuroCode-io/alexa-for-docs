import config 
import requests

from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents import SearchClient

import pandas as pd 
from azure.search.documents.indexes.models import (
    CorsOptions,
    SearchIndex,
    BM25SimilarityAlgorithm,
    SearchFieldDataType,
    SimpleField,
    SearchableField,
)

endpoint = config.ENDPOINT
key = config.API_KEY

def create_idx(idx_name):
    fields = [
        SimpleField(name="Id", type=SearchFieldDataType.String, key=True),
        SearchableField(
            name="text", type=SearchFieldDataType.String, analyzer_name="en.lucene"
        ),
    ]
    client = SearchIndexClient(endpoint, AzureKeyCredential(key))
    #cors_options = CorsOptions(allowed_origins=["*"], max_age_in_seconds=60)
    #sim = BM25SimilarityAlgorithm(k1=1.3, b=0.5)
    #scoring_profiles = []
    index = SearchIndex(
        name=idx_name,
        fields=fields,
        #similarity=sim,
        #scoring_profiles=scoring_profiles,
        #cors_options=cors_options,
    )
    return client.create_index(index)


def insert_docs(idx_name, docs):
    ''' 
    idx_name: the name of the index to insert the documents
    docs: a list of dicts with keys "Id" and "text" (same as the index was defined)
    '''
    client = SearchClient(
        endpoint=endpoint, index_name=idx_name, credential=AzureKeyCredential(key)
    )
    result = client.upload_documents(documents=docs)
    print("Upload of new document succeeded: {}".format(result[0].succeeded))


def find_text(query, idx_name, top_k):
    client = SearchClient(
        endpoint=endpoint, index_name=idx_name, credential=AzureKeyCredential(key)
    )
    results = client.search(search_text=query, top=top_k, search_mode="any")
    pred=[]
    for result in results:
        term={"Id": result["Id"], "Score": result["@search.score"], "text": result["text"]}
        pred.append(term)
    return pred


def delete_index(idx_name):
    api_version="?api-version=2019-05-06"
    headers = {'Content-Type': config.CONTENT_TYPE, 'api-key': config.API_KEY }
    url = endpoint + "indexes" + "/" + idx_name + api_version
    response  = requests.delete(url, headers=headers)   
    print("index deleted:", response.ok)


def label_to_frame(dicts_labels):
    labels_id=[]
    labels_q=[]
    for i in range(len(dicts_labels)):
        labels_id.append(dicts_labels[i]["Id"])
        labels_q.append(dicts_labels[i]["question"]) 
    labels_frame=pd.DataFrame(labels_id, columns=["Id"]) 
    labels_frame["question"]=labels_q
    return labels_frame.drop_duplicates()

def eval(labels_frame,top_k, index_name):
    correct_retrievals = 0
    for i in range(len(labels_frame)): 
        question = labels_frame["question"].iloc[i]
        gold_id=labels_frame["Id"].iloc[i]
        pred=find_text(query=question, idx_name=index_name, top_k=top_k)
        
        for j in range(len(pred)):
            pred_id=pred[j]["Id"]
            if gold_id == pred_id:
                correct_retrievals += 1
                break 
            else:
                continue
    number_of_questions = len(labels_frame)
    recall = correct_retrievals / number_of_questions
    metrics={
        "correct_retrievals": correct_retrievals,
        "recall":recall,
        "top_k": top_k
    }
    return metrics