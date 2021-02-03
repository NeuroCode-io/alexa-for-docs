from haystack.document_store.elasticsearch import ElasticsearchDocumentStore
from haystack.retriever.sparse import ElasticsearchRetriever
from haystack.preprocessor.utils import convert_files_to_dicts

from utils.utils import load_and_prepare_data

filename = "data/train-v2.0.json"
doc_index = "evaluation_docs"
label_index = "evaluation_labels"

docs, labels = load_and_prepare_data(filename)

document_store = ElasticsearchDocumentStore(
    host="localhost",
    username="",
    password="",
    index="document",
    create_index=False,
    embedding_field="emb",
    embedding_dim=768,
    excluded_meta_data=["emb"],
)


document_store.delete_all_documents(index=doc_index)
document_store.delete_all_documents(index=label_index)

document_store.write_documents(docs, index=doc_index)
document_store.write_labels(labels, index=label_index)

retriever = ElasticsearchRetriever(document_store=document_store)
retriever_eval_results = retriever.eval(
    top_k=3, label_index=label_index, doc_index=doc_index
)
retriever_eval_results

# For 1563 out of 2000 questions (78.15%), the answer was in the top-3 candidate passages selected by the retriever.
# 'recall': 0.7815