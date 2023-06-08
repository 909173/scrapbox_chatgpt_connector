import openai
# import readline
import os
import dotenv
from datetime import datetime
from make_index import VectorStore, get_size

# あなたのOpenAI APIキーを設定
dotenv.load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
RETURN_SIZE = 1000
PROMPT = """
You are virtual character. Read sample output of the character in the following sample section. Then reply to the input.
## Sample
{text}
## Input
{input}
""".strip()


MAX_PROMPT_SIZE = 4096

def chat_with_gpt(messages, input_str, index_file):
    PROMPT_SIZE = get_size(PROMPT)
    rest = MAX_PROMPT_SIZE - RETURN_SIZE - PROMPT_SIZE
    input_size = get_size(input_str.join(item["content"] for item in messages))
    while rest < input_size:
        if (len(messages) == 0): 
            raise RuntimeError("too large input!")
        messages.pop(0)
        input_size = get_size(input_str.join(item["content"] for item in messages))
    rest -= input_size

    vs = VectorStore(index_file)
    samples = vs.get_sorted(input_str)

    to_use = []
    used_title = []
    for _sim, body, title in samples:
        if title in used_title:
            continue
        size = get_size(body)
        if rest < size:
            break
        to_use.append(body)
        used_title.append(title)
        rest -= size

    text = "\n\n".join(to_use)
    prompt = PROMPT.format(input=input_str, text=text)
    messages.append({"role": "user", "content": prompt})
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=RETURN_SIZE,
        temperature=0.0,
    )

    return response['choices'][0]['message']['content']
conversation_dir = './conversations'
os.makedirs(conversation_dir, exist_ok=True)
if __name__ == '__main__':
    messages = [{"role": "system", "content": "あなたは親切なAIです。"}]

    print("コマンドライン上でChatGPTと対話を開始します。終了するには'quit'と入力してください。")
    now = datetime.now()
    conversation_id = now.strftime('%Y-%m-%d%H%M%S')
    conversation_file = os.path.join(conversation_dir, f'{conversation_id}.txt')
    while True:
        prompt = input("あなた: ")
        if prompt.lower() == 'quit':
            break

        # messages.append({"role": "user", "content": prompt})

        response = chat_with_gpt(messages, prompt, "mastodon-document.pickle")

        print(f"ChatGPT: {response}\n")
        messages.append({"role": "assistant", "content": response})
        with open(conversation_file, 'a', encoding='utf-8') as f:
            f.write(f"あなた: {prompt}\n")
            f.write(f"ChatGPT: {response}\n")