import chromadb
import os
import uuid
import asyncio
class ChromaService:

    #init the chromaDB
    def __init__(self):
        try:
            # 1. Initialize the ChromaDB HTTP client
            host = os.getenv("CHROMA_HOST", "localhost")
            port = int(os.getenv("CHROMA_PORT", 8001)) # Ensure port is an integer
            
            self.client = chromadb.HttpClient(
                host=host,
                port=port
            )

            # 2. Get or create the collection
            self.collection = self.client.get_or_create_collection(
                name="file_storage",
                metadata={"hnsw:space": "cosine"}
            )

        except Exception as e:
            # Log the connection or initialization failure
            print(f"Error initializing ChromaDB: {str(e)}")
            # Raise the exception so the app knows the database is unavailable
            raise Exception(f"Could not connect to ChromaDB at {host}:{port}. Error: {str(e)}")
   
   
    #store the embedd
    async def store(self, embed_chunks, file_id):
        try:
            if not embed_chunks:
                print("No chunks provided to store")
                return

            documents = []
            embeddings = []
            metadatas = []
            ids = []

            for item in embed_chunks:
                try:
                    # Safely extract text and embedding
                    text = item.get("text")
                    embedding = item.get("embedding")
                    
                    if not text or not embedding:
                        continue

                    documents.append(text)
                    embeddings.append(embedding)

                    # Prepare metadata
                    metadata = item.get("metadata", {}).copy()
                    metadata["file_id"] = file_id
                    
                    metadatas.append(metadata)
                    ids.append(str(uuid.uuid4()))
                    
                except Exception as inner_e:
                    print(f"Error processing chunk for storage: {str(inner_e)}")
                    continue

            # Final check to ensure we have data before calling ChromaDB
            if documents:
                loop = asyncio.get_running_loop()
                # Run the blocking Chroma call in a separate thread
                await loop.run_in_executor(
                    None, 
                    lambda: self.collection.add(
                        documents=documents,
                        embeddings=embeddings,
                        metadatas=metadatas,
                        ids=ids
                    )
                )
            else:
                print("No valid data found to add to collection")

        except Exception as e:
            print(f"Error in store method: {str(e)}")
            raise Exception(f"Failed to store documents in ChromaDB: {str(e)}")


 # Inside ChromaService.search
    def search(self, query_embed, top_k=5):
        try:
            results = self.collection.query(
                query_embeddings=[query_embed],
                n_results=top_k
            )

            

            documents = results.get("documents", [[]])[0]
            distances = results.get("distances", [[]])[0]
            metadatas = results.get("metadatas", [[]])[0]

            print("results,docs",documents)
            print("results,dis",distances)
            # print("results,meta",metadatas)

            formatted_res = []
            # Cosine distance: 0.1 is very close, 0.8 is loose.
            # Let's use 0.9 as a safe "catch-all" for now.
            for doc, meta, dis in zip(documents, metadatas, distances):
                if dis <= 400: 
                    formatted_res.append({"text": doc, "metadata": meta, "score": dis})
            print("formatted result",formatted_res)
            return formatted_res
        except Exception as e:
            print(f"Search Error: {e}")
            return []
 
 
    #now lets delete 
    def delete(self, file_id):
        try:
            # 1. Validate that file_id is provided
            if not file_id:
                raise ValueError("file_id is required for deletion")

            # 2. Perform the deletion in ChromaDB
            # ChromaDB filters the metadata when the 'where' clause is used
            self.collection.delete(
                where={
                    "file_id": file_id
                }
            )
            
            print(f"Successfully deleted records for file_id: {file_id}")

        except Exception as e:
            # 3. Standardized error logging
            print(f"Error in delete method: {str(e)}")
            # Re-raising so the service layer knows the deletion failed
            raise Exception(f"Failed to delete records from ChromaDB: {str(e)}")

    # used during testing
    def delete_all(self):
        try:
            # 1. Delete the existing collection
            self.client.delete_collection("file_storage")
            print("Collection file_storage deleted successfully")

            # 2. Re-initialize the collection to ensure the app doesn't crash on next use
            self.collection = self.client.get_or_create_collection(
                name="file_storage",
                metadata={"hnsw:space": "cosine"}
            )
            print("Collection file_storage re-initialized successfully")

        except Exception as e:
            # Standardized error logging
            print(f"Error in delete_all method: {str(e)}")
            # Re-raise so the application is aware the operation failed
            raise Exception(f"Failed to clear and reset ChromaDB collection: {str(e)}")