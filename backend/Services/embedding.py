import httpx
from langsmith import traceable


#Cleaning the text
def clean_text(text):
    return text.strip().replace("\n"," ")
  
#Only including the valid chunks to remove the noise
def valid_chunk(text):
    return len(text) > 30


@traceable(name="get_embedding",run_type="embedding")
async def get_embedding(text: str):
    try:
        
        async with httpx.AsyncClient(timeout=None) as client:
            response = await client.post(
                "http://localhost:11434/api/embed", # 1. Changed from /api/embeddings
                json={
                    "model": "nomic-embed-text",
                    "input": text # 2. Changed from 'prompt' to 'input'
                }
            )
            
            response.raise_for_status()
            result = response.json()
            
            # 3. New API returns a list of embeddings in 'embeddings'
            if "embeddings" not in result or not result["embeddings"]:
                raise ValueError("Ollama response does not contain embedding data")
                
            # We take the first embedding in the list [0]
            return result["embeddings"][0]

    except Exception as e:
        print(f"Error in get_embedding: {str(e)}")
        return None


#Embedding all the chunks
async def embed_chunks(chunks, batch_size=5):
    try:
        if not isinstance(chunks, list):
            raise ValueError("Input chunks must be a list")

        embedded = []
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]

            print("batch: ", batch,flush=True)

            for chunk in batch:
                try:
                    # Basic key verification
                    raw_text = chunk.get("text")
                    if not raw_text:
                        continue

                    metadata = chunk.get("metadata", {})
                    text = clean_text(raw_text)

                    if not valid_chunk(text):
                        continue

                    embedding = await get_embedding(text)

                    embedded.append({
                        "text": text,
                        "embedding": embedding,
                        "metadata": metadata
                    })

                except Exception as inner_e:
                    print(f"Error processing individual chunk: {str(inner_e)}")
                    continue

        return embedded

    except Exception as e:
        print(f"Error in embed_chunks: {str(e)}")
        return []
