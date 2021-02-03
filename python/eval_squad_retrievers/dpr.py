from haystack.document_store.faiss import FAISSDocumentStore
from haystack.retriever.dense import DensePassageRetriever
from utils.utils import load_and_prepare_data

filename = "data/train-v2.0.json"
doc_index = "evaluation_docs"
label_index = "evaluation_labels"

docs, labels = load_and_prepare_data(filename=filename)
document_store = FAISSDocumentStore()
document_store.delete_all_documents()
document_store.write_documents(docs, index=doc_index)

dpr = DensePassageRetriever(
    document_store=document_store,
    query_embedding_model="facebook/dpr-question_encoder-single-nq-base",
    passage_embedding_model="facebook/dpr-ctx_encoder-single-nq-base",
    max_seq_len_query=64,
    max_seq_len_passage=256,
    batch_size=16,
    use_gpu=False,
    embed_title=True,
    use_fast_tokenizers=True,
)

document_store.update_embeddings(dpr, index=doc_index)
document_store.write_labels(labels, index=label_index)
dpr_eval_results = dpr.eval(top_k=3, label_index=label_index, doc_index=doc_index)
dpr_eval_results
# For 1048 out of 2000 questions (52.40%), the answer was in the top-3 candidate passages selected by the retriever.
# 'recall': 0.524