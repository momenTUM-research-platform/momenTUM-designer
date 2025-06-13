import openai
from config import settings

OPENAI_API_KEY = settings.openai_api_key
if not OPENAI_API_KEY:
    raise RuntimeError("You must set OPENAI_API_KEY in your environment or config.settings")

openai.api_key = OPENAI_API_KEY

# Use the 32K window model so you can push ~9–10K tokens in your prompt:
MODEL_NAME = "gpt-4"

def generate_filled_study(prompt: str) -> str:
    """
    Sends `prompt` as a single “user” message to gpt-4-32k (OpenAI Python v1 syntax).
    Returns the raw string (we’ll json.loads it downstream in nlp.py).
    """
    response = openai.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        top_p=0.9,
        # max_tokens is the maximum length of the *output*.
        # Make sure prompt_tokens + max_tokens ≤ 32768
        max_tokens=4000,
    )
    return response.choices[0].message.content