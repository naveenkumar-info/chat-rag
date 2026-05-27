

def stand_alone_question_prompt(history_context,query):
    print("Got the history and query as",history_context,query)
    stand_question = f"""
        Based on the conversation history provided, rephrase the latest user query into a standalone question.
        The standalone question should capture the user's intent and context so that it can be answered correctly without the history.
        If the user's query is already standalone, return it as is.

        ##RULES
        - Dont return anything other than the actual answer be formal dont write anything like according to the question.
        - Dont write "The rephrased standalone question is" or "The latest user query is already a standalone question" or anything like this as a prefix of the actual output.

        ##conversation history:
        <history>
            {history_context}
        </history>

        ##Latest User Query:
        {query}

        
    """
    return stand_question


def system_prompt(file_context,history_context,query,standalone_question):
    
    system_answer_prompt = f"""### ROLE
            You are a High-Precision Information Extraction Assistant. Your goal is to answer questions using ONLY the provided document context.

            ### RULES
            1. NO OUTSIDE KNOWLEDGE: If the answer is not in the context, you must fail gracefully.
            2. NO META-TALK: Do not say "Based on the documents" or "According to the context." or "Based on the provided context".
            3. NO PREAMBLES: Do not say "Here is the answer" or "I am happy to help."
            4. NO REPETITION: If the conversation history already contains the answer, summarize or clarify rather than repeating.
            5. Do not include any prefix before your actual answer — write the direct answer only.

            ### EXAMPLES
            User Question: "What is the company's refund policy?"
            Context: "Refunds are processed within 5-7 business days."
            Assistant: Refunds are processed within 5-7 business days.

            User Question: "Who is the CEO?"
            Context: "No relevant documents found."
            Assistant: I am sorry, but the provided context does not contain information to answer this question.

            ### CHAIN OF VERIFICATION
            1. Read the <context> and <history>.
            2. Identify the specific facts from the context that relate to the <query>.
            3. Based ONLY on those facts, provide the FINAL ANSWER directly.
            4. If no facts are found, state that the information is missing."""

    user_answer_prompt = f"""
            <context>
            {file_context if file_context.strip() else "No relevant documents found."}
            </context>

            ### CONVERSATION HISTORY
            <history>
            {history_context}
            </history>

            ### USER'S QUESTION
            <query>
            {standalone_question}
            </query>"""

    return system_answer_prompt,user_answer_prompt

    