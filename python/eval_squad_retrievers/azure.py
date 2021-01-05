from utils.az_utils import create_idx, insert_docs, find_text, eval, label_to_frame # getting an error az_utils, import config, no module named config
from utils.utils import load_and_prepare_data

filename = "../data/train-v2.0.json"
doc_index = "evaluation_docs"
label_index = "evaluation_labels"

docs, labels = load_and_prepare_data(filename)

dicts=[]
for i in range(len(docs)):
    entry=docs[i].to_dict()
    dicts.append({"Id": entry["id"], "text": entry["text"]})

dicts_labels=[]
for i in range(len(labels)):
    entry=labels[i].to_dict()
    dicts_labels.append({"Id": entry["document_id"], "question": entry["question"]})
labels_frame=label_to_frame(dicts_labels=dicts_labels)

index_name="evaluate-squad-data"

create_idx(idx_name=index_name)
insert_docs(idx_name=index_name, docs=dicts)

#eval
metric=eval(labels_frame=labels_frame, top_k=3, index_name=index_name)
print(metric)