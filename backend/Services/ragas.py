from models import Interaction
from datasets import Dataset
import asyncio
from langchain_ollama import ChatOllama,OllamaEmbeddings
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy
from ragas.run_config import RunConfig

async def test_ragas(chat_id,db,interaction_id):
    try:
        
        interaction = db.query(Interaction).filter(Interaction.id == interaction_id ).first()
        if not interaction:
            return {
                "message": "No interaction found"
            }

        dataset = Dataset.from_list([
            {
                "question": interaction.question,
                "answer": interaction.answer,
                "contexts": [interaction.context]  # Ragas expects a list of strings for contexts
            }
        ])

        OLLAMA_BASE_URL = "http://localhost:11434"
        llm = ChatOllama(model="phi4-mini",base_url=OLLAMA_BASE_URL)
        
        embeddings = OllamaEmbeddings(
            model="nomic-embed-text",
            base_url=OLLAMA_BASE_URL
        )

        # Limit to 1 worker so Ollama doesn't get overwhelmed with concurrent requests.
        # Also give it a huge timeout.
        run_config = RunConfig(timeout=1200, max_workers=1)

        # Run evaluate in a separate background thread where there is no uvloop
        result = await asyncio.to_thread(
            evaluate,
            dataset,
            metrics=[faithfulness, answer_relevancy],
            llm=llm,
            embeddings=embeddings,
            run_config=run_config
        )
        
        return {
            "message": "Ragas test interaction successful",
            # Convert result to dict for JSON serialization, otherwise it might fail
            "data": dict(result) if hasattr(result, "keys") else str(result)
        }
    except Exception as e:
        print(f"Error in test_ragas_interaction: {str(e)}")
        raise Exception(f"Failed to test ragas interaction: {str(e)}")