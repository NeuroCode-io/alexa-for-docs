# Alexa for Documents

## Overview 
Whenever you have large amounts of text documents that you need to search, full-text search is a tried and true approach that has been popular for a long time.

However, whenever language in those documents is highly context-dependent, full-text search falls apart. Human language is rich —words in different contexts have different meanings, and users can often find themselves sifting through meaningless results to find that one document they're looking for.

The goal is to be able to index a large number of documents and issue simple text queries similarly to a full-text search engine, but have them be context- and semantically aware. This problem is referred to Text Similarity Search. A user enters a short free-text query, and documents are ranked based on their similarity to the query. Text similarity can be useful in a variety of use cases such as Question-answering which we will consider here with the help of the Haystack library. In particular, we will explore two different methods to retrieve the most relevant documents for a given query: Elasticsearch, which both offers a database and similarity search, and Dense Passage Retriever (DPR) with the Faiss library.  

The key components of the task are: 
1. **FileConverter**: Extracts pure text from files (pdf, docx, pptx, html and many more).
2. **PreProcessor**: Cleans and splits texts into smaller chunks.
3. **DocumentStore**: Database storing the documents, metadata and vectors for our search. We will use Elasticsearch and FAISS. 
4. **Retriever**: Fast algorithms that identify candidate documents for a given query from a large collection of documents. Retrievers narrow down the search space significantly and are therefore key for scalable QA. We will use a sparse method applying *Elasticsearch* and the state of the art dense method *Dense Passage Retrieval*.
5. **Reader**: Neural network (e.g. BERT or RoBERTA) that reads through texts in detail to find an answer. The Reader takes multiple passages of text as input and returns top-n answers. Models are trained via FARM or Transformers on SQuAD like tasks. 
6. **Finder**: Glues together a Retriever + Reader as a pipeline to provide an easy-to-use question answering interface.

## Data
The data is the book *The deep learning with Keras*, in pdf form. We load the pdf, convert it into text and split the book into smaller chuncks which we collect in a dictionary:

```
from haystack.preprocessor.utils import convert_files_to_dicts
dicts=convert_files_to_dicts("./data/", split_paragraphs=True) 
print(dicts[0])
```
```
{'text': '\x0cThe Deep Learning\nwith Keras Workshop\nSecond Edition', 'meta': {'name': '9781839217579-THE_DEEP_LEARNING_WITH_KERAS_WORKSHOP_SECOND_EDITION.pdf'}}
```

## DocumentStore
Haystack finds answers to queries within the documents stored in a DocumentStore. We will use both the ElasticsearchDocumentStore and FAISSDocumentStore implementations of DocumentStore. 

### Elasticsearch Retriever
We start Elasticsearch on the local machine instance using Docker (if Docker is not readily available in the environment (eg., in Colab notebooks), then manually download and execute Elasticsearch from source).

Connect to Elasticsearch:
```
from haystack.document_store.elasticsearch import ElasticsearchDocumentStore
document_store = ElasticsearchDocumentStore(host="localhost", username="", password="", index="document")
```
Write the dicts containing documents to the DB:
```
document_store.write_documents(dicts)
```

Initalize Retriever:
```
from haystack.retriever.sparse import ElasticsearchRetriever
retriever = ElasticsearchRetriever(document_store=document_store)
```

### Dense Passage Retriever (DPR)
When applying DPR we will store our data using FAISS. FAISS is a library for efficient similarity search on a cluster of dense vectors. The FAISSDocumentStore uses a SQL(SQLite in-memory be default) database under-the-hood to store the document text and other meta data. The vector embeddings of the text are indexed on a FAISS Index that later is queried for searching answers. 

DPR uses two Bert models, one to encode the documents and the other to encode the query, and both return vector representations. FAISS is chosen here since it is optimized vector storage.

```

from haystack.document_store.faiss import FAISSDocumentStore

document_store = FAISSDocumentStore()
document_store.write_documents(dicts)
```
Initalize Retriever:
```
from haystack.retriever.dense import DensePassageRetriever
retriever = DensePassageRetriever(document_store=document_store,
                                  query_embedding_model="facebook/dpr-question_encoder-single-nq-base",
                                  passage_embedding_model="facebook/dpr-ctx_encoder-single-nq-base",
                                  max_seq_len_query=64,
                                  max_seq_len_passage=256,
                                  batch_size=16,
                                  use_gpu=False,
                                  embed_title=True,
                                  use_fast_tokenizers=True)
```
One important thing here to note. After the DPR is initialized, we need to call *update_embeddings()* to iterate over all previously indexed documents and update their embedding representation. While this can be a time consuming operation (depending on corpus size), it only needs to be done once. At query time, we only need to embed the query and compare it the existing doc embeddings which is very fast.
```
document_store.update_embeddings(retriever)
```


## Reader 
A Reader scans the texts returned by retrievers in detail and extracts the k best answers. They are based on powerful, but slower deep learning models. 
Haystack currently supports Readers based on the frameworks FARM and Transformers. 

```
from haystack.reader.farm import FARMReader
reader = FARMReader(model_name_or_path="deepset/roberta-base-squad2", use_gpu=False)
```
## Finder
The Finder sticks together reader and retriever in a pipeline to answer our actual questions.

```
finder = Finder(reader, retriever)
```

## Ask a question
We will ask a couple of questions and compare the answers using the different retrievers.

Question: What is RNN?

Elasticsearch Retriever repsonse:
```
[   {   'answer': 'Recurrent Neural Networks',
        'context': 'rthermore, we will learn\n'
                   'how sequential modeling is related to Recurrent Neural '
                   'Networks (RNN). We will\n'
                   'learn about the vanishing gradient problem in ',
        'score': 15.890447616577148},
    {   'answer': 'Recurrent Neural Networks',
        'context': 'rthermore, we will learn\n'
                   'how sequential modeling is related to Recurrent Neural '
                   'Networks (RNN). We will\n'
                   'learn about the vanishing gradient problem in ',
        'score': 15.890447616577148},
    {   'answer': 'Recurrent Neural Networks',
        'context': 'Recurrent Neural Networks (RNNs)\n'
                   'RNNs are a class of neural networks that are built on the '
                   'concept of sequential\n'
                   'memory. Unlike traditional neural net',
        'score': 11.025992393493652}]
```
DPR response:
```
[   {   'answer': 'the hidden layer not only gives the\n'
                  'output, but it also feeds back the information of the '
                  'output into itself',
        'context': 'y of the RNN is that the hidden layer not only gives the\n'
                   'output, but it also feeds back the information of the '
                   'output into itself. Before taking a\n'
                   'dee',
        'score': 12.397671699523926},
    {   'answer': 'Recurrent Neural Networks',
        'context': 'Recurrent Neural Networks (RNNs)\n'
                   'RNNs are a class of neural networks that are built on the '
                   'concept of sequential\n'
                   'memory. Unlike traditional neural net',
        'score': 11.025992393493652},
    {   'answer': 'Long Short-Term Memory',
        'context': 'Long Short-Term Memory (LSTM)\n'
                   'LSTMs are RNNs whose main objective is to overcome the '
                   'shortcomings of the vanishing\n'
                   'gradient and exploding gradient pro',
        'score': 4.55922269821167}]
```


Question: What is a layer?

Elasticsearch Retriever repsonse:
```
[   {   'answer': 'one hidden layer',
        'context': 'ogistic\n'
                   'regression involves a very simple neural network with only '
                   'one hidden layer and only\n'
                   'one node in its hidden layer.\n'
                   'An overview of the logistic',
        'score': 6.236577987670898},
    {   'answer': 'one hidden layer',
        'context': 'ogistic\n'
                   'regression involves a very simple neural network with only '
                   'one hidden layer and only\n'
                   'one node in its hidden layer.\n'
                   'An overview of the logistic',
        'score': 6.236577987670898},
    {   'answer': 'pooling layer',
        'context': 'e feature map derived from the convolution layer is passed '
                   'through a pooling layer\n'
                   'to further reduce the image, all while preserving the most '
                   'relevant',
        'score': 5.443607330322266}]
```
DPR response:
```
[   {   'answer': 'Dense layer',
        'context': 'ras. For now, we will use only the simplest type of\n'
                   'layer, called the Dense layer. A Dense layer is equivalent '
                   'to the fully connected\n'
                   'layers that we h',
        'score': 10.62425708770752},
    {   'answer': 'a\ncomposition of nodes',
        'context': 'ers is part of the Keras core API. A layer can be thought '
                   'of as a\n'
                   'composition of nodes, and at each node, a set of '
                   'computations happen. In Keras, all ',
        'score': 10.560615539550781},
    {   'answer': 'convolutional',
        'context': 'd: it has a four-dimensional input shape (None, 224, 224,\n'
                   '3) and it has three convolutional layers.\n'
                   'The last four layers of the output are as follows:',
        'score': 9.095014572143555}]
```


Question: What is logistic regression?

Elasticsearch Retriever repsonse:
```
[   {   'answer': 'classification tasks',
        'context': 'at other algorithms can\n'
                   'perform, such as logistic regression for classification '
                   'tasks, linear\n'
                   'regression for regression problems, and k-means for clus',
        'score': 13.997730255126953},
    {   'answer': 'classification tasks',
        'context': 'at other algorithms can\n'
                   'perform, such as logistic regression for classification '
                   'tasks, linear\n'
                   'regression for regression problems, and k-means for clus',
        'score': 13.997730255126953},
    {   'answer': 'classification tasks',
        'context': 'at other algorithms can\n'
                   'perform, such as logistic regression for classification '
                   'tasks, linear\n'
                   'regression for regression problems, and k-means for clus',
        'score': 13.873347282409668}]
```
DPR response:
```
[   {   'answer': 'feature\n'
                  'coefficients are learned and predictions are made by taking '
                  'the sum of the product\n'
                  'of the feature coefficients and features',
        'context': ' in which feature\n'
                   'coefficients are learned and predictions are made by '
                   'taking the sum of the product\n'
                   'of the feature coefficients and features.\n'
                   '• Decis',
        'score': 10.148681640625},
    {   'answer': 'a very simple neural network with only one hidden layer and '
                  'only\n'
                  'one node in its hidden layer',
        'context': 'logistic\n'
                   'regression involves a very simple neural network with only '
                   'one hidden layer and only\n'
                   'one node in its hidden layer.\n'
                   'An overview of the logisti',
        'score': 10.00578498840332},
    {   'answer': 'ridge and lasso regularization',
        'context': 'techniques. For example, in\n'
                   'linear and logistic regression, ridge and lasso '
                   'regularization are most common.\n'
                   'In tree-based models, limiting the maximum',
        'score': 3.0434062480926514}]
```


Question: What is deep learning?

Elasticsearch Retriever repsonse:
```
[   {   'answer': 'lowest bias and the lowest variance',
        'context': 'ta analysis, the most desirable model is the one\n'
                   'with the lowest bias and the lowest variance.As shown in '
                   'the preceding plot, the\n'
                   'region labeled in th',
        'score': 2.6615817546844482},
    {   'answer': 'standard gradient descent algorithm',
        'context': '| Deep Learning with Keras\n'
                   'What we discussed here was the standard gradient descent '
                   'algorithm, which computes\n'
                   'the loss and the derivatives using the e',
        'score': 1.9924461841583252},
    {   'answer': 'standard gradient descent algorithm',
        'context': '| Deep Learning with Keras\n'
                   'What we discussed here was the standard gradient descent '
                   'algorithm, which computes\n'
                   'the loss and the derivatives using the e',
        'score': 1.9924461841583252}]
```
DPR response:
```
[   {   'answer': 'Keras',
        'context': "oss')\n"
                   "plt.xlabel('epoch')\n"
                   "plt.legend(['train loss', 'validation loss'], loc='upper "
                   "right')\n"
                   '\x0c'
                   'Chapter 3: Deep Learning with Keras | 337\n'
                   'Expected output:',
        'score': 6.224386215209961},
    {   'answer': 'cyclical: 284',
        'context': ', 254, 261, 263,\n'
                   '266, 269, 271, 274,\n'
                   '276, 294, 298, 301,\n'
                   '305-306, 308-309\n'
                   'current: 95, 113, 283,\n'
                   '287, 294, 301\n'
                   'curves: 193-194, 204, 222\n'
                   'cyclical: 284',
        'score': -4.464661598205566},
    {   'answer': 'gradient',
        'context': '237, 248, 250, 259,\n'
                   '268, 292, 298, 304\n'
                   'google: 258, 277,\n'
                   '282-283, 286, 308\n'
                   'gradient: 78, 84, 94-96,\n'
                   '114, 118, 277, 279-280,\n'
                   '287-289, 291-292, 308',
        'score': -4.519716739654541}]
```


Question: What is early stopping used for?

Elasticsearch Retriever repsonse:
```
[   {   'answer': 'monitor the desired metric',
        'context': 'mber of epochs to give the early stopping method some\n'
                   'time to monitor the desired metric for longer before '
                   'stopping the training process:\n'
                   'es_callback ',
        'score': 10.788822174072266},
    {   'answer': 'monitor the desired metric',
        'context': 'mber of epochs to give the early stopping method some\n'
                   'time to monitor the desired metric for longer before '
                   'stopping the training process:\n'
                   'es_callback ',
        'score': 10.788822174072266},
    {   'answer': 'forcing the Keras model to stop the training when a desired '
                  'metric—for example,\n'
                  'the test error rate—is not improving anymore',
        'context': '. This\n'
                   'means forcing the Keras model to stop the training when a '
                   'desired metric—for example,\n'
                   'the test error rate—is not improving anymore. In order to',
        'score': 8.451149940490723}]
```
DPR response:
```
[   {   'answer': 'forcing the Keras model to stop the training when a desired '
                  'metric—for example,\n'
                  'the test error rate—is not improving anymore',
        'context': '. This\n'
                   'means forcing the Keras model to stop the training when a '
                   'desired metric—for example,\n'
                   'the test error rate—is not improving anymore. In order to',
        'score': 8.451149940490723},
    {   'answer': 'to prevent your Keras model from\n'
                  'overfitting the training data. To do this, you utilized the '
                  'EarlyStopping callback\n'
                  'and trained the model with it. We used this callback to '
                  'stop the model any time the\n'
                  'validation loss increased',
        'context': ' to prevent your Keras model from\n'
                   'overfitting the training data. To do this, you utilized '
                   'the EarlyStopping callback\n'
                   'and trained the model with it. We used this callback to '
                   'stop the model any time the\n'
                   'validation loss increased',
        'score': 8.032074928283691},
    {   'answer': 'training',
        'context': 'ide it as a callbacks\n'
                   'argument to model.fit() and train the model. The training '
                   'will automatically stop\n'
                   'according to the EarlyStopping() callback:\n'
                   'his',
        'score': 7.87277889251709}]
```
## Evaluating 
To be able to evaluate the questionan-answering systems and to compare the two different retrievers, we need labeled data. That is, different documents, questions concerning the documents and the corresponding answers. Here we use a subset of Natural Questions development set containing 50 documents. In particular, there are two datasets. The first one contains 50 documents whoch hold different texts. Each document has its own unique id. The second dataset contains questions about the documents, the document id which holds the answer and the answer itself. 


### Reader
Reader Top-N-Accuracy is the proportion of predicted answers that match with their corresponding correct answer:
```
Top-N-Accuracy: 0.6111
```
Reader Exact Match is the proportion of questions where the predicted answer is exactly the same as the correct answer:
```
Reader Exact Match: 0.2778
```
Reader F1-Score is the average overlap between the predicted answers and the correct answers:
```
Reader F1-Score: 0.3075
```

### Retriever
Retriever Recall is the proportion of questions for which the correct document containing the answer is among the correct documents. For DBR we had that for 52 out of 54 questions (96.30%), the answer was in the top-3 candidate passages selected by the retrievers. For Elasticsearch we had 51 out of 54 (94.44%). Retriever Mean Avg Precision rewards retrievers that give relevant documents a higher rank.

| Retriever | Recall |  Mean Avg Precision |
|:----------|:------:|:-------------------:|
| Elastic   |  0.9444| 0.9259              |
| DPR       |  0.9630| 0.9537              |


