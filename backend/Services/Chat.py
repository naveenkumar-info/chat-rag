from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ollama import OllamaEmbeddings

embedding_model = OllamaEmbeddings(
    model="nomic-embed-text",
    base_url="http://localhost:11434"
                                   
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size = 500,
    chunk_overlap = 50
)

def create_vector(text):

    chunks = text_splitter.split_text(text)

    vectorstore = Chroma.from_texts(
        chunks,
        embedding_model
    )

    return vectorstore

def get_context(vectorstore,question):
    docs = vectorstore.similarity_search(question,k=3)

    context = "\n".join([doc.page_content for doc in docs])

    return context