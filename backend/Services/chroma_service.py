import chromadb
import os
import uuid

class ChromaService:

    #init the chromaDB
    def __init__(self):
        self.client = chromadb.HttpClient(
            host = os.getenv("CHROMA_HOST","localhost"),
            port = os.getenv("CHROMA_PORT",8001)
        ) #creating a httpclient 

        self.collection = self.client.get_or_create_collection(
            name = "file_storage"
        )#creating a collection if not exist / getting if already there

    #store the embedd
    def store(self,embed_chunks,file_id):
        documents = []
        embeddings = []
        metadatas = []
        ids = []

        #append each item from embed_chunks to collection
        for item in embed_chunks:
            documents.append(item["text"])
            embeddings.append(item["embedding"])

            #also add the matadata
            metadata = item.get("metadata",{})
            metadata["file_id"] = file_id

            metadatas.append(metadata)
            ids.append(str(uuid.uuid4()))


        #now will add it to the collection
        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

    # Now to search in the DB
    def search(self,query_embed,top_k=5,threshold=0.9):

        #we will query the search in the db
        results = self.collection.query(
            query_embed=[query_embed],
            n_results = top_k
        )

        documents = results.get("documents",[[]])[0]
        metadatas = results.get("metadatas",[[]])[0]
        distances = results.get("distances",[[]])[0]

        formatted_res = []

        for doc, meta, dis in zip(documents,metadatas,distances):
            if dis > threshold:
                continue

            formatted_res.append(
                {
                    "text":doc,
                    "metadata":meta,
                    "score":dis
                }
            )
        return formatted_res

    #now lets delete 
    def delete(self,file_id):
        self.collection.delete(
            where={
                "file_id":file_id  
            }#In the .delete in chroma when we use where it specifically checks in the metadata
        )
    # used during testing
    def delete_all(self):
        self.client.delete_collection("file_storage")

        self.collection=self.client.get_or_create_collection(
            name="file_storage"
        ) #reinit the filename after deleting
